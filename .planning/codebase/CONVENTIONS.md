# Code Conventions

Coding standards and patterns for the iSaaSIT codebase.

## Table of Contents

- [Code Style](#code-style)
- [Naming Conventions](#naming-conventions)
- [TypeScript Patterns](#typescript-patterns)
- [File Organization](#file-organization)
- [Error Handling](#error-handling)
- [Common Patterns](#common-patterns)

---

## Code Style

### Formatting

**Prettier Configuration** (`.prettier.config.mjs`):

```javascript
const config = {
  quoteProps: 'consistent',
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 120,
  semi: true,
};
```

**Apply formatting**:
```bash
npm run format
```

### Linting

**ESLint Configuration** (`eslint.config.mjs`):

```javascript
import { defineConfig, globalIgnores } from 'eslint/config';
import { tanstackConfig } from '@tanstack/eslint-config';
import convexPlugin from '@convex-dev/eslint-plugin';

export default defineConfig([
  ...tanstackConfig,
  ...convexPlugin.configs.recommended,
  globalIgnores(['convex/_generated']),
]);
```

**Run linting**:
```bash
npm run lint
```

**Ignored paths**:
- `convex/_generated/*` - Auto-generated Convex types
- `src/routeTree.gen.ts` - Auto-generated route tree

### Import Order

1. React/Node built-ins
2. Third-party libraries (grouped by source)
3. Absolute imports (`@/components`, `@/lib`)
4. Relative imports
5. Type-only imports

Example:
```typescript
import * as React from 'react';
import { useCallback, useMemo } from 'react';

import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { Building2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Id } from '../../convex/_generated/dataModel';
```

---

## Naming Conventions

### Files

| Type | Pattern | Example |
|------|---------|---------|
| React Components | PascalCase | `Button.tsx`, `MainLayout.tsx` |
| Convex Functions | camelCase | `queries.ts`, `mutations.ts` |
| Utility Files | camelCase | `utils.ts`, `constants.ts` |
| Route Files | camelCase or descriptive | `index.tsx`, `_authenticated.tsx` |
| Hooks | camelCase with `use` prefix | `use-mobile.ts` |

### Variables & Functions

| Type | Pattern | Example |
|------|---------|---------|
| Variables | camelCase | `const userRecord = ...` |
| Functions | camelCase | `function getCustomerUsage() {...}` |
| React Components | PascalCase | `function CustomerList() {...}` |
| Constants (module level) | UPPER_SNAKE_CASE | `const MOBILE_BREAKPOINT = 768` |
| Types/Interfaces | PascalCase | `interface MainLayoutProps {...}` |
| Type Aliases | PascalCase | `type UserRole = 'admin' \| 'staff'` |

### Convex-Specific Naming

```typescript
// Queries - descriptive noun or noun phrase
export const listCustomers = query({...});
export const getCustomer = query({...});
export const getUsageStats = query({...});

// Mutations - verb + noun
export const createCustomer = mutation({...});
export const updateCustomer = mutation({...});
export const deleteCustomer = mutation({...});

// Actions - verb + noun (for external API calls)
export const syncSubscription = action({...});
export const processWebhook = action({...});
```

### Database Fields

```typescript
// Timestamps - past tense verb + At
createdAt: v.number(),
updatedAt: v.number(),
deletedAt: v.optional(v.number()),
expiresAt: v.number(),

// IDs - descriptive + Id (camelCase)
workosOrgId: v.string(),
workosUserId: v.string(),
customerId: v.optional(v.id("customers")),
subscriptionId: v.optional(v.string()),

// Foreign keys - entity + Id
orgId: v.id("orgs"),
staffUserId: v.id("users"),
```

---

## TypeScript Patterns

### Strict Mode

All strict TypeScript options are enabled (`tsconfig.json`):

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "isolatedModules": true,
    "noEmit": true
  }
}
```

### Path Aliases

Two equivalent aliases map to `./src/*`:

```json
{
  "paths": {
    "@/*": ["./src/*"],
    "~/*": ["./src/*"]
  }
}
```

**Prefer `@/`** for consistency:

```typescript
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
```

### Type Imports

Use `type` keyword for type-only imports:

```typescript
import type { ReactNode } from 'react';
import type { Id } from '../_generated/dataModel';
import type { VariantProps } from 'class-variance-authority';
```

### Convex Type Patterns

```typescript
// Import generated types
import type { Id } from '../_generated/dataModel';

// Use Id<"tableName"> for document IDs
const customerId: Id<"customers"> = args.customerId;

// Type-safe partial updates
type CustomerDoc = typeof customer;
const updateData: Partial<CustomerDoc> = {
  updatedAt: Date.now(),
};
```

### Component Props Patterns

```typescript
// Interface for complex props
interface MainLayoutProps {
  children: ReactNode;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
}

// Inline type for simple props
function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {...}

// Use Readonly for immutable props
function RootDocument({ children }: Readonly<{ children: ReactNode }>) {...}
```

---

## File Organization

### Frontend (`src/`)

```
src/
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── layout/       # Layout components
│   ├── billing/      # Domain-specific
│   └── team/         # Domain-specific
├── hooks/            # Custom React hooks
├── lib/              # Utilities
│   ├── utils.ts      # cn() and helpers
│   └── constants.ts  # App constants
├── routes/           # TanStack Router routes
│   ├── __root.tsx    # Root layout
│   ├── index.tsx     # Home page
│   ├── _authenticated/  # Protected routes
│   └── ...
├── router.tsx        # Router configuration
├── start.ts          # TanStack Start config
└── app.css           # Global styles
```

### Backend (`convex/`)

```
convex/
├── _generated/       # Auto-generated types
├── schema.ts         # Database schema
├── auth.config.ts    # WorkOS JWT config
├── http.ts           # HTTP actions
├── myFunctions.ts    # Example/template functions
├── billing/          # Domain modules
│   ├── queries.ts
│   └── actions.ts
├── customers/
│   └── crud.ts       # Full CRUD operations
├── users/
│   ├── queries.ts
│   ├── mutations.ts
│   └── sync.ts
└── ...
```

---

## Error Handling

### Convex Error Pattern

Always use `ConvexError` for operational errors:

```typescript
import { ConvexError, v } from 'convex/values';
import { query } from './_generated/server';

export const getCustomer = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    // Auth check
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    // Data validation
    const customer = await ctx.db.get("customers", args.customerId);
    if (!customer) {
      throw new ConvexError("Customer not found");
    }

    // Authorization check
    if (customer.orgId !== userRecord.orgId) {
      throw new ConvexError("Access denied");
    }

    return customer;
  },
});
```

### Frontend Error Handling

```typescript
// Server function errors
const fetchWorkosAuth = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const auth = await getAuth();
    return { userId: auth.user?.id ?? null };
  } catch (error) {
    // Return null instead of throwing for expected auth failures
    return { userId: null };
  }
});

// Component-level error boundaries
export const Route = createFileRoute('/_authenticated')({
  errorComponent: ({ error }) => (
    <div>Error loading page: {error.message}</div>
  ),
});
```

---

## Common Patterns

### Convex Query Pattern

```typescript
import { ConvexError } from 'convex/values';
import { query } from '../_generated/server';

/**
 * JSDoc comment describing the function
 */
export const listCustomers = query({
  args: {}, // Empty for no args
  handler: async (ctx) => {
    // 1. Auth check
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    // 2. Get user record
    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", user.subject))
      .first();

    if (!userRecord?.orgId) {
      throw new ConvexError("User not associated with an organization");
    }

    // 3. Role-based access
    const role = userRecord.role;
    if (role === "admin") {
      // Admin sees all
      return await ctx.db
        .query("customers")
        .withIndex("by_org", (q) => q.eq("orgId", userRecord.orgId))
        .collect();
    }
    // ... other role handling
  },
});
```

### Convex Mutation Pattern

```typescript
import { ConvexError, v } from 'convex/values';
import { mutation } from '../_generated/server';

export const createCustomer = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Auth + permission checks
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new ConvexError("Not authenticated");

    // Get org and check limits
    const org = await ctx.db.get("orgs", orgId);
    const existing = await ctx.db
      .query("customers")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();

    if (existing.length >= org.maxCustomers) {
      throw new ConvexError("Customer limit reached");
    }

    // Create with timestamps
    const now = Date.now();
    const customerId = await ctx.db.insert("customers", {
      orgId,
      name: args.name,
      email: args.email,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    return customerId;
  },
});
```

### Route Definition Pattern

```typescript
// src/routes/featureName.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';
import { getAuth } from '@workos/authkit-tanstack-react-start';

export const Route = createFileRoute('/featureName')({
  // Data loading
  loader: async () => {
    const { user } = await getAuth();
    if (!user) {
      throw redirect({ to: '/signin' });
    }
    return { user };
  },
  // Component
  component: FeaturePage,
  // Metadata
  head: () => ({
    meta: [{ title: 'Feature - iSaaSIT' }],
  }),
});

function FeaturePage() {
  const { user } = Route.useLoaderData();
  return <div>...</div>;
}
```

### Protected Route Layout Pattern

```typescript
// src/routes/_authenticated.tsx
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { getAuth, getSignInUrl } from '@workos/authkit-tanstack-react-start';

export const Route = createFileRoute('/_authenticated')({
  loader: async () => {
    const { user } = await getAuth();
    if (!user) {
      const href = await getSignInUrl();
      throw redirect({ href });
    }
    return { user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}
```

### Component with Variants (shadcn/ui)

```typescript
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'base-classes-here',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        destructive: 'bg-destructive text-white',
        outline: 'border bg-background',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3',
        lg: 'h-10 rounded-md px-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface ButtonProps extends 
  React.ComponentProps<'button'>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({ 
  className, 
  variant = 'default', 
  size = 'default',
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
```

### Custom Hook Pattern

```typescript
// src/hooks/use-mobile.ts
import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
}
```

### Database Schema Pattern

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  tableName: defineTable({
    // Required fields first
    requiredField: v.string(),
    
    // Foreign keys
    relatedId: v.id("otherTable"),
    
    // Optional fields
    optionalField: v.optional(v.string()),
    
    // Enums using union of literals
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("pending")
    ),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    // Indexes for efficient queries
    .index("by_foreign_key", ["relatedId"])
    .index("by_composite", ["relatedId", "status"]),
});
```

---

## Tailwind CSS v4 Patterns

### CSS Variables (OKLCH Colors)

```css
/* src/app.css */
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --radius: 0.625rem;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
}
```

### Utility Classes

```tsx
// Use semantic color names, not hardcoded values
<div className="bg-background text-foreground">

// Responsive prefixes
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

// State variants
<button className="hover:bg-primary/90 disabled:opacity-50">

// Dark mode (class-based)
<div className="dark:bg-card dark:text-card-foreground">
```

### Component Styling

```tsx
// Combine base classes with cn() utility
import { cn } from '@/lib/utils';

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card text-card-foreground shadow',
        className
      )}
      {...props}
    />
  );
}
```
