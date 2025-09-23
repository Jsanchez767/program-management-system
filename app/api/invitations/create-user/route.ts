import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create Supabase Admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key for admin operations
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, lastName, role, organizationId, organizationName, invitationId } = await request.json()

    // Validate required fields
    if (!email || !firstName || !lastName || !role || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create user with Supabase Admin API
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: false, // User will need to confirm email
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: role,
        organization_id: organizationId,
        organization_name: organizationName
      }
    })

    if (authError) {
      console.error('Error creating user:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authUser.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 400 }
      )
    }

    // Update invitation with user ID and mark as user created
    const { error: updateError } = await supabaseAdmin
      .from('invitations')
      .update({
        user_id: authUser.user.id,
        status: 'user_created',
        first_name: firstName,
        last_name: lastName
      })
      .eq('id', invitationId)

    if (updateError) {
      console.error('Error updating invitation:', updateError)
      // Don't fail the request as user is created successfully
    }

    return NextResponse.json({
      success: true,
      user: authUser.user,
      message: 'User created successfully. Confirmation email sent.'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}