import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create Supabase Admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { invitationId } = await request.json()

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      )
    }

    // Get the invitation details
    const { data: invitation, error: fetchError } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .single()

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // If user is already created, resend email confirmation
    if (invitation.user_id) {
      const { error: resendError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: invitation.email
      })

      if (resendError) {
        console.error('Error resending confirmation:', resendError)
        return NextResponse.json(
          { error: 'Failed to resend confirmation email' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Confirmation email resent successfully'
      })
    }

    // If user not created yet, just update the expiry date
    const newExpiryDate = new Date()
    newExpiryDate.setDate(newExpiryDate.getDate() + 7) // Extend by 7 days

    const { error: updateError } = await supabaseAdmin
      .from('invitations')
      .update({
        expires_at: newExpiryDate.toISOString(),
        status: 'pending'
      })
      .eq('id', invitationId)

    if (updateError) {
      console.error('Error updating invitation:', updateError)
      return NextResponse.json(
        { error: 'Failed to resend invitation' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation resent successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}