# Program Management System

A comprehensive multi-tenant program management system built with Next.js, Supabase, and TypeScript. Designed for educational institutions to manage programs, students, instructors, and administrative tasks with complete data isolation between organizations.

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **UI Components**: Tailwind CSS + shadcn/ui
- **Authentication**: Supabase Auth with JWT user metadata
- **Multi-tenancy**: Organization-based data isolation with RLS policies

## Features

### Admin Dashboard
- **Program Management**: Create, edit, and manage educational programs
- **User Management**: Oversee instructors and students
- **Document Management**: Handle enrollment forms, medical records, and other documents
- **Analytics**: View program statistics and performance metrics

### Instructor Portal
- **Lesson Planning**: Create and manage lesson plans
- **Field Trip Coordination**: Plan and organize field trips
- **Purchase Orders**: Submit requests for materials and supplies
- **Student Progress**: Track student participation and progress

### Student Portal
- **Program Information**: Access program details and schedules
- **Announcements**: Stay updated with important notifications
- **Document Submission**: Upload required documents and forms
- **Progress Tracking**: View personal progress and achievements

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL database with real-time features)
- **Authentication**: Supabase Auth with Row Level Security (RLS)
- **UI Components**: Custom components built with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system

## Database Schema

The application uses a comprehensive database schema with the following main tables:

- `profiles` - User profiles with role-based access (admin, instructor, student)
- `programs` - Educational program information
- `program_participants` - Student enrollment and participation tracking
- `announcements` - System-wide and program-specific announcements
- `documents` - Document management with status tracking
- `lesson_plans` - Instructor lesson planning and management
- `purchase_orders` - Material and supply request management
- `field_trips` - Field trip planning and coordination

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd program-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   
   Run the SQL scripts in the `scripts/` directory in order:
   ```bash
   # Execute these in your Supabase SQL editor
   scripts/001_create_users_and_profiles.sql
   scripts/002_create_programs.sql
   scripts/003_create_participants.sql
   scripts/004_create_announcements.sql
   scripts/005_create_documents.sql
   scripts/006_create_lesson_plans.sql
   scripts/007_create_purchase_orders.sql
   scripts/008_create_field_trips.sql
   # Multi-tenant RLS policies (required for production)
   scripts/010_multi_tenant_policies.sql
   scripts/011_fix_rls_signup.sql
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open the application**
   
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

### First-time Setup

1. **Create an admin account**: Go to `/auth/signup` and create an account
2. **Set admin role**: The first user with email matching the configured admin email will automatically get admin privileges
3. **Configure programs**: Use the admin dashboard to set up your educational programs

## Authentication & Authorization

The application uses Supabase Auth with role-based access control:

- **Public routes**: Landing page, login, signup
- **Protected routes**: All dashboard areas require authentication
- **Role-based access**: Different interfaces for admin, instructor, and student roles
- **Row Level Security**: Database-level security ensures users only access authorized data

## Development

### Project Structure

```
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard pages
│   ├── instructor/        # Instructor portal pages
│   ├── student/           # Student portal pages
│   ├── auth/              # Authentication pages
│   └── dashboard/         # Role-based redirect logic
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── admin/            # Admin-specific components
│   ├── instructor/       # Instructor-specific components
│   └── student/          # Student-specific components
├── lib/                  # Utility libraries
│   ├── supabase/         # Supabase client configuration
│   └── types/            # TypeScript type definitions
├── scripts/              # Database setup scripts
└── public/               # Static assets
```

### Key Technologies

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety and better developer experience
- **Tailwind CSS**: Utility-first CSS framework
- **Supabase**: Backend-as-a-Service with PostgreSQL
- **Radix UI**: Accessible component primitives

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please contact the development team or create an issue in this repository.