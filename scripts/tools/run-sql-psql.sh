#!/bin/bash

# PostgreSQL Script Runner for Supabase
# Automatically runs SQL scripts using psql client

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if psql is installed
check_psql() {
    if ! command -v psql &> /dev/null; then
        print_error "psql is not installed. Please install PostgreSQL client:"
        echo "  macOS: brew install postgresql"
        echo "  Ubuntu: sudo apt-get install postgresql-client"
        echo "  Windows: Download from https://www.postgresql.org/download/"
        exit 1
    fi
}

# Get database connection info
get_db_connection() {
    # Try to get from environment or .env.local
    if [ -f .env.local ]; then
        source .env.local
    fi
    
    if [ -z "$SUPABASE_DB_PASSWORD" ]; then
        print_warning "SUPABASE_DB_PASSWORD not set in environment"
        echo "Please get your database password from:"
        echo "1. Go to your Supabase project dashboard"
        echo "2. Settings → Database"
        echo "3. Copy the password"
        echo ""
        read -s -p "Enter your Supabase database password: " SUPABASE_DB_PASSWORD
        echo ""
    fi
    
    # Construct connection string from environment variables
    SUPABASE_PROJECT_ID="${SUPABASE_PROJECT_ID:-your-project-id}"
    SUPABASE_DB_HOST="${SUPABASE_DB_HOST:-aws-0-us-west-1.pooler.supabase.com}"
    DB_URL="postgresql://postgres.${SUPABASE_PROJECT_ID}:${SUPABASE_DB_PASSWORD}@${SUPABASE_DB_HOST}:5432/postgres"
}

# Execute SQL file
execute_sql_file() {
    local sql_file="$1"
    
    if [ ! -f "$sql_file" ]; then
        print_error "SQL file not found: $sql_file"
        exit 1
    fi
    
    print_status "Executing SQL file: $(basename "$sql_file")"
    
    # Execute the SQL file
    if psql "$DB_URL" -f "$sql_file" -v ON_ERROR_STOP=1; then
        print_success "SQL file executed successfully"
        return 0
    else
        print_error "Failed to execute SQL file"
        return 1
    fi
}

# Main function
main() {
    local sql_file="$1"
    
    if [ -z "$sql_file" ]; then
        echo "Usage: $0 <path-to-sql-file>"
        echo "Example: $0 scripts/MANUAL_POLICY_CLEANUP.sql"
        exit 1
    fi
    
    print_status "Starting SQL script execution..."
    
    check_psql
    get_db_connection
    execute_sql_file "$sql_file"
    
    print_success "Script execution completed!"
}

# Run main function with all arguments
main "$@"