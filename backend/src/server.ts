import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase admin client
// Using the service role key ideally if you have it, but anon key works for auth
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Multer configuration
const upload = multer({ storage: multer.memoryStorage() });

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Auth service is running' });
});

// Login route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // If the user entered a phone number instead of an email (e.g., no '@' symbol), 
    // format it into the pseudo-email we use for workers
    const cleanEmailStr = email.trim();
    const isPhoneNumber = !cleanEmailStr.includes('@');
    
    const formattedEmail = isPhoneNumber 
      ? `${cleanEmailStr.replace(/[^0-9]/g, '')}@pulse.com`
      : cleanEmailStr;

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: formattedEmail,
      password,
    });

    if (authError) {
      return res.status(401).json({ error: authError.message });
    }

    if (!authData.user) {
      return res.status(401).json({ error: 'User not found after successful auth' });
    }

    // Attempt to fetch role from public.users table
    let role = email.toLowerCase();
    
    // Create an auth-context client using the user's session token to query the DB securely
    // or use the admin client to bypass RLS for fetching the user profile
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .single();
      
    if (profile?.role) {
      role = profile.role.toLowerCase();
    }

    // Return session data and role to frontend
    res.status(200).json({ 
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: role
      },
      session: authData.session
    });
    
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
});

// Add Staff route (Multipart)
app.post('/api/staff', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'documents', maxCount: 5 }
]), async (req: any, res) => {
  try {
    const { first_name, last_name, phone, role, department, date_of_birth, hire_date, emergency_contact, emergency_phone } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!first_name || !phone) {
      return res.status(400).json({ error: 'First name and phone number are required' });
    }

    // Format phone to an email-like string for Supabase Auth
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const pseudoEmail = `${cleanPhone || 'usr' + Date.now()}@pulse.com`;
    const password = first_name.toLowerCase();

    // 1. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: pseudoEmail,
      password: password,
      options: {
        data: {
          first_name,
          last_name,
          full_name: `${first_name} ${last_name}`.trim(),
          role: role.toLowerCase()
        }
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user!.id;

    // 2. Handle Photo Upload
    let photoUrl = null;
    if (files.photo && files.photo[0]) {
      const photoFile = files.photo[0];
      const photoPath = `photos/${userId}/${uuidv4()}-${photoFile.originalname}`;
      
      const { data: photoData, error: photoUploadError } = await supabase.storage
        .from('staff-assets')
        .upload(photoPath, photoFile.buffer, {
          contentType: photoFile.mimetype,
          upsert: true
        });

      if (!photoUploadError) {
        const { data: publicUrlData } = supabase.storage
          .from('staff-assets')
          .getPublicUrl(photoPath);
        photoUrl = publicUrlData.publicUrl;
      }
    }

    // 3. Insert into public.users
    const dbRole = role.toLowerCase().includes('manager') ? 'manager' :
                   role.toLowerCase().includes('admin') ? 'admin' :
                   role.toLowerCase().includes('hr') ? 'hr' : 'staff';

    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: pseudoEmail,
        full_name: `${first_name} ${last_name}`.trim(),
        role: dbRole,
        photo_url: photoUrl,
        status: 'Active'
      });

    if (dbError) {
      console.error('Error inserting into public.users:', dbError);
      return res.status(500).json({ error: 'Failed to save user role data' });
    }

    // 4. Handle Documents Upload
    if (files.documents && files.documents.length > 0) {
      for (const docFile of files.documents) {
        const docPath = `documents/${userId}/${uuidv4()}-${docFile.originalname}`;
        
        const { error: docUploadError } = await supabase.storage
          .from('staff-assets')
          .upload(docPath, docFile.buffer, {
            contentType: docFile.mimetype,
            upsert: true
          });

        if (!docUploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('staff-assets')
            .getPublicUrl(docPath);
          
          // Store document record (assuming a staff_documents table exists or we'll create it)
          await supabase.from('staff_documents').insert({
            staff_id: userId,
            document_name: docFile.originalname,
            document_type: docFile.mimetype,
            document_url: publicUrlData.publicUrl
          });
        }
      }
    }

    res.status(201).json({ 
      success: true, 
      user: authData.user,
      login_credentials: {
        email: pseudoEmail,
        password: password
      }
    });
    
  } catch (error: any) {
    console.error('Add staff error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Staff route
app.get('/api/staff', async (req, res) => {
  try {
    const { data: staff, error } = await supabase
      .from('users')
      .select('*')
      .neq('role', 'admin') // Typically don't show super admins in staff list
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching staff list:', error);
      return res.status(500).json({ error: 'Failed to fetch staff directory' });
    }

    // Map database fields to the frontend HRStaff type exactly
    const formattedStaff = staff.map((user: any) => {
      const nameParts = (user.full_name || 'Unknown').split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      return {
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: user.email || '',
        phone: user.phone || '', // Needs to be added to user table ideally
        date_of_birth: user.date_of_birth || '1990-01-01',
        role: user.role === 'manager' ? 'Supervisor' : 
              user.role === 'hr' ? 'Manager' : 'Sanitation Worker',
        department: 'Operations',
        status: user.status || 'Active',
        hire_date: user.created_at || new Date().toISOString(),
        photo_url: user.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'S')}&background=random&color=fff`,
        emergency_contact: user.emergency_contact || 'None',
        emergency_phone: user.emergency_phone || 'None',
        created_at: user.created_at,
        updated_at: user.updated_at
      };
    });

    res.status(200).json(formattedStaff);
  } catch (error: any) {
    console.error('Fetch staff error:', error);
    res.status(500).json({ error: 'Internal server error while fetching staff' });
  }
});

// Get Individual Staff route
app.get('/api/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !user) {
      console.error('Error fetching staff member:', error);
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Map database fields to the frontend HRStaff profile expectations
    const nameParts = (user.full_name || 'Unknown').split(' ');
    const firstName = user.first_name || nameParts[0];
    const lastName = user.last_name || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');

    const formattedStaff = {
      id: user.id,
      first_name: firstName,
      last_name: lastName,
      email: user.email || '',
      phone: user.phone || '',
      date_of_birth: user.date_of_birth || '1990-01-01',
      role: user.role === 'manager' ? 'Supervisor' : 
            user.role === 'hr' ? 'Manager' : 'Sanitation Worker',
      department: user.department || 'Operations',
      hire_date: user.hire_date || user.created_at || new Date().toISOString(),
      status: user.status || 'Active',
      emergency_contact: user.emergency_contact || 'None',
      emergency_phone: user.emergency_phone || 'None',
      photo_url: user.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'S')}&background=random&color=fff`,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    res.status(200).json(formattedStaff);
  } catch (error: any) {
    console.error('Fetch individual staff error:', error);
    res.status(500).json({ error: 'Internal server error while fetching staff member' });
  }
});

// Update Staff Status route
app.put('/api/staff/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Using select to verify it actually updated something 
    const { data, error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating status:', error);
      return res.status(500).json({ error: 'Failed to update user status in database' });
    }
    
    if (!data || data.length === 0) {
      // Return 403 or 404 so the frontend rejects the local UI change
      return res.status(403).json({ error: 'Permission denied or user not found. Real database change failed.' });
    }

    res.status(200).json({ success: true, message: 'Status updated successfully' });
  } catch (error: any) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Internal server error while updating status' });
  }
});

// Delete Staff route
app.delete('/api/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Select at the end to force validation that a row was actually affected
    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error deleting user profile:', error);
      return res.status(500).json({ error: 'Failed to remove staff profile from database' });
    }
    
    if (!data || data.length === 0) {
      return res.status(403).json({ error: 'Permission denied or user already deleted. Database delete blocked.' });
    }

    res.status(200).json({ success: true, message: 'Staff member deleted' });
  } catch (error: any) {
    console.error('Delete staff error:', error);
    res.status(500).json({ error: 'Internal server error while deleting staff' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Backend Auth Server running on http://localhost:${port}`);
});
