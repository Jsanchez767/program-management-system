#!/bin/bash
# Enhanced migration script with multiple execution methods
# Supports REST API, PostgreSQL client, and Node.js execution

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

# Configuration
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://your-project.supabase.co}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-your-service-role-key-here}"

# Check if a migration file is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <migration_file.sql> [method]"
    echo "Methods:"
    echo "  auto      - Try methods in order until one works (default)"
    echo "  psql      - Use PostgreSQL client directly"
    echo "  node      - Use Node.js with Supabase client"
    echo "  rest      - Use REST API (legacy method)"
    echo ""
    echo "Example: $0 scripts/MANUAL_POLICY_CLEANUP.sql psql"
    exit 1
fi

MIGRATION_FILE="$1"
METHOD="${2:-auto}"  # Default to auto method

# Check if the migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    print_error "Migration file '$MIGRATION_FILE' not found."
    exit 1
fi

print_status "Running migration: $MIGRATION_FILE using $METHOD method"

# Method 1: PostgreSQL client (psql)
run_psql() {
    print_status "Trying PostgreSQL client method..."
    if command -v psql &> /dev/null; then
        if [ -z "$SUPABASE_DB_PASSWORD" ]; then
            print_warning "SUPABASE_DB_PASSWORD not set. Please set it in your environment or .env.local"
            return 1
        fi
        DB_URL="postgresql://postgres.${SUPABASE_PROJECT_ID}:${SUPABASE_DB_PASSWORD}@${SUPABASE_DB_HOST}:5432/postgres"
        if psql "$DB_URL" -f "$MIGRATION_FILE" -v ON_ERROR_STOP=1; then
            print_success "Migration executed successfully via psql"
            return 0
        else
            print_error "psql execution failed"
            return 1
        fi
    else
        print_warning "psql not installed"
        return 1
    fi
}

# Method 2: Node.js with Supabase client
run_node() {
    print_status "Trying Node.js method..."
    if [ -f "scripts/run-sql-script.js" ]; then
        if node scripts/run-sql-script.js "$MIGRATION_FILE"; then
            print_success "Migration executed successfully via Node.js"
            return 0
        else
            print_error "Node.js execution failed"
            return 1
        fi
    else
        print_warning "Node.js script runner not found"
        return 1
    fi
}

# Method 3: REST API (legacy)
run_rest() {
    print_status "Trying REST API method..."
    if command -v curl &> /dev/null && command -v jq &> /dev/null; then
        SQL_CONTENT=$(cat "$MIGRATION_FILE")
        RESPONSE=$(curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
          -H "apikey: $SERVICE_ROLE_KEY" \
          -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
          -H "Content-Type: application/json" \
          -d "{\"sql\": $(echo "$SQL_CONTENT" | jq -Rs .)}")
        
        if echo "$RESPONSE" | grep -q "error"; then
            print_error "REST API execution failed: $RESPONSE"
            return 1
        else
            print_success "Migration executed successfully via REST API"
            return 0
        fi
    else
        print_warning "curl or jq not installed"
        return 1
    fi
}

# Execute based on method
case $METHOD in
    "auto")
        print_status "Auto-detecting best execution method..."
        if run_psql; then
            exit 0
        elif run_node; then
            exit 0
        elif run_rest; then
            exit 0
        else
            print_error "All execution methods failed. Please run manually in Supabase SQL Editor"
            exit 1
        fi
        ;;
        
    "psql")
        if run_psql; then
            exit 0
        else
            exit 1
        fi
        ;;
        
    "node")
        if run_node; then
            exit 0
        else
            exit 1
        fi
        ;;
        
    "rest")
        if run_rest; then
            exit 0
        else
            exit 1
        fi
        ;;
        
    *)
        print_error "Unknown method: $METHOD"
        print_error "Available methods: auto, psql, node, rest"
        exit 1
        ;;
esac