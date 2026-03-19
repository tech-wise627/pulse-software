import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, turnstileToken } = await request.json()
    
    // Cloudflare Turnstile Verification
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret && turnstileToken) {
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: turnstileSecret,
          response: turnstileToken,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return NextResponse.json({ 
          error: 'Bot protection failed', 
          details: 'Please ensure you are human and try again.' 
        }, { status: 403 });
      }
    } else if (turnstileSecret && !turnstileToken) {
       return NextResponse.json({ 
          error: 'Bot protection required', 
          details: 'Please complete the security check.' 
        }, { status: 403 });
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Missing Configuration', 
        details: 'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in Vercel environment variables.' 
      }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Format phone to pseudo-email if needed (inherited from previous backend logic)
    const cleanEmailStr = email.trim()
    const isPhoneNumber = !cleanEmailStr.includes('@')
    const formattedEmail = isPhoneNumber 
      ? `${cleanEmailStr.replace(/[^0-9]/g, '')}@pulse.com`
      : cleanEmailStr

    // Sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: formattedEmail,
      password,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 401 })
    }

    // Fetch role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .single()
      
    const role = profile?.role?.toLowerCase() || 'staff'

    return NextResponse.json({ 
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: role
      },
      session: authData.session
    })
    
  } catch (error: any) {
    console.error('Login API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
