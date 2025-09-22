// Check database structure and auth users
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://icbtjcvvogvdwdjkiwem.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljYnRqY3Z2b2d2ZHdkamtpd2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDQ5MTgsImV4cCI6MjA3Mzk4MDkxOH0.g5mCw1kN_h6nhZXvFrfysOpduDcjpxz-y3IiUN-F6wQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseStructure() {
  try {
    console.log('🔍 Checking database structure...')
    
    // Try to get current user (this will work if we're authenticated)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Current auth user:', user ? user.email : 'Not authenticated')
    
    // Check if there's a users table
    const { data: usersTable, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (usersError) {
      console.log('❌ No "users" table found:', usersError.message)
    } else {
      console.log('✅ Found "users" table with', usersTable.length, 'records')
    }
    
    // Check profiles table structure
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (profilesError) {
      console.log('❌ Profiles table error:', profilesError.message)
    } else {
      console.log('✅ Profiles table accessible, found', profiles.length, 'records')
    }
    
    console.log('\n💡 The error suggests:')
    console.log('   - Your profiles table has a foreign key to "users" table')
    console.log('   - But it should reference "auth.users" table')
    console.log('   - We need to fix the foreign key constraint')
    
  } catch (error) {
    console.error('💥 Check failed:', error.message)
  }
}

checkDatabaseStructure()