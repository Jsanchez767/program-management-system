# Migration Guide: Refactoring to New Code Organization

## Phase 1: Update Import Paths

### Current Import Patterns → New Import Patterns

```tsx
// OLD IMPORTS
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useRealtimePrograms } from "@/lib/realtime-hooks"
import { useUser } from "@/hooks/use-user"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// NEW IMPORTS
import { AdminSidebar } from "@/shared/components/layout/AdminSidebar"
import { usePrograms } from "@/features/programs/hooks/usePrograms"
import { useUser } from "@/shared/hooks/use-user"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/utils"
```

## Phase 2: Migration Commands

Run these commands to migrate your existing code:

### 1. Update package.json scripts (optional)
Add these scripts to help with the migration:

```json
{
  "scripts": {
    "migrate:check": "tsc --noEmit",
    "migrate:format": "prettier --write 'src/**/*.{ts,tsx}'",
    "migrate:lint": "eslint 'src/**/*.{ts,tsx}' --fix"
  }
}
```

### 2. Update existing files gradually

Start with updating import paths in your current files:

```bash
# Update all @/components/ui imports to @/shared/components/ui
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|@/components/ui|@/shared/components/ui|g'

# Update @/hooks imports to @/shared/hooks  
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|@/hooks|@/shared/hooks|g'

# Update @/lib/utils imports to @/shared/utils
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|@/lib/utils|@/shared/utils|g'
```

## Phase 3: Feature-by-Feature Migration

### Programs Feature Migration

1. **Move program-related components:**
```bash
# Create the structure (already done)
# Move existing program modals and components to the new location
```

2. **Update your current programs page:**
```tsx
// app/admin/programs/page.tsx
"use client"

import { useState } from "react"
import { AdminSidebar } from "@/shared/components/layout/AdminSidebar"
import { Button } from "@/shared/components/ui/button"
import Link from "next/link"
import { useUser } from "@/shared/hooks/use-user"
import { ProgramGrid } from "@/features/programs/components/ProgramGrid"
// Keep your existing modals until you migrate them
import ProgramModal from "./[id]/ProgramModal"
import EditProgramModal from "./[id]/EditProgramModal"

export default function AdminProgramsPage() {
  const { user } = useUser()
  const organizationId = user?.user_metadata?.organization_id

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)

  const handleProgramSelect = (programId: string) => {
    setSelectedProgramId(programId)
    setModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <div className="lg:pl-64">
        <main className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Programs</h1>
              <p className="text-muted-foreground mt-2">
                Manage all educational programs and activities
              </p>
            </div>
            <Button asChild>
              <Link href="/admin/programs/new">
                <span className="mr-2">➕</span>
                New Program
              </Link>
            </Button>
          </div>

          {/* Use the new ProgramGrid component */}
          {organizationId && (
            <ProgramGrid
              organizationId={organizationId}
              onProgramSelect={handleProgramSelect}
            />
          )}

          {/* Keep existing modals for now */}
          {selectedProgramId && (
            <ProgramModal
              programId={selectedProgramId}
              open={modalOpen}
              onOpenChange={(open: boolean) => {
                setModalOpen(open)
                if (!open) setSelectedProgramId(null)
              }}
              onOptimisticUpdate={() => {}}
              organizationId={organizationId || ""}
            />
          )}
        </main>
      </div>
    </div>
  )
}
```

## Phase 4: Testing Strategy

### 1. Test Each Component Individually
```bash
# Test that imports work
npm run build

# Test that the app still functions
npm run dev
```

### 2. Gradual Rollout
- Start with one feature (programs)
- Test thoroughly
- Move to next feature
- Update imports as you go

### 3. Validation Checklist
- [ ] All imports resolve correctly
- [ ] TypeScript compilation passes
- [ ] All components render properly
- [ ] No runtime errors
- [ ] Existing functionality preserved

## Phase 5: Benefits You'll See

### 1. Better Development Experience
- **Faster file finding**: Related code is co-located
- **Better autocomplete**: Clear import paths
- **Easier refactoring**: Feature boundaries are clear

### 2. Team Collaboration
- **Feature ownership**: Each developer can own a feature folder
- **Reduced conflicts**: Clear separation of concerns
- **Easier code reviews**: Changes are scoped to features

### 3. Scalability
- **Add new features easily**: Follow the established pattern
- **Independent deployment**: Features can be deployed separately (in the future)
- **Better testing**: Test features in isolation

## Phase 6: Future Enhancements

Once the basic structure is in place, you can add:

1. **Feature-specific routes**: Each feature manages its own routing
2. **Feature flags**: Enable/disable features per organization
3. **Lazy loading**: Load features on demand
4. **Independent testing**: Test each feature in isolation
5. **Micro-frontend preparation**: Each feature could become a separate app

## Quick Start Command

To start using the new structure immediately, update your current programs page with just the import changes:

```bash
# Update your current page
cp /path/to/current/programs/page.tsx /path/to/current/programs/page.tsx.backup
# Then update the imports manually or use the sed commands above
```

This migration can be done gradually without breaking your existing functionality!