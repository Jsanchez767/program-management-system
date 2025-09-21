// Manual setup script - creates admin user profile
// Run this AFTER you've signed up through the auth system

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://icbtjcvvogvdwdjkiwem.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljYnRqY3Z2b2d2ZHdkamtpd2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDQ5MTgsImV4cCI6MjA3Mzk4MDkxOH0.g5mCw1kN_h6nhZXvFrfysOpduDcjpxz-y3IiUN-F6wQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupInitialAdmin() {
  try {
    console.log('🚀 Setting up initial admin user...')
    
    // For testing, let's create a manual profile entry
    // In production, this would be done through the signup flow
    
    // Generate a UUID for the admin user (this should match the auth.users id)
    const adminId = 'e2fb301b-d907-4f31-bee1-c659ae5b2e15' // You'd get this from Supabase auth
    
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: adminId,
        email: 'jsanchez@maticslab.com',
        first_name: 'Jesus',
        last_name: 'Sanchez',
        role: 'admin',
        phone: '555-0123'
      })
      .select()
    
    if (error) {
      console.error('❌ Error creating profile:', error.message)
      
      // Let's check what the exact error is
      if (error.message.includes('violates foreign key')) {
        console.log('\n💡 This error means you need to sign up first!')
        console.log('   The profile.id must match an existing auth.users.id')
        console.log('\n📝 Steps to fix:')
        console.log('   1. Go to http://localhost:3000/auth/signup')
        console.log('   2. Sign up with jsanchez@maticslab.com')
        console.log('   3. This will automatically create a profile')
        console.log('   4. Then run: node update-role.js')
      }
    } else {
      console.log('✅ Admin profile created successfully!')
      console.log('   Email: jsanchez@maticslab.com')
      console.log('   Role: admin')
      console.log('\n🎉 You can now login and access /admin')
    }
    
  } catch (error) {
    console.error('💥 Setup failed:', error.message)
  }
}

setupInitialAdmin()