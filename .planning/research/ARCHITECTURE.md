# Architecture Research: Multi-Tenant Convex with WorkOS

## Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (TanStack Start)                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Auth Routes │  │ Dashboard   │  │ Client Portal           │  │
│  │ (WorkOS)    │  │ (Admin/Staff)│ │ (Client role)           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Convex Backend                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Queries     │  │ Mutations   │  │ HTTP Actions            │  │
│  │ (scoped)    │  │ (validated) │  │ (webhooks)              │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────┴───────────────────────────────┐  │
│  │                    Data Layer                              │  │
│  │  ┌────────┐ ┌──────────┐ ┌─────────────────────────────┐  │  │
│  │  │ Orgs   │ │ Customers │ │ StaffCustomerAssignments   │  │  │
│  │  └────────┘ └──────────┘ └─────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
      ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
      │   WorkOS    │ │ Lemon       │ │   Resend    │
      │   AuthKit   │ │ Squeezy     │ │   Email     │
      └─────────────┘ └─────────────┘ └─────────────┘
```

## Data Model

### Convex Schema

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Synced from WorkOS, extended with billing
  orgs: defineTable({
    workosOrgId: v.string(),        // WorkOS org ID
    name: v.string(),
    // Billing (from Lemon Squeezy)
    subscriptionId: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()),
    planId: v.optional(v.string()),
    // Usage caps (from plan metadata)
    maxCustomers: v.number(),
    maxStaff: v.number(),
    maxClients: v.number(),
  })
    .index("by_workos_org_id", ["workosOrgId"]),

  // Agency's client companies
  customers: defineTable({
    orgId: v.id("orgs"),
    name: v.string(),
  })
    .index("by_org", ["orgId"]),

  // Staff-to-Customer assignments
  staffCustomerAssignments: defineTable({
    orgId: v.id("orgs"),
    staffUserId: v.string(),  // WorkOS user ID
    customerId: v.id("customers"),
  })
    .index("by_org", ["orgId"])
    .index("by_staff", ["staffUserId"])
    .index("by_customer", ["customerId"]),

  // Users synced from WorkOS (for client → customer mapping)
  users: defineTable({
    workosUserId: v.string(),
    orgId: v.optional(v.id("orgs")),
    role: v.optional(v.union(
      v.literal("admin"),
      v.literal("staff"),
      v.literal("client")
    )),
    customerId: v.optional(v.id("customers")), // Only for client role
  })
    .index("by_workos_user_id", ["workosUserId"])
    .index("by_org", ["orgId"]),
});
```

## Data Flow

### 1. Authentication Flow

```
User → WorkOS AuthKit → JWT → Convex auth.getUserIdentity()
                                    │
                                    ▼
                         { userId, orgId, orgRole, email }
```

### 2. Org Creation Flow

```
User signs up (WorkOS)
    │
    ▼
No org? → Show "Create Organization" screen
    │
    ▼
User submits org name
    │
    ▼
Convex mutation: createOrg()
    ├── Call WorkOS API to create org
    ├── Insert org record in Convex with free tier caps
    └── Add user as admin in WorkOS
    │
    ▼
WorkOS webhook fires → Convex syncs org data
```

### 3. Data Scoping Flow

```
Query request → Get user identity
    │
    ▼
Check role from JWT
    │
    ├── Admin? → Filter by orgId only
    │
    ├── Staff? → Filter by orgId + assigned customers
    │              │
    │              └── Query staffCustomerAssignments for user
    │
    └── Client? → Filter by orgId + user's customerId
```

### 4. Billing Flow

```
Admin clicks "Upgrade"
    │
    ▼
Redirect to Lemon Squeezy checkout (org ID in metadata)
    │
    ▼
User completes payment
    │
    ▼
Lemon Squeezy webhook → Convex HTTP action
    │
    ├── Verify signature
    ├── Extract org ID from metadata
    ├── Extract plan caps from product metadata
    └── Update org record with subscription + caps
```

## Data Scoping Patterns

### Option A: Query-Level Scoping (Recommended)

Each query explicitly checks role and filters:

```typescript
export const listCustomers = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (user.role === "admin") {
      return ctx.db.query("customers")
        .withIndex("by_org", q => q.eq("orgId", user.orgId))
        .collect();
    }

    if (user.role === "staff") {
      const assignments = await ctx.db.query("staffCustomerAssignments")
        .withIndex("by_staff", q => q.eq("staffUserId", user.workosUserId))
        .collect();
      const customerIds = assignments.map(a => a.customerId);
      // Filter customers by assigned IDs
      ...
    }

    if (user.role === "client") {
      return ctx.db.get(user.customerId);
    }
  }
});
```

### Option B: RLS Wrappers (From Convex Stack)

Define rules once, apply via wrapper:

```typescript
const withRLS = customQuery(query, {
  args: {},
  handler: async (ctx, args, baseHandler) => {
    const scopedCtx = await applyScopingRules(ctx);
    return baseHandler(scopedCtx, args);
  }
});
```

**Recommendation:** Start with Option A (explicit), refactor to Option B if patterns repeat.

## Build Order

Based on dependencies:

1. **Phase 1: Foundation**
   - shadcn/ui setup
   - Convex schema (orgs, customers, users, assignments)
   - WorkOS webhook handlers for user/org sync

2. **Phase 2: Org + Customer**
   - Org creation flow
   - Customer CRUD (admin only)
   - Basic dashboard

3. **Phase 3: Roles + Scoping**
   - Staff assignment UI
   - Client invite flow
   - Data scoping in all queries

4. **Phase 4: Billing**
   - Lemon Squeezy integration
   - Webhook handlers
   - Usage cap enforcement

## Boundaries

| Component | Responsibility | Does NOT handle |
|-----------|----------------|-----------------|
| WorkOS | Auth, users, orgs, roles | Customer data, billing |
| Convex | Data, business logic, webhooks | Auth, email sending |
| Lemon Squeezy | Billing, subscriptions | User management |
| Resend | Transactional email | Auth emails (WorkOS does) |
| Frontend | UI, routing, state | Auth tokens (WorkOS SDK) |
