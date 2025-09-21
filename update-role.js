// Update user role to admin after signup
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://icbtjcvvogvdwdjkiwem.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljYnRqY3Z2b2d2ZHdkamtpd2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDQ5MTgsImV4cCI6MjA3Mzk4MDkxOH0.g5mCw1kN_h6nhZXvFrfysOpduDcjpxz-y3IiUN-F6wQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateToAdmin() {
  try {
    console.log('🔍 Looking for jsanchez@maticslab.com profile...')
    
    const { data: profile, error: findError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'jsanchez@maticslab.com')
      .single()
    
    if (findError) {
      console.error('❌ Profile not found:', findError.message)
      console.log('\n📝 You need to sign up first:')
      console.log('   1. Go to http://localhost:3000/auth/signup')
      console.log('   2. Sign up with jsanchez@maticslab.com')
      console.log('   3. Then run this script again')
      return
    }
    
    console.log('✅ Found profile:', profile.email, 'Current role:', profile.role)
    
    if (profile.role === 'admin') {
      console.log('✅ Already admin! You can login now.')
      return
    }
    
    // Update role to admin
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('email', 'jsanchez@maticslab.com')
    
    if (updateError) {
      console.error('❌ Error updating role:', updateError.message)
    } else {
      console.log('✅ Role updated to admin!')
      console.log('🎉 You can now login and access /admin')
    }
    
  } catch (error) {
    console.error('💥 Update failed:', error.message)
  }
}

updateToAdmin()