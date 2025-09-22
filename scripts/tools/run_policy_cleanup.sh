#!/bin/bash

# Run policy cleanup using psql directly
# Make sure you have PostgreSQL client installed

# Extract database URL from .env.local
source .env.local

# Convert the DATABASE_URL to actual connection (you'll need to replace [YOUR-PASSWORD])
# DATABASE_URL=postgresql://postgres.icbtjcvvogvdwdjkiwem:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres

echo "To run this script, you need to:"
echo "1. Install PostgreSQL client: brew install postgresql"
echo "2. Get your database password from Supabase Settings > Database"
echo "3. Run this command with your actual password:"
echo ""
echo "psql 'postgresql://postgres.icbtjcvvogvdwdjkiwem:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres' -f scripts/MANUAL_POLICY_CLEANUP.sql"
echo ""
echo "OR use the Supabase SQL Editor (easier option)"