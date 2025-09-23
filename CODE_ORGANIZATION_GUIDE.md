# Code Organization Refactor Guide

## Overview
This document outlines the improved code organization structure for better scalability and debugging.

## New Structure Benefits

### 1. **Feature-Based Organization**
- **Before**: Files scattered across `/components`, `/app`, `/lib`
- **After**: Related files grouped by feature in `/src/features/`
- **Benefit**: Easy to find everything related to a specific feature

### 2. **Clear Separation of Concerns**
```
src/
├── features/           # Feature-specific code
│   ├── programs/      # Everything programs-related
│   ├── participants/  # Everything participants-related
│   └── field-trips/   # Everything field-trips-related
├── shared/            # Reusable across features
│   ├── components/    # Shared UI components
│   ├── hooks/         # Shared hooks
│   ├── utils/         # Shared utilities
│   └── types/         # Shared types
└── lib/               # External integrations
    ├── supabase/      # Database client
    ├── auth/          # Authentication
    └── api/           # API clients
```

## Migration Steps

### Phase 1: Programs Feature (Example)
1. Move program-related components to `src/features/programs/components/`
2. Extract program hooks to `src/features/programs/hooks/`
3. Define program types in `src/features/programs/types/`
4. Update imports to use new paths

### Phase 2: Shared Components
1. Move layout components to `src/shared/components/layout/`
2. Move common UI components to `src/shared/components/ui/`
3. Update import paths throughout the app

### Phase 3: Other Features
1. Repeat the pattern for participants, field-trips, etc.

## Example Usage

### Before (Current)
```tsx
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useRealtimePrograms } from "@/lib/realtime-hooks"
```

### After (Improved)
```tsx
import { AdminSidebar } from "@/shared/components/layout/AdminSidebar"
import { usePrograms } from "@/features/programs/hooks/usePrograms"
import { ProgramGrid } from "@/features/programs/components/ProgramGrid"
```

## Advantages

### 1. **Scalability**
- Easy to add new features without cluttering existing folders
- Each feature is self-contained
- Clear boundaries between features

### 2. **Debugging**
- Related code is co-located
- Easy to trace dependencies
- Clearer mental model of the codebase

### 3. **Maintainability**
- Easier to refactor individual features
- Reduced coupling between features
- Better code reusability

### 4. **Team Development**
- Multiple developers can work on different features without conflicts
- Clear ownership of code sections
- Easier onboarding for new team members

## Implementation Strategy

### Gradual Migration
1. **Start with one feature** (programs) as proof of concept
2. **Update imports gradually** to avoid breaking changes
3. **Test thoroughly** after each migration step
4. **Document patterns** for consistency

### Immediate Benefits
- **Better IDE support**: Auto-imports work better with clear structure
- **Faster development**: Less time searching for files
- **Reduced bugs**: Clear separation reduces accidental dependencies

## File Naming Conventions

### Components
- PascalCase: `ProgramCard.tsx`, `UserProfile.tsx`
- Descriptive names: `EditProgramModal.tsx` vs `Modal.tsx`

### Hooks
- camelCase with "use" prefix: `usePrograms.ts`, `useProgramActions.ts`

### Types
- PascalCase with ".types" suffix: `program.types.ts`, `user.types.ts`

### Utils
- camelCase with ".utils" suffix: `program.utils.ts`, `date.utils.ts`

This structure will make your codebase much more maintainable and scalable as your application grows!