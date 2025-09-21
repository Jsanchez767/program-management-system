#!/bin/bash
# run_migration.sh - Run SQL migration using Supabase REST API

SCRIPT_FILE=$1
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://your-project.supabase.co}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-your-service-role-key-here}"

if [ -z "$SCRIPT_FILE" ]; then
    echo "Usage: $0 <script_file>"
    echo "Example: $0 scripts/migrations/core/001_create_users_only.sql"
    echo ""
    echo "Make sure to set environment variables:"
    echo "  NEXT_PUBLIC_SUPABASE_URL=your-supabase-url"
    echo "  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    exit 1
fi

if [ ! -f "$SCRIPT_FILE" ]; then
    echo "Error: File $SCRIPT_FILE does not exist"
    exit 1
fi

echo "Running migration: $SCRIPT_FILE"

# Read the SQL file content
SQL_CONTENT=$(cat "$SCRIPT_FILE")

# Run the SQL using Supabase REST API
curl -X POST "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": $(echo "$SQL_CONTENT" | jq -Rs .)}"

echo ""
echo "Migration completed: $SCRIPT_FILE"