// Fix existing user - create profile manually if user exists in auth but not in profiles
const { createClient } = require('@supabase/supabase-js')

// You'll need your service role key for this - get it from Supabase dashboard > Settings > API
// For now, we'll use the anon key and see what we can do
const supabaseUrl = 'https://icbtjcvvogvdwdjkiwem.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljYnRqY3Z2b2d2ZHdkamtpd2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDQ5MTgsImV4cCI6MjA3Mzk4MDkxOH0.g5mCw1kN_h6nhZXvFrfysOpduDcjpxz-y3IiUN-F6wQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixUserProfile() {
  try {
    console.log('🔍 Checking current situation...')
    
    // Check profiles table
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
    
    if (profileError) {
      console.error('❌ Error reading profiles:', profileError.message)
      return
    }
    
    console.log(`📊 Found ${profiles.length} profiles in database`)
    if (profiles.length > 0) {
      profiles.forEach(p => console.log(`   - ${p.email} (${p.role})`))
    }
    
    // Try to create a profile manually for jsanchez@maticslab.com
    // We'll need to guess the user ID or use a known one
    
    console.log('\n🔧 Attempting to create profile manually...')
    console.log('⚠️  Note: This requires the auth user to already exist')
    
    // Try to sign in to get the user ID (this is a workaround)
    console.log('\n💡 To fix this properly:')
    console.log('1. Run the SQL script: scripts/010_fix_user_creation_trigger.sql in Supabase')
    console.log('2. Then try signing up again with jsanchez@maticslab.com')
    console.log('3. Or if you already signed up, the profile should be created automatically')
    
    // Let's check if we can manually insert with a specific ID
    // You can get this ID from the Supabase auth dashboard
    const testUserId = 'e2fb301b-d907-4f31-bee1-c659ae5b2e15' // Replace with actual ID
    
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        email: 'jsanchez@maticslab.com',
        first_name: 'Jesus',
        last_name: 'Sanchez',
        role: 'admin'
      })
      .select()
    
    if (insertError) {
      console.log('\n❌ Manual insert failed:', insertError.message)
      if (insertError.message.includes('violates foreign key')) {
        console.log('   This means the auth user doesn\'t exist yet')
        console.log('   Solution: Complete the signup process first')
      }
    } else {
      console.log('✅ Profile created manually!')
      console.log('🎉 You can now login with jsanchez@maticslab.com')
    }
    
  } catch (error) {
    console.error('💥 Script failed:', error.message)
  }
}

fixUserProfile()