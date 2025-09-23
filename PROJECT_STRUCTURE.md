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
