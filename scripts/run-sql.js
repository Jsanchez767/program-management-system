#!/usr/bin/env node

/**
 * SQL Script Runner for Supabase
 * Usage: node scripts/run-sql.js <sql-file-path>
 * Example: node scripts/run-sql.js scripts/fix-organization-signup-policy.sql
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

    // Create Supabase client with service role key (if available)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl) {
      console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in environment')
      process.exit(1)
    }

    // Use service role key if available, otherwise anon key
    const supabaseKey = serviceRoleKey || anonKey
    if (!supabaseKey) {
      console.error('❌ No Supabase key found in environment')
      process.exit(1)
    }

    console.log(`🔗 Connecting to Supabase: ${supabaseUrl}`)
    console.log(`🔑 Using ${serviceRoleKey ? 'service role' : 'anon'} key`)

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Split SQL content by semicolons and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`📝 Found ${statements.length} SQL statements to execute`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}:`)
      console.log(`   ${statement.substring(0, 80)}${statement.length > 80 ? '...' : ''}`)

      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        })

        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message)
          continue
        }

        console.log(`✅ Statement ${i + 1} executed successfully`)
        if (data) {
          console.log(`📊 Result:`, data)
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err.message)
      }
    }

    console.log('\n🎉 SQL file execution completed!')

  } catch (error) {
    console.error('❌ Error running SQL file:', error.message)
    process.exit(1)
  }
}

// Get file path from command line argument
const filePath = process.argv[2]

if (!filePath) {
  console.error('❌ Usage: node scripts/run-sql.js <sql-file-path>')
  console.error('   Example: node scripts/run-sql.js scripts/fix-organization-signup-policy.sql')
  process.exit(1)
}

runSqlFile(filePath)