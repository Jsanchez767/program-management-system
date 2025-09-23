#!/bin/bash

echo "🚀 Starting Code Organization Migration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_status "Found package.json - proceeding with migration..."

# Step 1: Update import paths in existing files
print_status "Step 1: Updating import paths..."

# Update UI component imports
find . -name "*.tsx" -o -name "*.ts" | grep -v node_modules | grep -v .git | xargs sed -i '' 's|@/components/ui|@/shared/components/ui|g'
print_status "Updated UI component imports"

# Update hooks imports
find . -name "*.tsx" -o -name "*.ts" | grep -v node_modules | grep -v .git | xargs sed -i '' 's|@/hooks/|@/shared/hooks/|g'
print_status "Updated hooks imports"

# Update utils imports
find . -name "*.tsx" -o -name "*.ts" | grep -v node_modules | grep -v .git | xargs sed -i '' 's|@/lib/utils|@/shared/utils|g'
print_status "Updated utils imports"

# Update sidebar imports
find . -name "*.tsx" -o -name "*.ts" | grep -v node_modules | grep -v .git | xargs sed -i '' 's|@/components/admin/admin-sidebar|@/shared/components/layout/AdminSidebar|g'
find . -name "*.tsx" -o -name "*.ts" | grep -v node_modules | grep -v .git | xargs sed -i '' 's|@/components/instructor/instructor-sidebar|@/shared/components/layout/InstructorSidebar|g'
find . -name "*.tsx" -o -name "*.ts" | grep -v node_modules | grep -v .git | xargs sed -i '' 's|@/components/student/student-sidebar|@/shared/components/layout/StudentSidebar|g'
print_status "Updated sidebar imports"

# Step 2: Check TypeScript compilation
print_status "Step 2: Checking TypeScript compilation..."
if npm run build --silent > /dev/null 2>&1; then
    print_status "TypeScript compilation successful!"
else
    print_warning "TypeScript compilation has issues. You may need to fix some imports manually."
    print_warning "Run 'npm run build' to see the specific errors."
fi

# Step 3: Create a backup of critical files
print_status "Step 3: Creating backup of original structure..."
mkdir -p .migration-backup
cp -r components .migration-backup/ 2>/dev/null || true
cp -r hooks .migration-backup/ 2>/dev/null || true
cp -r lib .migration-backup/ 2>/dev/null || true
print_status "Backup created in .migration-backup/"

# Step 4: Summary
echo ""
echo "🎉 Migration steps completed!"
echo ""
echo "📋 What was done:"
echo "   • Updated import paths to use new structure"
echo "   • Created backup of original files"
echo "   • Checked TypeScript compilation"
echo ""
echo "📋 Next steps:"
echo "   1. Test your application: npm run dev"
echo "   2. Check for any remaining import issues"
echo "   3. Gradually move components to feature folders"
echo "   4. Update remaining files manually if needed"
echo ""
echo "📖 See MIGRATION_GUIDE.md for detailed instructions"
echo "📖 See CODE_ORGANIZATION_GUIDE.md for the full structure overview"
echo ""

# Final check
if command -v npm &> /dev/null; then
    print_status "You can now run 'npm run dev' to test your application"
else
    print_warning "npm not found. Make sure Node.js is installed."
fi

echo "✨ Happy coding with your new organized codebase!"