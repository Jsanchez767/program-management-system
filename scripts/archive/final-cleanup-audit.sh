#!/bin/bash

# Final Cleanup Audit Script for Programs → Activities Migration
# This script fixes remaining inconsistencies found during the complete audit

set -e

echo "🔍 Starting final cleanup audit..."

# Function to update files safely
update_files() {
    local pattern="$1"
    local replacement="$2" 
    local description="$3"
    
    echo "  📝 $description"
    
    # Use find to exclude backup directories and node_modules
    find . -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.jsx" | \
    grep -v node_modules | \
    grep -v ".git" | \
    grep -v ".migration-backup" | \
    grep -v ".next" | \
    xargs sed -i '' "s|$pattern|$replacement|g"
}

echo "🧹 Phase 1: Fixing remaining variable names in component files..."

# Fix variable names: programs → activities
update_files "const \[programs, setPrograms\]" "const [activities, setActivities]" "Updating programs state to activities"
update_files "setPrograms(" "setActivities(" "Updating setPrograms calls"
update_files "programs\.map(" "activities.map(" "Updating programs.map to activities.map"
update_files "programs\.length" "activities.length" "Updating programs.length to activities.length"
update_files "realtimePrograms" "realtimeActivities" "Updating realtimePrograms to realtimeActivities"
update_files "useRealtimePrograms" "useRealtimeActivities" "Updating useRealtimePrograms hook"

echo "🧹 Phase 2: Fixing text content and UI labels..."

# Fix UI text content
update_files "Programs Grid" "Activities Grid" "Updating UI text: Programs Grid"
update_files "No programs yet" "No activities yet" "Updating UI text: No programs yet"
update_files "My Programs" "My Activities" "Updating UI text: My Programs"
update_files "Recent Programs" "Recent Activities" "Updating UI text: Recent Programs"
update_files "Total Programs" "Total Activities" "Updating UI text: Total Programs"
update_files "Manage all educational programs" "Manage all educational activities" "Updating description text"
update_files "Here's an overview of your programs" "Here's an overview of your activities" "Updating description text"
update_files "educational program" "educational activity" "Updating description text"
update_files "Enrolled Programs" "Enrolled Activities" "Updating UI text"

echo "🧹 Phase 3: Fixing function and variable names..."

# Fix function names
update_files "AdminProgramsPage" "AdminActivitiesPage" "Updating component name"
update_files "createProgram" "createActivity" "Updating function name"
update_files "updateProgram" "updateActivity" "Updating function name"
update_files "deleteProgram" "deleteActivity" "Updating function name"
update_files "useProgramActions" "useActivityActions" "Updating hook name"
update_files "loadPrograms" "loadActivities" "Updating function name"

echo "🧹 Phase 4: Fixing URL references..."

# Fix URL references
update_files "/admin/programs" "/admin/activities" "Updating admin programs URLs"
update_files "/student/programs" "/participant/activities" "Updating student programs URLs"
update_files "href=\"/admin/programs" "href=\"/admin/activities" "Updating href attributes"

echo "🧹 Phase 5: Fixing comments and strings..."

# Fix comments and documentation
update_files "// Programs" "// Activities" "Updating comments"
update_files "Programs you're teaching" "Activities you're teaching" "Updating description"
update_files "get started with your programs" "get started with your activities" "Updating description"

echo "🧹 Phase 6: Fixing TypeScript types and interfaces..."

# Fix TypeScript interface references
update_files "ProgramParticipant" "ActivityParticipant" "Updating interface name"
update_files "totalPrograms" "totalActivities" "Updating property name"
update_files "activePrograms" "activeActivities" "Updating property name"
update_files "myPrograms" "myActivities" "Updating property name"
update_files "enrolledPrograms" "enrolledActivities" "Updating property name"
update_files "recentPrograms" "recentActivities" "Updating property name"

echo "🧹 Phase 7: Fixing data mapping and object properties..."

# Fix data property references
update_files "program\." "activity." "Updating object property references"
update_files "program:" "activity:" "Updating object property names"
update_files "programs:" "activities:" "Updating object property names"
update_files "mockPrograms" "mockActivities" "Updating mock data variable names"

echo "🧹 Phase 8: Fixing hook and component imports..."

# Fix import statements
update_files "import.*ProgramModal" "import ActivityModal" "Updating modal imports"
update_files "import.*EditProgramModal" "import EditActivityModal" "Updating edit modal imports"
update_files "import.*ProgramCard" "import ActivityCard" "Updating card imports"
update_files "import.*ProgramGrid" "import ActivityGrid" "Updating grid imports"

echo "📁 Phase 9: Renaming files and directories..."

# Rename files to match new naming convention
if [ -f "app/admin/activities/[id]/ProgramModal.tsx" ]; then
    mv "app/admin/activities/[id]/ProgramModal.tsx" "app/admin/activities/[id]/ActivityModal.tsx"
    echo "  📝 Renamed ProgramModal.tsx to ActivityModal.tsx"
fi

if [ -f "app/admin/activities/[id]/EditProgramModal.tsx" ]; then
    mv "app/admin/activities/[id]/EditProgramModal.tsx" "app/admin/activities/[id]/EditActivityModal.tsx"
    echo "  📝 Renamed EditProgramModal.tsx to EditActivityModal.tsx"
fi

# Rename src/features directories if they exist
if [ -d "src/features/activities/components" ]; then
    if [ -f "src/features/activities/components/ProgramCard.tsx" ]; then
        mv "src/features/activities/components/ProgramCard.tsx" "src/features/activities/components/ActivityCard.tsx"
        echo "  📝 Renamed ProgramCard.tsx to ActivityCard.tsx"
    fi
    
    if [ -f "src/features/activities/components/ProgramGrid.tsx" ]; then
        mv "src/features/activities/components/ProgramGrid.tsx" "src/features/activities/components/ActivityGrid.tsx"
        echo "  📝 Renamed ProgramGrid.tsx to ActivityGrid.tsx"
    fi
    
    if [ -f "src/features/activities/components/AdminProgramsPage.tsx" ]; then
        mv "src/features/activities/components/AdminProgramsPage.tsx" "src/features/activities/components/AdminActivitiesPage.tsx"
        echo "  📝 Renamed AdminProgramsPage.tsx to AdminActivitiesPage.tsx"
    fi
fi

# Rename hooks files
if [ -f "src/features/activities/hooks/usePrograms.ts" ]; then
    mv "src/features/activities/hooks/usePrograms.ts" "src/features/activities/hooks/useActivities.ts"
    echo "  📝 Renamed usePrograms.ts to useActivities.ts"
fi

# Rename types files
if [ -f "src/features/activities/types/program.types.ts" ]; then
    mv "src/features/activities/types/program.types.ts" "src/features/activities/types/activity.types.ts"
    echo "  📝 Renamed program.types.ts to activity.types.ts"
fi

echo "🧹 Phase 10: Final pass - fixing any missed references..."

# Fix any remaining specific patterns
update_files "Program\\\[\\\]" "Activity[]" "Updating array type declarations"
update_files "Program\\\\|" "Activity|" "Updating union types"
update_files "Program'" "Activity'" "Updating type references in strings"
update_files "program\\\\?:" "activity?:" "Updating optional properties"

echo "✅ Final cleanup audit completed!"
echo ""
echo "📋 Summary of changes made:"
echo "  - Updated variable names (programs → activities)"
echo "  - Fixed UI text and labels"
echo "  - Updated function names"
echo "  - Fixed URL references"
echo "  - Updated TypeScript types and interfaces"
echo "  - Renamed component files"
echo "  - Fixed import statements"
echo ""
echo "🔍 Please review the changes and test the application."