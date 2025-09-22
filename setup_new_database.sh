#!/bin/bash
# Script to run all core migrations for the new Supabase database
# This script will execute all migration files in the correct order

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
    print_status "Loaded environment variables from .env.local"
else
    print_error ".env.local file not found. Please create it with your Supabase credentials."
    exit 1
fi

# Check required environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    print_error "NEXT_PUBLIC_SUPABASE_URL environment variable is not set"
    exit 1
fi

# Extract database URL components
SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL"
PROJECT_REF=$(echo $SUPABASE_URL | sed 's/.*\/\/\([^.]*\).*/\1/')

print_status "Project reference: $PROJECT_REF"
print_warning "To run these migrations, you'll need your database password."
print_warning "You can find it in your Supabase dashboard under Settings > Database"
echo ""

# Build the PostgreSQL connection URL
DB_HOST="db.${PROJECT_REF}.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

print_status "Database connection details:"
print_status "Host: $DB_HOST"
print_status "Port: $DB_PORT"
print_status "Database: $DB_NAME"
print_status "User: $DB_USER"
echo ""

# Ask for database password
read -s -p "Enter your Supabase database password: " DB_PASSWORD
echo ""

# Construct the connection URL
DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Migration files in order
MIGRATION_FILES=(
    "scripts/migrations/core/001_create_users_only.sql"
    "scripts/migrations/core/002_create_programs.sql"
    "scripts/migrations/core/003_create_participants.sql"
    "scripts/migrations/core/004_create_announcements.sql"
    "scripts/migrations/core/005_create_documents.sql"
    "scripts/migrations/core/006_create_lesson_plans.sql"
    "scripts/migrations/core/007_create_purchase_orders.sql"
    "scripts/migrations/core/008_create_field_trips.sql"
    "scripts/migrations/core/009_create_organizations.sql"
    "scripts/migrations/core/010_multi_tenant_policies.sql"
    "scripts/migrations/core/011_fix_rls_signup.sql"
    "scripts/migrations/core/013_user_metadata_rls_policies.sql"
    "scripts/migrations/core/015_add_organization_id_to_participants.sql"
    "scripts/migrations/core/016_add_organization_id_to_remaining_tables.sql"
    "scripts/migrations/core/017_add_custom_fields_jsonb.sql"
    "scripts/migrations/core/021_update_rls_for_user_metadata.sql"
    "scripts/migrations/core/022_create_instructor_metadata_function.sql"
    "scripts/migrations/core/023_migrate_all_user_metadata.sql"
    "scripts/migrations/core/024_drop_profiles_table.sql"
)

print_status "Starting migration process..."
echo ""

# Run each migration
for migration in "${MIGRATION_FILES[@]}"; do
    if [ -f "$migration" ]; then
        print_status "Running migration: $(basename $migration)"
        
        if psql "$DB_URL" -f "$migration" > /dev/null 2>&1; then
            print_success "✓ $(basename $migration) completed successfully"
        else
            print_error "✗ $(basename $migration) failed"
            print_warning "You may need to manually review and run the remaining migrations"
            exit 1
        fi
    else
        print_warning "Migration file not found: $migration"
    fi
done

echo ""
print_success "All migrations completed successfully!"
print_status "Your Supabase database is now ready for use."