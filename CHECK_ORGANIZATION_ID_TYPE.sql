/* 
🔍 CHECK ORGANIZATION_ID TYPE
   
   Let's check the data type to make sure we're using it correctly.
*/

-- Check the table definition for programs
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'programs'
AND 
    column_name = 'organization_id';

-- Check a few examples from the programs table
SELECT 
    id, 
    name,
    organization_id,
    pg_typeof(organization_id) as organization_id_type
FROM 
    programs
LIMIT 5;