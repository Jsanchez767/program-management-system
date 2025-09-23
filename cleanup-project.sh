#!/bin/bash

# Project Cleanup Script
# This script removes old files and organizes the project structure

echo "🧹 Starting project cleanup..."

# Create a cleanup backup directory for anything we're unsure about
mkdir -p .cleanup-backup

echo "1. 🗂️  Removing migration backup directories..."
if [ -d ".migration-backup" ]; then
    mv .migration-backup .cleanup-backup/
    echo "   ✅ Moved .migration-backup to .cleanup-backup/"
fi

if [ -d ".migration-backup-20250923_010659" ]; then
    mv .migration-backup-20250923_010659 .cleanup-backup/
    echo "   ✅ Moved .migration-backup-20250923_010659 to .cleanup-backup/"
fi

echo "2. 📄 Organizing documentation files..."

# Create a docs/archive directory for old documentation
mkdir -p docs/archive

# Move old migration documentation to archive
docs_to_archive=(
    "ARCHITECTURE_FIX_SUMMARY.md"
    "CLEANUP_COMPLETE.md" 
    "CLEANUP_SUMMARY.md"
    "DATABASE_UPDATES.md"
    "MIGRATION_GUIDE.md"
    "ORGANIZATION_COMPLETE.md"
    "PROGRAMS_TO_ACTIVITIES_MIGRATION.md"
    "REALTIME_SETUP.md"
    "USER_METADATA_ARCHITECTURE.md"
)

for doc in "${docs_to_archive[@]}"; do
    if [ -f "$doc" ]; then
        mv "$doc" docs/archive/
        echo "   ✅ Archived $doc"
    fi
done

echo "3. 🗄️  Organizing script files..."

# Create scripts/archive for old migration scripts  
mkdir -p scripts/archive

# Move old migration scripts to archive
scripts_to_archive=(
    "scripts/CLEANUP_DUPLICATE_POLICIES.sql"
    "scripts/CLEANUP_SUMMARY.md" 
    "scripts/CREATE_EXEC_SQL_FUNCTION.sql"
    "scripts/DIAGNOSE_SIGNUP_ISSUES.sql"
    "scripts/MANUAL_POLICY_CLEANUP.sql"
    "scripts/TEST_SIGNUP_STEP_BY_STEP.sql"
    "scripts/create-storage-bucket.sql"
    "scripts/final-cleanup-audit.sh"
    "scripts/migrate-code-programs-to-activities.sh"
    "scripts/rename-programs-to-activities.sql"
    "scripts/run_in_sql_editor.sql"
    "scripts/update-rls-policies.sql" 
    "scripts/update-specific-rls-policies.sql"
    "scripts/user-metadata-update-pattern.sql"
)

for script in "${scripts_to_archive[@]}"; do
    if [ -f "$script" ]; then
        mv "$script" scripts/archive/
        echo "   ✅ Archived $(basename $script)"
    fi
done

echo "4. 🗑️  Removing old root files..."

# Remove old files that are no longer needed
old_files=(
    "SECURE_PROGRAM_RPC.sql"
    "run_migration_v2.sh"
    "migrate-codebase.sh"
    "setup_new_database.sh"
    "test_supabase_connection.js"
)

for file in "${old_files[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        echo "   ✅ Deleted $file"
    fi
done

echo "5. 📁 Checking for empty directories..."

# Remove empty directories
find . -type d -empty -not -path "./.git/*" -not -path "./node_modules/*" -delete 2>/dev/null

echo "6. 📊 Creating project structure summary..."

# Create a clean project structure file
cat > PROJECT_STRUCTURE.md << 'EOF'
# Project Structure

## Current Active Files

### Core Application
- `app/` - Next.js 14 application pages and components
- `components/` - Reusable UI components  
- `lib/` - Utility libraries and database connections
- `hooks/` - React hooks
- `styles/` - CSS and styling files

### Configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `next.config.mjs` - Next.js configuration
- `.env.local` - Environment variables (not committed)

### Documentation  
- `README.md` - Main project documentation
- `RUNNING_SQL_FROM_VSCODE.md` - SQL execution guide
- `FIX_SIGNUP_ISSUE.md` - Signup troubleshooting
- `TROUBLESHOOTING_ACTIVITY_CREATION.md` - Activity creation guide

### Scripts (Active)
- `scripts/run-sql-simple.js` - SQL script formatter
- `scripts/run-sql.js` - Direct SQL execution  
- `scripts/fix-organization-signup-policy.sql` - Signup fix
- `scripts/fix-foreign-key-constraints.sql` - FK constraint fix
- `scripts/create-organization-signup-function.sql` - Signup function
- `scripts/diagnose-*.sql` - Diagnostic queries

### Archives
- `docs/archive/` - Old migration documentation
- `scripts/archive/` - Old migration scripts
- `.cleanup-backup/` - Migration backups

## Key Features
- ✅ Activities management (migrated from programs)
- ✅ Multi-tenant organization system
- ✅ User roles (admin, staff, participant)  
- ✅ Real-time updates via Supabase
- ✅ Row-level security (RLS) policies
- ✅ Inline editing for activities table
- ✅ VS Code integration for SQL scripts
EOF

echo ""
echo "🎉 Cleanup completed successfully!"
echo ""
echo "📋 Summary:"
echo "   - Moved migration backups to .cleanup-backup/"
echo "   - Archived old documentation to docs/archive/"  
echo "   - Archived old scripts to scripts/archive/"
echo "   - Removed obsolete root files"
echo "   - Created PROJECT_STRUCTURE.md"
echo ""
echo "🔍 Current active files are organized and ready for development!"
echo "📁 Old files are safely archived and can be removed later if needed."