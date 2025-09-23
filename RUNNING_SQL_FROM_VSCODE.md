# Running SQL Scripts from VS Code

This guide shows you how to easily get SQL scripts formatted for copy-paste into your Supabase Dashboard from VS Code.

## Quick Setup (No Database Connection Required)

The simplest approach - get formatted SQL that you can copy-paste into Supabase:

### Method 1: VS Code Tasks (Recommended)

1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type "Tasks: Run Task"
3. Choose from available tasks:
   - **Show Organization Signup Fix SQL** - Get the signup RLS fix SQL
   - **Show Organization Function Creation SQL** - Get the signup function SQL
   - **Show Diagnostic SQL** - Get diagnostic queries SQL
   - **Show SQL Script for Copy-Paste** - Format the currently open SQL file

### Method 2: npm Scripts

```bash
# Show the organization signup policy fix SQL
npm run sql:show-signup-fix

# Show the organization signup function creation SQL
npm run sql:show-create-function

# Show diagnostic queries SQL
npm run sql:show-diagnose

# Show any SQL file formatted for copy-paste
npm run sql:show scripts/your-script.sql
```

### Method 3: Direct Command

```bash
# Show formatted SQL for any file
node scripts/run-sql-simple.js scripts/fix-organization-signup-policy.sql
```

## Quick Fix for Signup Issue

To fix the organization signup issue:

1. **Get the SQL to copy-paste**:
   ```bash
   npm run sql:show-signup-fix
   ```

2. **Copy the displayed SQL** from the terminal output

3. **Paste into Supabase**:
   - Open Supabase Dashboard → SQL Editor
   - Paste the SQL
   - Click "Run"

4. **Verify the fix** (optional):
   ```bash
   npm run sql:show-diagnose
   ```

## Advanced Setup (Direct Database Execution)

If you want to execute SQL directly from VS Code:

### 1. Get Your Database Password

1. Go to Supabase Dashboard → Settings → Database
2. Find your database password (or reset it if needed)
3. Update `.env.local`:
   ```bash
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.rpbvhtcgtnhzoymhncfa.supabase.co:5432/postgres
   ```

### 2. Create the SQL Execution Function

First, run this once to enable direct execution:
```bash
npm run sql:show-create-function
```
Copy the output and run it in Supabase SQL Editor.

### 3. Use Direct Execution Scripts

The `scripts/run-sql.js` file can then execute SQL directly (requires the exec_sql function).

## Files Created

- `scripts/run-sql-simple.js` - Formats SQL for copy-paste (no DB connection needed)
- `scripts/run-sql.js` - Direct SQL execution (requires DB connection)
- `scripts/create-sql-exec-function.sql` - Creates the SQL execution function
- `.vscode/tasks.json` - VS Code tasks for easy access
- Updated `package.json` with npm scripts

## Troubleshooting

### Can't see the SQL output clearly?
The terminal output is formatted with visual separators. Look for the section between the dashed lines.

### Want to copy just the SQL without extra output?
Use the direct script:
```bash
node scripts/run-sql-simple.js scripts/your-file.sql 2>/dev/null | grep -A 1000 "^─.*─$" | tail -n +2 | grep -B 1000 "^─.*─$" | head -n -1
```

### Prefer a GUI?
Just open the SQL file in VS Code and copy its contents manually to Supabase Dashboard.