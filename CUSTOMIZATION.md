# Customization Guide

Learn how to customize iSaaSIT for your agency's specific needs.

---

## Table of Contents

- [Branding](#branding)
- [Data Model Extensions](#data-model-extensions)
- [Adding New Features](#adding-new-features)
- [Navigation Customization](#navigation-customization)
- [Styling & Theming](#styling--theming)
- [Email Templates](#email-templates)
- [Deployment Configuration](#deployment-configuration)

---

## Branding

### Change App Name

**1. Update the sidebar header:**

Edit `src/components/layout/app-sidebar.tsx`:

```tsx
// Line ~117
<span className="truncate font-semibold">Your Agency Name</span>
```

**2. Update page titles:**

Edit `src/routes/__root.tsx` (or individual route files):

```tsx
<title>Your Agency Portal</title>
```

**3. Update environment/config:**

Create a constants file `src/lib/branding.ts`:

```typescript
export const BRANDING = {
  appName: "Your Agency Portal",
  companyName: "Your Agency Inc.",
  supportEmail: "support@youragency.com",
} as const;
```

---

### Change Logo

**1. Replace the sidebar icon:**

Edit `src/components/layout/app-sidebar.tsx`:

```tsx
// Replace the Building2 icon with your logo
import { YourLogoIcon } from "lucide-react";
// Or use an image:
<img src="/logo.svg" alt="Logo" className="size-4" />
```

**2. Add your logo file:**

Place your logo in `public/`:
- `public/logo.svg` - Main logo
- `public/favicon.ico` - Browser favicon
- `public/og-image.png` - Social media preview (1200x630px)

**3. Update favicon:**

Edit `index.html`:

```html
<link rel="icon" type="image/svg+xml" href="/logo.svg" />
```

---

### Customize Colors

iSaaSIT uses Tailwind CSS v4 with CSS variables for theming.

**Edit `src/app.css`:**

```css
@theme {
  /* Your brand colors */
  --color-primary: oklch(0.6 0.2 250); /* Your primary brand color */
  --color-accent: oklch(0.7 0.15 180);  /* Your accent color */
  
  /* Light mode */
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.15 0 0);
  
  /* Dark mode */
  @media (prefers-color-scheme: dark) {
    --color-background: oklch(0.15 0 0);
    --color-foreground: oklch(0.95 0 0);
  }
}
```

**Color Palette Generator:**

Use [oklch.com](https://oklch.com/) to create harmonious color palettes in OKLCH format.

---

### Change Fonts

**1. Add Google Fonts:**

Edit `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**2. Update Tailwind config:**

Edit `src/app.css`:

```css
@theme {
  --font-family-sans: 'Inter', system-ui, sans-serif;
  --font-family-heading: 'Inter', system-ui, sans-serif;
}
```

---

## Data Model Extensions

### Add Custom Fields to Customers

**1. Update the Convex schema:**

Edit `convex/schema.ts`:

```typescript
customers: defineTable({
  name: v.string(),
  orgId: v.id("orgs"),
  // ... existing fields
  
  // Add your custom fields:
  industry: v.optional(v.string()),
  website: v.optional(v.string()),
  customField1: v.optional(v.string()),
  metadata: v.optional(v.object({
    key1: v.string(),
    key2: v.number(),
  })),
})
```

**2. Update the create customer mutation:**

Edit `convex/customers/crud.ts`:

```typescript
export const createCustomer = mutation({
  args: {
    name: v.string(),
    industry: v.optional(v.string()),
    website: v.optional(v.string()),
    // ... your custom fields
  },
  handler: async (ctx, args) => {
    // ... existing auth logic
    
    const customerId = await ctx.db.insert("customers", {
      name: args.name,
      orgId: user.orgId,
      industry: args.industry,
      website: args.website,
      // ... your custom fields
      createdAt: Date.now(),
    });
    
    return customerId;
  },
});
```

**3. Update the UI form:**

Edit `src/routes/_authenticated/customers.tsx`:

```tsx
<Input
  placeholder="Industry (optional)"
  value={newCustomer.industry || ""}
  onChange={(e) => setNewCustomer({
    ...newCustomer,
    industry: e.target.value
  })}
/>
```

---

### Create New Tables

**1. Define the schema:**

Edit `convex/schema.ts`:

```typescript
export default defineSchema({
  // ... existing tables
  
  projects: defineTable({
    name: v.string(),
    customerId: v.id("customers"),
    orgId: v.id("orgs"),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived")
    ),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_customer", ["customerId"])
    .index("by_org", ["orgId"]),
});
```

**2. Create CRUD functions:**

Create `convex/projects/crud.ts`:

```typescript
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { ConvexError } from "convex/values";

export const createProject = mutation({
  args: {
    name: v.string(),
    customerId: v.id("customers"),
    startDate: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => 
        q.eq("workosUserId", identity.subject)
      )
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      customerId: args.customerId,
      orgId: user.orgId,
      status: "active",
      startDate: args.startDate,
      createdAt: Date.now(),
    });

    return projectId;
  },
});

export const listProjects = query({
  args: {
    customerId: v.id("customers"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_customer", (q) => 
        q.eq("customerId", args.customerId)
      )
      .collect();

    return projects;
  },
});
```

---

## Adding New Features

### Create a New Page

**1. Create the route file:**

Create `src/routes/_authenticated/projects.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/_authenticated/projects")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const projects = useQuery(api.projects.crud.listProjects);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Projects</h1>
      
      {/* Your UI here */}
      <div className="grid gap-4">
        {projects?.map((project) => (
          <div key={project._id} className="border rounded-lg p-4">
            <h3 className="font-semibold">{project.name}</h3>
            <p className="text-sm text-muted-foreground">
              Status: {project.status}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**2. Add to navigation:**

Edit `src/components/layout/app-sidebar.tsx`:

```tsx
import { FolderKanban } from "lucide-react";

const mainNavItems = [
  // ... existing items
  {
    title: "Projects",
    url: "/projects",
    icon: FolderKanban,
    roles: ["admin", "staff"], // Who can see this
  },
];
```

---

### Add Role-Based Features

**Control feature access by role:**

```tsx
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

function MyComponent() {
  const userInfo = useQuery(api.orgs.get.hasOrg);
  const isAdmin = userInfo?.role === "admin";
  const isStaff = userInfo?.role === "staff";
  const isClient = userInfo?.role === "client";

  return (
    <>
      {isAdmin && (
        <Button>Admin Only Feature</Button>
      )}
      
      {(isAdmin || isStaff) && (
        <Button>Staff Feature</Button>
      )}
      
      {/* Available to all */}
      <Button>Public Feature</Button>
    </>
  );
}
```

**Backend authorization:**

```typescript
// In your Convex mutation/query
export const adminOnlyAction = mutation({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => 
        q.eq("workosUserId", identity.subject)
      )
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Check role
    if (user.role !== "admin") {
      throw new ConvexError("Admin access required");
    }

    // Proceed with action...
  },
});
```

---

## Navigation Customization

### Add External Links

Edit `src/components/layout/app-sidebar.tsx`:

```tsx
const resourceNavItems = [
  {
    title: "Documentation",
    url: "https://docs.youragency.com",
    icon: BookOpen,
    external: true,
  },
  {
    title: "Support",
    url: "https://support.youragency.com",
    icon: HelpCircle,
    external: true,
  },
];
```

### Create Navigation Groups

```tsx
const clientNavItems = [
  {
    title: "My Projects",
    url: "/my-projects",
    icon: FolderKanban,
    roles: ["client"],
  },
  {
    title: "Documents",
    url: "/documents",
    icon: FileText,
    roles: ["client"],
  },
];

// In the sidebar component:
{filteredClientNav.length > 0 && (
  <SidebarGroup>
    <SidebarGroupLabel>Client Portal</SidebarGroupLabel>
    <SidebarGroupContent>
      {/* ... render items */}
    </SidebarGroupContent>
  </SidebarGroup>
)}
```

---

## Styling & Theming

### Dark Mode Customization

Edit `src/app.css`:

```css
@theme {
  /* Light mode */
  --color-background: oklch(1 0 0);
  --color-card: oklch(0.98 0 0);
  
  /* Dark mode */
  @media (prefers-color-scheme: dark) {
    --color-background: oklch(0.12 0 0);
    --color-card: oklch(0.15 0 0);
  }
}
```

### Component Styling

Use Tailwind classes with your custom theme:

```tsx
<div className="bg-background text-foreground">
  <Card className="border-border bg-card">
    <Button className="bg-primary text-primary-foreground">
      Click Me
    </Button>
  </Card>
</div>
```

---

## Email Templates

### Customize WorkOS Emails

1. Go to WorkOS Dashboard → **Authentication** → **Email Templates**
2. Customize the templates:
   - Invitation emails
   - Magic link emails
   - Password reset emails

### Add Custom Email Notifications

Create `convex/emails/send.ts`:

```typescript
import { action } from "../_generated/server";
import { v } from "convex/values";

export const sendWelcomeEmail = action({
  args: {
    to: v.string(),
    customerName: v.string(),
  },
  handler: async (ctx, args) => {
    // Use your email service (SendGrid, Resend, etc.)
    // Example with fetch to an email API:
    
    await fetch("https://api.youremailservice.com/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.EMAIL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: args.to,
        subject: "Welcome to Your Agency Portal",
        html: `<h1>Welcome ${args.customerName}!</h1>`,
      }),
    });
  },
});
```

---

## Deployment Configuration

### Environment-Specific Settings

Create `src/lib/config.ts`:

```typescript
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

export const config = {
  environment: isDev ? "development" : "production",
  apiUrl: isDev 
    ? "http://localhost:3000" 
    : "https://yourdomain.com",
  features: {
    billing: isProd, // Only enable billing in production
    analytics: isProd,
  },
} as const;
```

### Feature Flags

Create `convex/featureFlags.ts`:

```typescript
export const FEATURE_FLAGS = {
  enableProjects: true,
  enableDocuments: false,
  enableAdvancedReporting: false,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}
```

Use in components:

```tsx
import { isFeatureEnabled } from "../../convex/featureFlags";

function MyComponent() {
  if (!isFeatureEnabled("enableProjects")) {
    return null;
  }
  
  return <ProjectsFeature />;
}
```

---

## Best Practices

### 1. Keep Backend Authorization

Always enforce permissions in Convex functions, not just in the UI:

```typescript
// ✅ Good - Backend enforced
export const deleteCustomer = mutation({
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (user.role !== "admin") {
      throw new ConvexError("Admin required");
    }
    // ... delete logic
  },
});

// ❌ Bad - UI only (can be bypassed)
{isAdmin && <DeleteButton />}
```

### 2. Use TypeScript

Define types for your custom data:

```typescript
// src/types/custom.ts
export type Project = {
  _id: Id<"projects">;
  name: string;
  status: "active" | "completed" | "archived";
  // ... other fields
};
```

### 3. Create Reusable Components

Extract common patterns:

```tsx
// src/components/shared/DataTable.tsx
export function DataTable<T>({ data, columns }: Props<T>) {
  // Reusable table component
}
```

### 4. Document Your Changes

Update relevant docs when adding features:
- Add to `API.md` for new Convex functions
- Update `README.md` for major features
- Create migration guides in `MIGRATIONS.md`

---

## Need Help?

- 📚 [API Documentation](./API.md)
- 🔒 [Security Guide](./SECURITY.md)
- 🚀 [Deployment Guide](./DEPLOYMENT.md)
- 💬 [Open an Issue](https://github.com/your-repo/issues)

---

**Happy customizing! 🎨**
