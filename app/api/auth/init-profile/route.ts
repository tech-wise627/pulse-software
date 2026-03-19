import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Initialize user profile after authentication
 * This endpoint ensures the user record exists in the users table
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user profile already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'User profile already exists',
        userId: user.id,
      });
    }

    // Create user profile
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Manager',
        role: user.user_metadata?.role || 'manager',
      })
      .select()
      .single();

    if (createError) {
      console.error('[v0] Error creating user profile:', createError);
      return NextResponse.json(
        { error: 'Failed to initialize user profile', details: createError.message },
        { status: 500 }
      );
    }

    console.log('[v0] User profile created successfully:', newUser.id);

    return NextResponse.json({
      success: true,
      message: 'User profile initialized',
      userId: newUser.id,
      role: newUser.role,
    });
  } catch (error) {
    console.error('[v0] Error in POST /api/auth/init-profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
