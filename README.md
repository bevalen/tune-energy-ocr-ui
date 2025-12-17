# Tune Energy

AI Dispatcher MVP for Real Time Transport (RTT), automating dispatch workflows using HappyRobot and Next.js.

## User Operation
1. Access the UI at https://tune-energy.vercel.app/
2. Log in using your provided credentials. If you do not have credentials, please request them from an administrator.
3. Populate the basic details about the batch you wish to process:
  a. Email Address (required): This is the email address where you want results to be sent.
  b. Customer Name (required): The name of the customer.
  c. Location ID (required): The customer's unique identifier for this location.
  d. Location Address: The physical address of this location. Not required for processing.
4. Upload one or more files in the 'Upload Files' area. Accepted file formats: .PDF, .DOCX, .ODT, .PNG, .JPG, .TIFF, .BMP.
5. Confirm all files are present in the 'Upload Files' area and hit the 'Analyze' button.
6. If all files were accepted, you'll see a 'Success' message. An email will arrive at the entered address within a few minutes.
   a. If there were any errors during processing, but partial success was achieved, the email will contain those errors.
   b. If an email does not arrive within 5 minutes, check the Supabase Edge Function logs for errors.

Note: Please WAIT for each batch to complete before submitting a new batch.

## Features

- **Authentication & Authorization**
  - Password-based authentication with Supabase Auth
  - PKCE flow for secure password recovery
  - Protected routes with automatic redirects
  - Session management across the entire Next.js stack

- **File Upload & Processing**
  - Drag-and-drop file uploads with progress tracking
  - Bill analysis and processing workflows
  - Secure file storage with Supabase Storage

- **Modern Tech Stack**
  - [Next.js 15+](https://nextjs.org) with App Router
  - [Supabase](https://supabase.com) for database, auth, and storage
  - [Tailwind CSS](https://tailwindcss.com) for styling
  - [shadcn/ui](https://ui.shadcn.com/) components
  - TypeScript for type safety

## Tech Stack

- **Framework**: Next.js 16 (App Router with Proxy)
- **Database & Auth**: Supabase (PostgreSQL + Row Level Security)
- **Styling**: Tailwind CSS v3
- **UI Components**: shadcn/ui + Radix UI primitives
- **State Management**: React Server Components + Server Actions
- **File Upload**: react-dropzone with drag-and-drop
- **Form Validation**: Zod schemas
- **Animations**: Framer Motion
- **Toast Notifications**: Sonner

### Key Architecture Decisions

- **Proxy over Middleware**: Uses Next.js 16's `proxy.ts` convention (middleware is deprecated)
- **Publishable Keys**: Uses Supabase's new Publishable Key format instead of deprecated Anon Keys
- **PKCE Flow**: Implements secure password recovery with PKCE authorization flow
- **Server Actions**: All mutations use Server Actions instead of API routes
- **Edge Runtime**: Proxy runs at the edge for fast auth checks and redirects

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Next.js 16 (latest)
- A Supabase project with database and storage configured
  - Production database: already configured at Supabase
  - Storage bucket: `bills` with proper RLS policies

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd tune-energy
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   Copy `.env.example` to `.env.local` and update with your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   ```

   **Important**: This project uses Supabase's **new Publishable Keys** (not the deprecated Anon Keys) You can find these in your [Supabase project's API settings](https://supabase.com/dashboard/project/_/settings/api).

   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Client-side public key (replaces the old `ANON_KEY`)
   - `SUPABASE_SERVICE_ROLE_KEY`: Server-side secret key for admin operations (keep this secure!)
4. Run the development server:

   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
tune-energy/
├── app/                    # Next.js App Router pages
│   ├── (protected)/        # Protected routes (require authentication)
│   │   └── upload/         # Bill upload page
│   ├── auth/               # Authentication pages
│   │   ├── confirm/        # Email confirmation handler (PKCE)
│   │   ├── login/          # Login page
│   │   ├── forgot-password/ # Password recovery request
│   │   └── update-password/ # Password reset page
│   └── page.tsx            # Home page (landing)
├── components/             # React components
│   ├── ui/                 # shadcn/ui base components
│   └── ...                 # Feature-specific components
├── lib/                    # Utility libraries
│   └── supabase/           # Supabase client configuration
│       ├── client.ts       # Client-side Supabase client
│       ├── server.ts       # Server-side Supabase client
│       └── proxy.ts        # Proxy session management logic
├── src/
│   └── actions/            # Server Actions
│       └── analyze/        # Bill analysis actions
├── proxy.ts                # Next.js 16 proxy (edge auth & routing)
└── ...
```

## Next.js 16+ Features

This project leverages Next.js 16's latest features and conventions:

### Proxy (Replaces Middleware)

In Next.js 16, the `middleware` file convention has been renamed to `proxy`. This project uses `proxy.ts` for:

- **PKCE Code Exchange**: Automatic exchange of recovery tokens for authenticated sessions
- **Session Management**: Refresh user sessions on each request
- **Route Protection**: Automatic redirects based on authentication state
- **Cookie Management**: Secure session cookie handling with Supabase SSR

The proxy runs at the edge before routes are rendered, providing fast authentication checks and redirects.

### Server Actions

All mutations use Next.js Server Actions in `src/actions/` for:
- Type-safe server-side operations
- Automatic revalidation with `revalidatePath()`
- Direct database access without API routes
- Zod schema validation

### React Server Components

The app uses RSC by default for improved performance:
- Server-side data fetching without client-side overhead
- Automatic code splitting
- Reduced JavaScript bundle size

## Authentication Flow

This project uses Supabase Auth with PKCE flow for secure authentication:

- **Sign Up**: `/auth/sign-up`
- **Login**: `/auth/login`
- **Password Recovery**: `/auth/forgot-password` → `/auth/update-password`
- **Protected Routes**: Automatically redirect unauthenticated users to login

The proxy (`proxy.ts`) handles:
- PKCE code exchange for password recovery links
- Session refresh on each request
- Automatic redirects based on authentication state

## Development

### Running Locally

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Deployment

This project is deployed on Vercel with automatic Supabase integration:

- **Production URL**: https://tune-energy.vercel.app/
- **Vercel Project**: https://vercel.com/bevalens-projects/tune-energy

