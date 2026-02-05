# AGENTS.md - AI Coding Agent Guide

This document provides essential context for AI coding agents working on the iSaaSIT project.

## Quick Reference

| Resource | Location | Purpose |
|----------|----------|---------|
| **Project Overview** | `LLM.txt` (root) | Quick context for any LLM |
| **AI Rules** | `.cursor/rules/*.mdc` | Specific patterns by topic |
| **Example Prompts** | `.cursor/example-prompts.md` | Copy-paste prompts for tasks |
| **Requirements** | `.planning/PROJECT.md` | Feature requirements & status |
| **Troubleshooting** | `TROUBLESHOOTING.md` | Common errors and fixes |
| **Security** | `SECURITY.md` | Security best practices |
| **Migrations** | `MIGRATIONS.md` | Database migration patterns |
| **Deployment** | `DEPLOYMENT.md` | Production deployment guide |
| **Testing** | `TESTING.md` | Testing patterns and strategies |
| **API Conventions** | `API.md` | API patterns and conventions |
| **Contributing** | `CONTRIBUTING.md` | How to contribute |

## AI-Assisted Development

This project includes structured rules for AI coding assistants to ensure consistent, high-quality contributions.

### For Cursor Users

The `.cursor/rules/*.mdc` files provide contextual guidance based on file type:

| Rule File | Topic | Applies To |
|-----------|-------|------------|
| `01-project-overview.mdc` | Project basics, stack overview | All files |
| `02-convex-patterns.mdc` | Backend patterns, schema, queries | `convex/**/*.ts` |
| `03-tanstack-router.mdc` | Routing conventions | `src/routes/**/*.tsx` |
| `04-authentication.mdc` | WorkOS AuthKit patterns | `src/**/*.tsx` |
| `05-multi-tenancy.mdc` | Orgs, roles, data isolation | `convex/**/*.ts`, `src/**/*.tsx` |
| `06-ui-components.mdc` | Tailwind v4, shadcn/ui | `src/**/*.tsx`, `src/**/*.css` |
| `07-billing-integration.mdc` | Lemon Squeezy patterns | `convex/**/*.ts` |
| `08-development-workflow.mdc` | Common tasks, debugging | All files |

### For Claude Code

Located in `.claude/skills/*/`, these provide domain-specific guidance:

| Skill | Description |
|-------|-------------|
| `convex/` | Backend development with Convex (queries, mutations, schemas) |
| `tanstack/` | TanStack Start, Router, and Query patterns |
| `tailwind-v4/` | Tailwind CSS v4 styling and theming |
| `shadcn-ui/` | shadcn/ui component usage |
| `astro-starlight/` | Documentation site development |
| `ui-ux-pro-max/` | UI/UX design intelligence (50+ styles, 21 palettes, 50 font pairings) |

**Note:** The `convex.skill` file in the project root is a packaged ZIP archive of the convex skill, used by other AI tools (e.g., Windsurf). It contains the same content as `.claude/skills/convex/`.

Use the structured prompts in `.cursor/example-prompts.md` for common tasks like:
- Initial project setup / PRD
- Feature implementation
- Convex function creation
- Route/page creation
- Bug fixes
- Refactoring

### GSD: Get Shit Done

This project is optimized for **GSD** - a meta-prompting and spec-driven development system that prevents context rot and enables reliable AI-assisted coding.

**What GSD provides:**
- Structured project initialization (`/gsd:new-project`)
- Research → Plan → Execute → Verify workflow
- Parallel execution with fresh context windows
- Automatic documentation generation (PROJECT.md, REQUIREMENTS.md, ROADMAP.md)

**Essential GSD Commands:**

| Command | When to Use |
|---------|-------------|
| `/gsd:map-codebase` | Starting work on existing code - analyzes structure |
| `/gsd:new-project` | Starting a new project or major feature |
| `/gsd:discuss-phase <phase>` | Before planning - clarify implementation preferences |
| `/gsd:plan-phase <phase>` | Create detailed execution plans |
| `/gsd:execute-phase <phase>` | Execute plans with fresh context |
| `/gsd:verify-phase <phase>` | Verify implementation meets goals |
| `/gsd:checkpoint` | Review progress and decide next steps |

**GSD Principles for This Project:**

1. **Vertical Slices** - Build features end-to-end, not layer by layer
2. **Spec Before Code** - Document requirements in `.planning/` before implementation
3. **Fresh Context** - Use small, focused plans executed in fresh context windows
4. **Verify Early** - Check against goals after each phase
5. **Ship Working** - Prefer working code over perfect abstraction

**Installation:**

```bash
# For local project use (recommended)
npx get-shit-done-cc@latest --claude --local

# Or globally
npx get-shit-done-cc@latest --claude --global

# Verify
/gsd:help
```

**GSD Project Structure:**

```
.planning/
├── PROJECT.md              # Project overview and goals
├── REQUIREMENTS.md         # Extracted requirements
├── ROADMAP.md              # Execution phases
├── STATE.md                # Current progress
├── research/               # Research findings
├── [phase]-CONTEXT.md      # Phase preferences
├── [phase]-RESEARCH.md     # Phase research
├── [phase]-[N]-PLAN.md     # Execution plans
├── [phase]-[N]-SUMMARY.md  # Execution summaries
└── [phase]-VERIFICATION.md # Phase verification
```

**Reference:** [github.com/glittercowboy/get-shit-done](https://github.com/glittercowboy/get-shit-done)

## Project Overview

**iSaaSIT** is an open-source SaaS starter kit designed for agencies and freelancers who need a repeatable client project template. It provides a multi-tenant foundation where:
- An **agency (Org)** manages multiple **client companies (Customers)**
- Role-based data isolation ensures proper access control
- Billing with usage caps enforces plan limits
- A client portal enables customer self-service

**Base Template:** Fork of `get-convex/workos-authkit` (TanStack Start + Convex + WorkOS AuthKit)

**License:** MIT

## Technology Stack

### Frontend
- **React 19** - UI framework
- **TanStack Start** - Full-stack React framework with SSR support
- **TanStack Router** - File-based routing with type-safe navigation
- **TanStack React Query** - Server state management with Convex integration
- **Tailwind CSS v4** - Utility-first styling
- **Vite 7** - Build tool and dev server

### Backend
- **Convex** - Serverless backend with real-time database
- **WorkOS AuthKit** - Authentication via JWT tokens
- **TypeScript 5.9** - Type-safe development

### Planned Integrations
- **Lemon Squeezy** - Billing and subscriptions (Merchant of Record)
- **shadcn/ui** - Component library

## Project Structure

```
/
├── src/                          # Frontend source code
│   ├── routes/                   # File-based routes (TanStack Router)
│   │   ├── __root.tsx           # Root layout with auth setup
│   │   ├── index.tsx            # Home page (public)
│   │   ├── callback.tsx         # WorkOS OAuth callback handler
│   │   ├── _authenticated.tsx   # Protected route layout
│   │   └── _authenticated/
│   │       └── authenticated.tsx # Example protected page
│   ├── router.tsx               # Router configuration with Convex + WorkOS
│   ├── start.ts                 # TanStack Start configuration
│   ├── app.css                  # Global styles (Tailwind v4)
│   ├── routeTree.gen.ts         # Auto-generated route tree
│   └── vite-env.d.ts            # Vite environment types
├── convex/                       # Backend Convex functions
│   ├── schema.ts                # Database schema
│   ├── myFunctions.ts           # Example queries/mutations/actions
│   ├── auth.config.ts           # WorkOS JWT auth configuration
│   ├── _generated/              # Auto-generated Convex types
│   └── README.md                # Convex documentation
├── .cursor/                     # AI coding assistant rules
│   ├── rules/                   # Contextual rule files (*.mdc)
│   └── example-prompts.md       # Copy-paste prompts
├── docs/                        # Documentation site (Starlight/Astro)
│   ├── astro.config.mjs         # Starlight configuration
│   ├── src/content/docs/        # Documentation content (MDX)
│   └── package.json             # Docs dependencies
├── .planning/                   # Project planning documents
│   ├── PROJECT.md               # Detailed project requirements
│   └── config.json              # Planning configuration
├── LLM.txt                      # Root-level LLM context
├── package.json                 # Dependencies and scripts
├── vite.config.ts               # Vite configuration
├── convex.json                  # Convex deployment config with AuthKit
├── tsconfig.json                # TypeScript configuration
└── .env.local.example           # Environment variables template
```

## Development Commands

```bash
# Start development (runs frontend + backend in parallel)
npm run dev

# Start only frontend dev server
npm run dev:frontend

# Start only Convex backend
npm run dev:backend

# Start documentation site dev server
npm run dev:docs

# Build for production
npm run build

# Build documentation site
npm run build:docs

# Start production server
npm run start

# Preview built documentation
npm run preview:docs

# Run type checking and linting
npm run lint

# Format code with Prettier
npm run format

# Initialize Convex (first-time setup)
npx convex dev
```

## Architecture Details

### Authentication Flow

1. **WorkOS AuthKit** handles authentication via redirect-based OAuth
2. JWT tokens are validated by Convex using `auth.config.ts`
3. Two auth hooks available:
   - `useAuth()` - For client components
   - `getAuth()` - For server loaders
4. Protected routes use the `_authenticated` layout with loader-based guards

### Route Protection Pattern

```typescript
// In routes/_authenticated.tsx
export const Route = createFileRoute('/_authenticated')({
  loader: async ({ location }) => {
    const { user } = await getAuth();
    if (!user) {
      const href = await getSignInUrl({ data: { returnPathname: location.pathname } });
      throw redirect({ href });
    }
  },
  component: () => <Outlet />,
});
```

### Convex Integration

The router integrates Convex with React Query and WorkOS:

```typescript
// In router.tsx
const convex = new ConvexReactClient(CONVEX_URL);
const convexQueryClient = new ConvexQueryClient(convex);

// Wrapped with AuthKitProvider and ConvexProviderWithAuth
```

### File-Based Routing Conventions

- `routes/index.tsx` → `/`
- `routes/callback.tsx` → `/callback`
- `routes/_authenticated.tsx` → Layout wrapper (no URL segment)
- `routes/_authenticated/authenticated.tsx` → `/authenticated`

Files starting with `_` are layout routes that don't create URL segments.

## Data Model (Planned)

### Core Entities

| Entity | Description | Managed By |
|--------|-------------|------------|
| **Org** | Agency organization | WorkOS (org + membership) + Convex (subscription data) |
| **Customer** | Agency's client company | Convex table (linked to orgId) |
| **User** | End user | WorkOS; linked to customerId if role = Client |
| **StaffCustomerAssignment** | Maps Staff to accessible Customers | Convex table |

### Role Definitions

| Role | Visibility | Capabilities |
|------|------------|--------------|
| **Admin** | All org data | Billing, invites, full access |
| **Staff** | Assigned Customers only | Standard access within scope |
| **Client** | Own Customer only | Limited access within scope |

### Billing Model

- **Level:** Organization (not individual users)
- **Provider:** Lemon Squeezy (planned)
- **Caps:** maxCustomers, maxStaff, maxClients synced from plan metadata

## Code Style Guidelines

### Prettier Configuration
- Single quotes
- Trailing commas (all)
- Print width: 120
- Semicolons: true

### ESLint
- Extends `@tanstack/eslint-config`
- Includes `@convex-dev/eslint-plugin`
- Generated files (`convex/_generated`, `routeTree.gen.ts`) are ignored

### TypeScript
- Strict mode enabled
- Path aliases: `@/*` and `~/*` both map to `./src/*`
- Module resolution: Bundler

## Environment Variables

Required in `.env.local`:

```bash
# WorkOS AuthKit Configuration
WORKOS_CLIENT_ID=client_xxx
WORKOS_API_KEY=sk_test_xxx
WORKOS_COOKIE_PASSWORD=xxx  # Min 32 characters
WORKOS_REDIRECT_URI=http://localhost:3000/callback

# Convex Configuration
VITE_CONVEX_URL=https://xxx.convex.cloud
```

## Important Files to Know

### Auto-Generated Files (Do Not Edit)
- `convex/_generated/*` - Generated by `npx convex dev`
- `src/routeTree.gen.ts` - Generated by TanStack Router

### Key Configuration Files
- `convex.json` - Convex deployment settings with AuthKit integration
- `convex/auth.config.ts` - JWT validation for WorkOS tokens
- `vite.config.ts` - Vite + TanStack Start + React configuration

## Testing Strategy

**Note:** No test suite is currently implemented. Tests should be added as the project matures.

## Common Development Tasks

### Adding a New Route

1. Create a file in `src/routes/` following the file-based routing convention
2. Export `Route` using `createFileRoute()`
3. The route tree will be auto-generated on next dev server start

**Reference:** `.cursor/rules/03-tanstack-router.mdc`

### Adding a Convex Function

1. Add queries/mutations/actions to `convex/myFunctions.ts` or create new files
2. Import from `./_generated/server` for `query`, `mutation`, `action`
3. Use `v` from `convex/values` for argument validation
4. Run `npx convex dev` to deploy and regenerate types

**Reference:** `.cursor/rules/02-convex-patterns.mdc`

### Protecting a Route

Place the route file under `routes/_authenticated/` or add protection to an existing layout.

**Reference:** `.cursor/rules/04-authentication.mdc`

## Deployment Notes

- **Primary Target:** Netlify
- **Convex:** Deployed separately via `npx convex deploy`
- **Environment:** Configure `convex.json` for dev/preview/prod AuthKit settings

## Additional Documentation

### Development Guides

| Document | When to Read |
|----------|--------------|
| `TROUBLESHOOTING.md` | When encountering errors or issues |
| `SECURITY.md` | When implementing auth, authorization, or security features |
| `MIGRATIONS.md` | When modifying database schema |
| `DEPLOYMENT.md` | When deploying to production |
| `TESTING.md` | When adding tests or testing features |
| `API.md` | When designing APIs or Convex functions |
| `CONTRIBUTING.md` | When contributing to the project |

### External Documentation

- [Convex Docs](https://docs.convex.dev/)
- [TanStack Start](https://tanstack.com/start)
- [TanStack Router](https://tanstack.com/router)
- [WorkOS AuthKit](https://workos.com/docs/authkit)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [GSD System](https://github.com/glittercowboy/get-shit-done) - Meta-prompting for AI-assisted development

## Current Status

As of the last update, the following features are:
- ✅ **Implemented:** User sign-in via WorkOS AuthKit, authenticated route protection, Convex backend with JWT validation
- 🚧 **In Progress:** Organization creation and management, customer management, role-based access control
- ⏳ **Planned:** Lemon Squeezy billing integration, shadcn/ui components, usage cap enforcement

See `.planning/PROJECT.md` for detailed requirements and progress tracking.

---

*For AI coding assistance, refer to `.cursor/rules/*.mdc` and `.cursor/example-prompts.md`*
