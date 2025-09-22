#!/bin/bash

# Debug signup database error by checking for triggers and functions
# that might still reference the profiles table

echo "🔍 Checking for database triggers and functions that might cause signup errors..."

# Set up Supabase credentials
SUPABASE_URL="https://icbtjcvvogvdwdjkiwem.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljYnRqY3Z2b2d2ZHdkamtpd2VtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQwNDkxOCwiZXhwIjoyMDczOTgwOTE4fQ.sUBYdRaxVfAkjMvtTeLNh4SwzbORuK1cuQRlXJKWI9Y"

echo "1. Checking for triggers on auth.users table..."
curl -X POST "$SUPABASE_URL/rest/v1/rpc/execute_sql" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT trigger_name, event_manipulation, action_statement, action_timing FROM information_schema.triggers WHERE event_object_table = '\''users'\'' AND event_object_schema = '\''auth'\'';"
  }'

echo -e "\n\n2. Checking for functions that reference profiles..."
curl -X POST "$SUPABASE_URL/rest/v1/rpc/execute_sql" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT proname as function_name, prosrc as function_body FROM pg_proc WHERE prosrc ILIKE '\''%profiles%'\'' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = '\''public'\'');"
  }'

echo -e "\n\n3. Checking if profiles table still exists..."
curl -X POST "$SUPABASE_URL/rest/v1/rpc/execute_sql" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT table_name FROM information_schema.tables WHERE table_schema = '\''public'\'' AND table_name = '\''profiles'\'';"
  }'