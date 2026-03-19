import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Missing Configuration', 
        details: 'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in Vercel environment variables.' 
      }, { status: 400 })
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    console.log(`[v0] Fetch staff list. Service Role: ${serviceRoleKey ? 'YES' : 'NO'}`)
    const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseKey)

    // Self-healing migration: ensure telemetry columns exist
    if (serviceRoleKey) {
      try {
        await supabase.rpc('run_migration', {
          sql: `
            ALTER TABLE public.users 
              ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
              ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
              ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP WITH TIME ZONE;
          `
        })
      } catch (_migErr) {
        // rpc may not exist — fall through, columns may already exist or will be added manually
      }
    }

    // Try fetching with location columns first; fall back without them if they don't exist yet
    let staff: any[] | null = null
    let error: any = null;

    ({ data: staff, error } = await supabase
      .from('users')
      .select('*, staff_photos(photo_url), latitude, longitude, last_location_update')
      .neq('role', 'admin')
      .order('created_at', { ascending: false }))

    // If columns still don't exist, retry without them
    if (error && error.message?.includes('does not exist')) {
      console.warn('[v0] Location columns missing, falling back to query without them:', error.message)
      ;({ data: staff, error } = await supabase
        .from('users')
        .select('*, staff_photos(photo_url)')
        .neq('role', 'admin')
        .order('created_at', { ascending: false }))
    }

    if (error) throw error
    if (!staff) return NextResponse.json([])

    const formattedStaff = staff.map((user: any) => {
      const nameParts = (user.full_name || 'Unknown').split(' ')
      return {
        id: user.id,
        first_name: nameParts[0],
        last_name: nameParts.length > 1 ? nameParts.slice(1).join(' ') : '',
        email: user.email || '',
        phone: user.phone || '',
        date_of_birth: user.date_of_birth || '1990-01-01',
        role: user.role === 'manager' ? 'Supervisor' : user.role === 'hr' ? 'Manager' : 'Sanitation Worker',
        department: 'Operations',
        status: user.status || 'Active',
        hire_date: user.created_at || new Date().toISOString(),
        photo_url: user.photo_url || (user.staff_photos?.[0]?.photo_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'S')}&background=random&color=fff`,
        emergency_contact: user.emergency_contact || 'None',
        emergency_phone: user.emergency_phone || 'None',
        latitude: user.latitude ?? null,
        longitude: user.longitude ?? null,
        last_location_update: user.last_location_update ?? null,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    })

    return NextResponse.json(formattedStaff)
  } catch (error: any) {
    console.error('Fetch staff API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const first_name = formData.get('first_name') as string
    const last_name = formData.get('last_name') as string
    const phone = formData.get('phone') as string
    const role = formData.get('role') as string
    
    // Files
    const photoFile = formData.get('photo') as File | null
    const docFiles = formData.getAll('documents') as File[]

    if (!first_name || !phone) {
      return NextResponse.json({ error: 'First name and phone number are required' }, { status: 400 })
    }

    console.log('[v0] API Request received. Keys:', Array.from(formData.keys()))
    if (photoFile) {
      console.log(`[v0] photoFile detected: name=${photoFile.name}, size=${photoFile.size}, type=${photoFile.type}`)
    } else {
      console.log('[v0] No photoFile found in FormData')
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Missing Configuration', 
        details: 'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in environment variables.' 
      }, { status: 400 })
    }

    // Use service role if available for robust user management
    console.log(`[v0] Supabase client init. Service Role: ${serviceRoleKey ? 'YES' : 'NO (using Anon Key - RLS will apply)'}`)
    const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseKey)

    const cleanPhone = phone.replace(/[^0-9]/g, '')
    const pseudoEmail = `${cleanPhone || 'usr' + Date.now()}@pulse.com`
    const password = first_name.toLowerCase()

    // 1. Calculate DB Role
    const dbRole = role.toLowerCase().includes('manager') ? 'manager' :
                   role.toLowerCase().includes('admin') ? 'admin' :
                   role.toLowerCase().includes('hr') ? 'hr' : 'staff'

    let userId: string

    if (serviceRoleKey) {
      // Robust flow with Admin privileges
      console.log(`[v0] Attempting admin user creation for: ${pseudoEmail}`)
      
      // Check if user already exists in auth
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
      const existingUser = users?.find(u => u.email === pseudoEmail)

      if (existingUser) {
        console.log(`[v0] User already exists in auth: ${existingUser.id}`)
        userId = existingUser.id
      } else {
        const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
          email: pseudoEmail,
          password,
          email_confirm: true,
          user_metadata: {
            first_name,
            last_name,
            full_name: `${first_name} ${last_name}`.trim(),
            role: dbRole
          }
        })

        if (adminError) {
          console.error('Admin user creation error:', adminError)
          throw adminError
        }
        userId = adminData.user!.id
      }
    } else {
      // Fallback to regular signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: pseudoEmail,
        password,
        options: {
          data: {
            first_name,
            last_name,
            full_name: `${first_name} ${last_name}`.trim(),
            role: dbRole
          }
        }
      })

      if (authError) throw authError
      userId = authData.user!.id
    }

    // 2. Upload Photo
    let photoUrl = null
    if (photoFile && photoFile.size > 0) {
      console.log(`[v0] Processing photo: ${photoFile.name}, size: ${photoFile.size} bytes`)
      
      // Ensure bucket exists first
      try {
        const { data: buckets } = await supabase.storage.listBuckets()
        if (!buckets?.find(b => b.name === 'staff-assets')) {
          console.log('[v0] Creating staff-assets bucket...')
          await supabase.storage.createBucket('staff-assets', { public: true })
        }
      } catch (err) {
        console.warn('[v0] Error checking/creating bucket:', err)
      }

      const photoPath = `${userId}/profile_${Date.now()}.jpg`
      const buffer = Buffer.from(await photoFile.arrayBuffer())
      
      const { error: uploadError } = await supabase.storage
        .from('staff-assets')
        .upload(photoPath, buffer, { 
          contentType: 'image/jpeg',
          upsert: true 
        })

      if (uploadError) {
        console.error('Photo upload failed:', uploadError)
        // We throw here now to make the error visible to the user
        throw new Error(`Photo upload failed: ${uploadError.message}`)
      }

      const { data: publicUrlData } = supabase.storage.from('staff-assets').getPublicUrl(photoPath)
      photoUrl = publicUrlData.publicUrl
      console.log(`[v0] Photo upload successful: ${photoUrl}`)

      // Also save to staff_photos table for extra redundancy
      await supabase.from('staff_photos').insert({
        staff_id: userId,
        photo_url: photoUrl
      })
    }

    // 3. Insert/Update into users table
    const { error: dbError } = await supabase.from('users').upsert({
      id: userId,
      email: pseudoEmail,
      full_name: `${first_name} ${last_name}`.trim(),
      role: dbRole,
      phone: phone,
      date_of_birth: formData.get('date_of_birth') as string,
      department: formData.get('department') as string || 'Operations',
      hire_date: formData.get('hire_date') as string || new Date().toISOString().split('T')[0],
      photo_url: photoUrl,
      emergency_contact: formData.get('emergency_contact') as string,
      emergency_phone: formData.get('emergency_phone') as string,
      status: 'Active'
    })

    if (dbError) {
      console.error('Database upsert failed:', dbError)
      throw new Error(`Database save failed: ${dbError.message}`)
    }

    // 4. Upload Documents
    for (const doc of docFiles) {
      if (doc.size === 0) continue
      const docPath = `documents/${userId}/${crypto.randomUUID()}-${doc.name}`
      const buffer = Buffer.from(await doc.arrayBuffer())
      const { error: docUploadError } = await supabase.storage
        .from('staff-assets')
        .upload(docPath, buffer, { contentType: doc.type })

      if (!docUploadError) {
        const docUrl = supabase.storage.from('staff-assets').getPublicUrl(docPath).data.publicUrl
        await supabase.from('staff_documents').insert({
          staff_id: userId,
          document_name: doc.name,
          document_type: doc.type,
          document_url: docUrl
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      login_credentials: { email: pseudoEmail, password }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Add staff API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
