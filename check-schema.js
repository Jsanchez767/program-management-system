const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://icbtjcvvogvdwdjkiwem.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljYnRqY3Z2b2d2ZHdkamtpd2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDQ5MTgsImV4cCI6MjA3Mzk4MDkxOH0.g5mCw1kN_h6nhZXvFrfysOpduDcjpxz-y3IiUN-F6wQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Checking existing Supabase schema...\n');

  try {
    // Check if organizations table exists
    console.log('1. Checking organizations table...');
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);
    
    if (orgError) {
      console.log('❌ Organizations table:', orgError.message);
    } else {
      console.log('✅ Organizations table exists');
      console.log(`   Found ${orgData?.length || 0} organizations`);
    }

    // Check profiles table structure
    console.log('\n2. Checking profiles table...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profileError) {
      console.log('❌ Profiles table:', profileError.message);
    } else {
      console.log('✅ Profiles table exists');
      if (profileData && profileData.length > 0) {
        const profile = profileData[0];
        console.log('   Sample profile structure:');
        Object.keys(profile).forEach(key => {
          console.log(`     - ${key}: ${typeof profile[key]}`);
        });
        console.log(`   Has organization_id: ${profile.hasOwnProperty('organization_id') ? '✅' : '❌'}`);
      }
    }

    // Check programs table structure
    console.log('\n3. Checking programs table...');
    const { data: programData, error: programError } = await supabase
      .from('programs')
      .select('*')
      .limit(1);
    
    if (programError) {
      console.log('❌ Programs table:', programError.message);
    } else {
      console.log('✅ Programs table exists');
      if (programData && programData.length > 0) {
        const program = programData[0];
        console.log(`   Has organization_id: ${program.hasOwnProperty('organization_id') ? '✅' : '❌'}`);
      } else {
        console.log('   Table is empty - cannot check structure');
      }
    }

    // Check current user's profile and organization
    console.log('\n4. Checking current user setup...');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      console.log('✅ User is authenticated:', user.email);
      
      const { data: userProfile, error: userProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (userProfileError) {
        console.log('❌ User profile:', userProfileError.message);
      } else {
        console.log('✅ User profile found:');
        console.log(`   Email: ${userProfile.email}`);
        console.log(`   Role: ${userProfile.role}`);
        console.log(`   Organization ID: ${userProfile.organization_id || 'None'}`);
        
        if (userProfile.organization_id) {
          const { data: userOrg, error: userOrgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', userProfile.organization_id)
            .single();
          
          if (userOrgError) {
            console.log('❌ User organization:', userOrgError.message);
          } else {
            console.log('✅ User organization found:');
            console.log(`   Name: ${userOrg.name}`);
            console.log(`   Slug: ${userOrg.slug}`);
          }
        }
      }
    } else {
      console.log('❌ No authenticated user - testing with anonymous access');
    }

    // Check organization invitations table
    console.log('\n5. Checking organization_invitations table...');
    const { data: inviteData, error: inviteError } = await supabase
      .from('organization_invitations')
      .select('*')
      .limit(1);
    
    if (inviteError) {
      console.log('❌ Organization invitations table:', inviteError.message);
    } else {
      console.log('✅ Organization invitations table exists');
      console.log(`   Found ${inviteData?.length || 0} invitations`);
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkSchema().then(() => {
  console.log('\n🏁 Schema check completed');
});