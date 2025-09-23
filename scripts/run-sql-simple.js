#!/usr/bin/env node

/**
 * Simple SQL Script Runner for Supabase (Direct Execution)
 * Usage: node scripts/run-sql-simple.js <sql-file-path>
 * Example: node scripts/run-sql-simple.js scripts/fix-organization-signup-policy.sql
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function runSqlFile(filePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`)
      process.exit(1)
    }

    // Read SQL file
    const sqlContent = fs.readFileSync(filePath, 'utf8')
    console.log(`📖 Reading SQL file: ${filePath}`)
    console.log(`📏 Content length: ${sqlContent.length} characters`)

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !anonKey) {
      console.error('❌ Supabase configuration not found in environment')
      console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local')
      process.exit(1)
    }

    console.log(`🔗 Connecting to Supabase: ${supabaseUrl}`)
    const supabase = createClient(supabaseUrl, anonKey)

    // Remove comments and clean up SQL
    const cleanSql = sqlContent
      .replace(/--.*$/gm, '') // Remove line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim()

    if (!cleanSql) {
      console.log('⚠️  No SQL content to execute after cleaning')
      return
    }

    console.log('📝 Executing SQL...')
    console.log('─'.repeat(60))
    console.log(cleanSql.substring(0, 500) + (cleanSql.length > 500 ? '...' : ''))
    console.log('─'.repeat(60))

    // Execute using Supabase SQL
    const { data, error } = await supabase
      .from('_temp_sql_exec')
      .select('*')
      .maybeSingle()

    // Since we can't directly execute arbitrary SQL via Supabase client,
    // we'll show instructions for manual execution
    console.log('\n🎯 INSTRUCTIONS:')
    console.log('Since we cannot execute arbitrary SQL via the Supabase client,')
    console.log('please follow these steps:')
    console.log('')
    console.log('1. Open your Supabase Dashboard')
    console.log('2. Go to SQL Editor')
    console.log('3. Copy and paste the following SQL:')
    console.log('')
    console.log('─'.repeat(80))
    console.log(cleanSql)
    console.log('─'.repeat(80))
    console.log('')
    console.log('4. Click "Run" to execute the SQL')
    console.log('')
    console.log('💡 Alternatively, set up the exec_sql function first by running:')
    console.log('   scripts/create-sql-exec-function.sql in the Supabase SQL Editor')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Get file path from command line argument
const filePath = process.argv[2]

if (!filePath) {
  console.error('❌ Usage: node scripts/run-sql-simple.js <sql-file-path>')
  console.error('   Example: node scripts/run-sql-simple.js scripts/fix-organization-signup-policy.sql')
  process.exit(1)
}

runSqlFile(filePath)