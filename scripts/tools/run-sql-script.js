const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

class SupabaseScriptRunner {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here'
    );
  }

  // Execute a single SQL statement
  async executeSQL(sql) {
    try {
      // Use the rpc method to call a raw SQL function
      const { data, error } = await this.supabase.rpc('exec_sql', { sql });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      // If exec_sql doesn't exist, try direct query
      try {
        const { data, error: queryError } = await this.supabase
          .from('dummy_table_that_does_not_exist')
          .select('*')
          .limit(0);
        
        // This will fail, but we can use the connection to run raw SQL
        return { success: false, error: 'exec_sql function not available' };
      } catch (e) {
        return { success: false, error: error.message };
      }
    }
  }

  // Parse SQL file into individual statements
  parseSQLFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Split by semicolon but be careful of strings and comments
    const statements = [];
    let current = '';
    let inString = false;
    let inComment = false;
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const nextChar = content[i + 1];
      
      // Handle comments
      if (char === '-' && nextChar === '-' && !inString) {
        inComment = true;
      }
      if (char === '\n' && inComment) {
        inComment = false;
        continue;
      }
      if (inComment) continue;
      
      // Handle strings
      if (char === "'" && !inString) {
        inString = true;
      } else if (char === "'" && inString) {
        inString = false;
      }
      
      // Handle statement separation
      if (char === ';' && !inString) {
        current = current.trim();
        if (current && !current.startsWith('--')) {
          statements.push(current);
        }
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add final statement if exists
    current = current.trim();
    if (current && !current.startsWith('--')) {
      statements.push(current);
    }
    
    return statements;
  }

  // Execute an entire SQL file
  async executeFile(filePath) {
    console.log(`🚀 Executing SQL file: ${path.basename(filePath)}`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      return false;
    }

    const statements = this.parseSQLFile(filePath);
    console.log(`📝 Found ${statements.length} SQL statements`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 50).replace(/\s+/g, ' ') + '...';
      
      console.log(`\n${i + 1}/${statements.length}: ${preview}`);
      
      const result = await this.executeSQL(statement);
      
      if (result.success) {
        console.log('  ✅ Success');
        successCount++;
      } else {
        console.log(`  ❌ Error: ${result.error}`);
        errorCount++;
        
        // Continue on error or stop?
        if (result.error.includes('does not exist') && statement.toLowerCase().includes('drop')) {
          console.log('  ⚠️  Continuing (resource already removed)');
        }
      }
    }

    console.log(`\n📊 Results: ${successCount} success, ${errorCount} errors`);
    return errorCount === 0;
  }
}

// CLI usage
async function main() {
  const scriptPath = process.argv[2];
  
  if (!scriptPath) {
    console.log('Usage: node run-sql-script.js <path-to-sql-file>');
    console.log('Example: node run-sql-script.js scripts/MANUAL_POLICY_CLEANUP.sql');
    process.exit(1);
  }

  const runner = new SupabaseScriptRunner();
  const success = await runner.executeFile(scriptPath);
  
  process.exit(success ? 0 : 1);
}

// Export for use as module
module.exports = SupabaseScriptRunner;

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}