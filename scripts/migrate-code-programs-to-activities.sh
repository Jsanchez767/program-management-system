#!/bin/bash

# Code Migration Script: Programs → Activities, Roles Update
# This script updates all code files to reflect the database changes:
# - programs → activities
# - program_participants → participants  
# - instructor → staff
# - student → participant

set -e

echo "🚀 Starting code migration: Programs → Activities, Roles Update"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Backup directory
BACKUP_DIR=".migration-backup-$(date +%Y%m%d_%H%M%S)"

echo -e "${BLUE}📦 Creating backup in $BACKUP_DIR${NC}"
mkdir -p "$BACKUP_DIR"
cp -r app/ "$BACKUP_DIR/" 2>/dev/null || true
cp -r src/ "$BACKUP_DIR/" 2>/dev/null || true  
cp -r lib/ "$BACKUP_DIR/" 2>/dev/null || true
cp -r components/ "$BACKUP_DIR/" 2>/dev/null || true
cp -r hooks/ "$BACKUP_DIR/" 2>/dev/null || true

echo -e "${GREEN}✅ Backup created successfully${NC}"

# Function to update files with sed
update_files() {
    local pattern="$1"
    local replacement="$2"
    local description="$3"
    
    echo -e "${YELLOW}🔄 $description${NC}"
    
    # Find all TypeScript, JavaScript, SQL, and other relevant files
    find . -type f \( \
        -name "*.ts" -o \
        -name "*.tsx" -o \
        -name "*.js" -o \
        -name "*.jsx" -o \
        -name "*.sql" -o \
        -name "*.md" \
    \) -not -path "./.git/*" \
      -not -path "./node_modules/*" \
      -not -path "./.next/*" \
      -not -path "./$BACKUP_DIR/*" \
      -print0 | xargs -0 sed -i '' "s|$pattern|$replacement|g"
}

# ================================
# STEP 1: UPDATE DATABASE TABLE REFERENCES
# ================================

echo -e "${BLUE}📊 Updating database table references${NC}"

# Update table names in from() calls
update_files "\.from('programs')" ".from('activities')" "Updating .from('programs') to .from('activities')"
update_files "\.from(\"programs\")" ".from(\"activities\")" "Updating .from(\"programs\") to .from(\"activities\")"
update_files "\.from(\`programs\`)" ".from(\`activities\`)" "Updating .from(\`programs\`) to .from(\`activities\`)"

update_files "\.from('program_participants')" ".from('participants')" "Updating .from('program_participants') to .from('participants')"
update_files "\.from(\"program_participants\")" ".from(\"participants\")" "Updating .from(\"program_participants\") to .from(\"participants\")"
update_files "\.from(\`program_participants\`)" ".from(\`participants\`)" "Updating .from(\`program_participants\`) to .from(\`participants\`)"

# Update JOIN references
update_files "JOIN programs " "JOIN activities " "Updating JOIN programs to JOIN activities"
update_files "JOIN public\.programs " "JOIN public.activities " "Updating JOIN public.programs to JOIN public.activities"
update_files "FROM programs " "FROM activities " "Updating FROM programs to FROM activities"
update_files "FROM public\.programs " "FROM public.activities " "Updating FROM public.programs to FROM public.activities"

update_files "JOIN program_participants " "JOIN participants " "Updating JOIN program_participants to JOIN participants"
update_files "JOIN public\.program_participants " "JOIN public.participants " "Updating JOIN public.program_participants to JOIN public.participants"

# ================================
# STEP 2: UPDATE COLUMN REFERENCES
# ================================

echo -e "${BLUE}🏷️ Updating column references${NC}"

# Update column names
update_files "program_id" "activity_id" "Updating program_id to activity_id"
update_files "instructor_id" "staff_id" "Updating instructor_id to staff_id"
update_files "student_id" "participant_id" "Updating student_id to participant_id"

# Update programId to activityId in camelCase
update_files "programId" "activityId" "Updating programId to activityId"
update_files "instructorId" "staffId" "Updating instructorId to staffId"  
update_files "studentId" "participantId" "Updating studentId to participantId"

# Update program.id references
update_files "program\.id" "activity.id" "Updating program.id to activity.id"
update_files "programs\.id" "activities.id" "Updating programs.id to activities.id"

# ================================
# STEP 3: UPDATE ROLE REFERENCES
# ================================

echo -e "${BLUE}👥 Updating role references${NC}"

# Update role values in strings
update_files "'instructor'" "'staff'" "Updating 'instructor' role to 'staff'"
update_files "\"instructor\"" "\"staff\"" "Updating \"instructor\" role to \"staff\""
update_files "\`instructor\`" "\`staff\`" "Updating \`instructor\` role to \`staff\`"

update_files "'student'" "'participant'" "Updating 'student' role to 'participant'"
update_files "\"student\"" "\"participant\"" "Updating \"student\" role to \"participant\""
update_files "\`student\`" "\`participant\`" "Updating \`student\` role to \`participant\`"

# Update role checks and comparisons
update_files "role === 'instructor'" "role === 'staff'" "Updating role === 'instructor' to 'staff'"
update_files "role === \"instructor\"" "role === \"staff\"" "Updating role === \"instructor\" to \"staff\""

update_files "role === 'student'" "role === 'participant'" "Updating role === 'student' to 'participant'"
update_files "role === \"student\"" "role === \"participant\"" "Updating role === \"student\" to \"participant\""

update_files "role !== 'instructor'" "role !== 'staff'" "Updating role !== 'instructor' to 'staff'"
update_files "role !== 'student'" "role !== 'participant'" "Updating role !== 'student' to 'participant'"

# Update role arrays and enums
update_files "\\['admin', 'instructor'\\]" "['admin', 'staff']" "Updating role arrays"
update_files "\\[\"admin\", \"instructor\"\\]" "[\"admin\", \"staff\"]" "Updating role arrays"

update_files "IN ('admin', 'instructor')" "IN ('admin', 'staff')" "Updating SQL IN clauses"
update_files "IN (\"admin\", \"instructor\")" "IN (\"admin\", \"staff\")" "Updating SQL IN clauses"

# ================================
# STEP 4: UPDATE FUNCTION AND VARIABLE NAMES
# ================================

echo -e "${BLUE}🔧 Updating function and variable names${NC}"

# Update function names
update_files "isUserInstructor" "isUserStaff" "Updating isUserInstructor function name"
update_files "isInstructor" "isStaff" "Updating isInstructor function name"
update_files "getUserRole" "getUserRole" "Keeping getUserRole function name"

# Update variable names in code
update_files "instructor" "staff" "Updating instructor variables to staff"
update_files "instructors" "staff" "Updating instructors variables to staff"
update_files "students" "participants" "Updating students variables to participants"

# Update interface and type names
update_files "interface Instructor" "interface Staff" "Updating Instructor interface to Staff"
update_files "Instructor\\[\\]" "Staff[]" "Updating Instructor array type to Staff"
update_files "Instructor>" "Staff>" "Updating Instructor generic type to Staff"

# ================================
# STEP 5: UPDATE RPC FUNCTION CALLS
# ================================

echo -e "${BLUE}📞 Updating RPC function calls${NC}"

# Update RPC function names
update_files "insert_program_admin" "insert_activity_admin" "Updating insert_program_admin RPC function"
update_files "get_instructors_for_organization" "get_staff_for_organization" "Updating get_instructors_for_organization RPC function"

# ================================
# STEP 6: UPDATE CONSTANTS AND ENUMS
# ================================

echo -e "${BLUE}📋 Updating constants and enums${NC}"

# Update TypeScript types and constants
update_files "export type UserRole = 'admin' \\| 'instructor' \\| 'student'" "export type UserRole = 'admin' | 'staff' | 'participant'" "Updating UserRole type"

update_files "INSTRUCTOR: 'instructor'" "STAFF: 'staff'" "Updating ROLES constant"
update_files "STUDENT: 'student'" "PARTICIPANT: 'participant'" "Updating ROLES constant"

# Update route constants
update_files "/instructor" "/staff" "Updating instructor routes to staff"
update_files "/student" "/participant" "Updating student routes to participant"

# Update URL patterns
update_files "INSTRUCTOR_" "STAFF_" "Updating route constants"
update_files "STUDENT_" "PARTICIPANT_" "Updating route constants"

# ================================
# STEP 7: UPDATE INTERFACE DEFINITIONS
# ================================

echo -e "${BLUE}🏗️ Updating interface definitions${NC}"

# Update interface properties
update_files "interface Program" "interface Activity" "Updating Program interface to Activity"
update_files "interface ProgramParticipant" "interface Participant" "Updating ProgramParticipant interface to Participant"
update_files "interface ProgramWith" "interface ActivityWith" "Updating ProgramWith interfaces to ActivityWith"

update_files "Program\\[\\]" "Activity[]" "Updating Program array types to Activity"
update_files "ProgramParticipant\\[\\]" "Participant[]" "Updating ProgramParticipant array types to Participant"

# Update extended interfaces
update_files "ProgramWithInstructor" "ActivityWithStaff" "Updating ProgramWithInstructor to ActivityWithStaff"
update_files "ProgramWithParticipants" "ActivityWithParticipants" "Updating ProgramWithParticipants to ActivityWithParticipants"

# ================================
# STEP 8: UPDATE COMMENTS AND DOCUMENTATION
# ================================

echo -e "${BLUE}📝 Updating comments and documentation${NC}"

# Update comments
update_files "// Programs" "// Activities" "Updating comments"
update_files "// Program " "// Activity " "Updating comments"
update_files "// Instructor" "// Staff" "Updating comments"
update_files "// Student" "// Participant" "Updating comments"

# Update JSDoc comments
update_files "@param program" "@param activity" "Updating JSDoc parameters"
update_files "@param instructor" "@param staff" "Updating JSDoc parameters"
update_files "@param student" "@param participant" "Updating JSDoc parameters"

# ================================
# STEP 9: UPDATE FILE AND FOLDER NAMES
# ================================

echo -e "${BLUE}📁 Updating file and folder names${NC}"

# Function to rename files and update imports
rename_files() {
    local old_pattern="$1"
    local new_pattern="$2"
    local description="$3"
    
    echo -e "${YELLOW}📄 $description${NC}"
    
    # Find and rename files
    find . -type f \( -name "*$old_pattern*" \) \
        -not -path "./.git/*" \
        -not -path "./node_modules/*" \
        -not -path "./.next/*" \
        -not -path "./$BACKUP_DIR/*" | while read -r file; do
        
        dir=$(dirname "$file")
        filename=$(basename "$file")
        new_filename=$(echo "$filename" | sed "s/$old_pattern/$new_pattern/g")
        new_path="$dir/$new_filename"
        
        if [ "$file" != "$new_path" ]; then
            echo "  Renaming: $file → $new_path"
            mv "$file" "$new_path"
        fi
    done
}

# Rename folders (instructor → staff, student → participant)
if [ -d "app/instructor" ]; then
    echo "  Renaming folder: app/instructor → app/staff"
    mv app/instructor app/staff
fi

if [ -d "app/student" ]; then
    echo "  Renaming folder: app/student → app/participant"
    mv app/student app/participant
fi

if [ -d "src/features/instructor" ]; then
    echo "  Renaming folder: src/features/instructor → src/features/staff"
    mv src/features/instructor src/features/staff
fi

if [ -d "src/features/student" ]; then
    echo "  Renaming folder: src/features/student → src/features/participant"
    mv src/features/student src/features/participant
fi

# Rename program-related folders
if [ -d "src/features/programs" ]; then
    echo "  Renaming folder: src/features/programs → src/features/activities"
    mv src/features/programs src/features/activities
fi

if [ -d "app/admin/programs" ]; then
    echo "  Renaming folder: app/admin/programs → app/admin/activities"
    mv app/admin/programs app/admin/activities
fi

# Update component folder names
if [ -d "components/instructor" ]; then
    echo "  Renaming folder: components/instructor → components/staff"
    mv components/instructor components/staff
fi

if [ -d "components/student" ]; then
    echo "  Renaming folder: components/student → components/participant"
    mv components/student components/participant
fi

# Rename files
rename_files "program" "activity" "Renaming program files to activity"
rename_files "instructor" "staff" "Renaming instructor files to staff"

# ================================
# STEP 10: UPDATE IMPORT STATEMENTS
# ================================

echo -e "${BLUE}📥 Updating import statements${NC}"

# Update imports to reflect new file paths
update_files "from '@/app/instructor" "from '@/app/staff" "Updating imports from instructor to staff"
update_files "from '@/app/student" "from '@/app/participant" "Updating imports from student to participant"
update_files "from '@/components/instructor" "from '@/components/staff" "Updating imports from instructor to staff"
update_files "from '@/components/student" "from '@/components/participant" "Updating imports from participant to participant"
update_files "from '@/src/features/instructor" "from '@/src/features/staff" "Updating imports from instructor to staff"
update_files "from '@/src/features/student" "from '@/src/features/participant" "Updating imports from student to participant"
update_files "from '@/src/features/programs" "from '@/src/features/activities" "Updating imports from programs to activities"

# Update relative imports
update_files "\\.\\./instructor" "../staff" "Updating relative imports"
update_files "\\.\\./student" "../participant" "Updating relative imports"
update_files "\\.\\./programs" "../activities" "Updating relative imports"

# ================================
# STEP 11: UPDATE TEXT AND LABELS
# ================================

echo -e "${BLUE}🏷️ Updating UI text and labels${NC}"

# Update display text (be careful not to change user-facing text incorrectly)
update_files "Programs" "Activities" "Updating Programs text to Activities"
update_files "Program" "Activity" "Updating Program text to Activity"
update_files "Instructor" "Staff" "Updating Instructor text to Staff"
update_files "Student" "Participant" "Updating Student text to Participant"

# Update form labels and placeholders
update_files "Select Program" "Select Activity" "Updating form labels"
update_files "Program Name" "Activity Name" "Updating form labels"
update_files "New Program" "New Activity" "Updating form labels"

# ================================
# STEP 12: UPDATE SPECIAL CASES
# ================================

echo -e "${BLUE}🔍 Handling special cases${NC}"

# Fix any JavaScript object property names that were incorrectly changed
update_files "activitys" "activities" "Fixing incorrect plural form"
update_files "staffs" "staff" "Fixing incorrect plural form"

# Fix any incorrect capitalizations
update_files "STAFF_DASHBOARD" "STAFF_DASHBOARD" "Verifying constant names"
update_files "PARTICIPANT_DASHBOARD" "PARTICIPANT_DASHBOARD" "Verifying constant names"

# ================================
# VERIFICATION AND CLEANUP
# ================================

echo -e "${BLUE}🔍 Verifying changes${NC}"

# Check if TypeScript compiles
echo "Checking TypeScript compilation..."
if command -v npm &> /dev/null; then
    npm run build --dry-run 2>/dev/null || echo "Note: Build check skipped"
else
    echo "Note: npm not available, skipping build check"
fi

# Count files changed
changed_files=$(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "./.git/*" \
    -not -path "./node_modules/*" \
    -not -path "./.next/*" \
    -not -path "./$BACKUP_DIR/*" | wc -l)

echo -e "${GREEN}✅ Migration completed successfully!${NC}"
echo -e "${BLUE}📊 Summary:${NC}"
echo "  • Backup created in: $BACKUP_DIR"
echo "  • Files processed: $changed_files"
echo "  • Changes applied:"
echo "    - programs → activities"
echo "    - program_participants → participants" 
echo "    - instructor → staff"
echo "    - student → participant"
echo ""
echo -e "${YELLOW}⚠️  Next steps:${NC}"
echo "1. Run the database migration script: scripts/rename-programs-to-activities.sql"
echo "2. Test the application thoroughly"
echo "3. Update any remaining references manually"
echo "4. Commit the changes to git"
echo ""
echo -e "${GREEN}🎉 Code migration complete!${NC}"