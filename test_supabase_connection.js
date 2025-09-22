#!/usr/bin/env node
// Simple test script to verify Supabase connection

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local file manually
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables:');
    if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseKey) console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }
  
  console.log('✅ Environment variables loaded');
  console.log(`📍 URL: ${supabaseUrl}`);
  console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...`);
  console.log('');
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Test basic connection using auth
    console.log('🔌 Testing basic connection...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Connection test failed:', authError.message);
      return false;
    }
    
    console.log('✅ Successfully connected to Supabase!');
    
    // Test auth functionality
    console.log('\n🔐 Testing auth functionality...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.warn('⚠️  Auth test warning:', sessionError.message);
    } else {
      console.log('✅ Auth functionality is working');
    }
    
    return true;
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    return false;
  }
}

// Run the test
testConnection()
  .then((success) => {
    if (success) {
      console.log('\n🎉 All tests passed! Your Supabase setup is ready.');
    } else {
      console.log('\n❌ Some tests failed. Please check your configuration.');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('\n💥 Test script failed:', err.message);
    process.exit(1);
  });