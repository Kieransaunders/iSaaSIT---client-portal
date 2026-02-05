# API Conventions

API patterns and conventions for iSaaSIT development.

## Table of Contents

- [Convex API Patterns](#convex-api-patterns)
- [Naming Conventions](#naming-conventions)
- [Error Handling](#error-handling)
- [Pagination](#pagination)
- [Response Formats](#response-formats)

---

## Convex API Patterns

### Public Functions

Use `query`, `mutation`, `action` for client-callable functions:

```typescript
// convex/customers.ts
import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

// List - returns array
export const list = query({
  args: { orgId: v.id("orgs") },
  returns: v.array(v.object({
    _id: v.id("customers"),
    _creationTime: v.number(),
    name: v.string(),
    email: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customers")
      .withIndex("by_org", q => q.eq("orgId", args.orgId))
      .order("desc")
      .collect()
  }
})

// Get - returns single item or null
export const get = query({
  args: { customerId: v.id("customers") },
  returns: v.union(
    v.object({
      _id: v.id("customers"),
      _creationTime: v.number(),
      name: v.string(),
      email: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.customerId)
  }
})

// Create - returns ID
export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    name: v.string(),
    email: v.optional(v.string()),
  },
  returns: v.id("customers"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("customers", args)
  }
})

// Update - returns updated item
export const update = mutation({
  args: {
    customerId: v.id("customers"),
    updates: v.object({
      name: v.optional(v.string()),
      email: v.optional(v.string()),
    }),
  },
  returns: v.union(
    v.object({ /* ... */ }),
    v.null()
  ),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.customerId, args.updates)
    return await ctx.db.get(args.customerId)
  }
})

// Delete - returns null
export const remove = mutation({
  args: { customerId: v.id("customers") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.customerId)
    return null
  }
})
```

---

### Internal Functions

Use `internalQuery`, `internalMutation`, `internalAction` for server-only:

```typescript
// convex/internal/billing.ts
import { internalMutation } from "../_generated/server"
import { v } from "convex/values"

// Called by webhooks, not clients
export const handleWebhook = internalMutation({
  args: {
    eventType: v.string(),
    data: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Process webhook
    return null
  }
})
```

---

## Naming Conventions

### Function Names

| Operation | Pattern | Example |
|-----------|---------|---------|
| List | `list` | `customers.list` |
| Get single | `get` | `customers.get` |
| Get by field | `getBy[Field]` | `customers.getByEmail` |
| Create | `create` | `customers.create` |
| Update | `update` | `customers.update` |
| Delete | `remove` | `customers.remove` |
| Search | `search` | `customers.search` |
| Count | `count` | `customers.count` |

### File Organization

```typescript
// One file per feature
convex/
├── customers.ts      # All customer operations
├── users.ts          # All user operations
├── billing.ts        # All billing operations
└── internal/
    ├── webhooks.ts   # Webhook handlers
    └── jobs.ts       # Background jobs
```

---

## Error Handling

### Standard Errors

```typescript
import { ConvexError } from "convex/values"

export const createCustomer = mutation({
  args: { orgId: v.id("orgs"), name: v.string() },
  handler: async (ctx, args) => {
    // Auth check
    const user = await requireAuth(ctx)
    if (user.orgId !== args.orgId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Not authorized for this organization"
      })
    }
    
    // Validation
    if (args.name.length < 2) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Name must be at least 2 characters",
        field: "name"
      })
    }
    
    // Business logic
    const count = await ctx.db
      .query("customers")
      .withIndex("by_org", q => q.eq("orgId", args.orgId))
      .collect()
      .then(c => c.length)
    
    const org = await ctx.db.get(args.orgId)
    if (count >= org.maxCustomers) {
      throw new ConvexError({
        code: "USAGE_LIMIT",
        message: `Customer limit reached (${org.maxCustomers})`,
        limit: org.maxCustomers,
        upgradeUrl: "/billing/upgrade"
      })
    }
    
    return await ctx.db.insert("customers", args)
  }
})
```

### Frontend Error Handling

```typescript
import { useConvexMutation } from "@convex-dev/react-query"
import { api } from "@/convex/_generated/api"

function CreateCustomerForm() {
  const create = useConvexMutation(api.customers.create)
  
  const handleSubmit = async (data: { name: string }) => {
    try {
      await create.mutateAsync({ orgId, name: data.name })
    } catch (error) {
      // Handle structured errors
      if (error.data?.code === "USAGE_LIMIT") {
        showUpgradeModal(error.data.upgradeUrl)
      } else if (error.data?.code === "VALIDATION_ERROR") {
        showFieldError(error.data.field, error.data.message)
      } else {
        showGenericError(error.message)
      }
    }
  }
}
```

---

## Pagination

### Cursor-Based Pagination

```typescript
import { paginationOptsValidator } from "convex/server"

export const listPaginated = query({
  args: {
    orgId: v.id("orgs"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customers")
      .withIndex("by_org", q => q.eq("orgId", args.orgId))
      .order("desc")
      .paginate(args.paginationOpts)
  }
})
```

### Frontend Pagination

```typescript
import { usePaginatedQuery } from "@convex-dev/react-query"

function CustomerList() {
  const {
    results,
    status,
    loadMore,
    isLoading
  } = usePaginatedQuery(
    api.customers.listPaginated,
    { orgId },
    { initialNumItems: 20 }
  )
  
  return (
    <div>
      {results.map(customer => (
        <CustomerCard key={customer._id} customer={customer} />
      ))}
      
      {status === "CanLoadMore" && (
        <button onClick={() => loadMore(20)}>
          Load More
        </button>
      )}
    </div>
  )
}
```

---

## Response Formats

### Standard Response

```typescript
// Success
{
  _id: "kx...",
  _creationTime: 1234567890,
  name: "Customer Name",
  email: "customer@example.com"
}

// List response
[
  { _id: "kx...", name: "Customer 1" },
  { _id: "kx...", name: "Customer 2" }
]
```

### Enriched Response

```typescript
// Include related data
export const getWithProjects = query({
  args: { customerId: v.id("customers") },
  returns: v.union(
    v.object({
      customer: v.object({ /* ... */ }),
      projects: v.array(v.object({ /* ... */ })),
      projectCount: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.customerId)
    if (!customer) return null
    
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_customer", q => q.eq("customerId", args.customerId))
      .collect()
    
    return {
      customer,
      projects,
      projectCount: projects.length
    }
  }
})
```

---

## HTTP Endpoints

### Webhook Handler

```typescript
// convex/http.ts
import { httpRouter } from "convex/server"
import { httpAction } from "./_generated/server"

const http = httpRouter()

http.route({
  path: "/webhooks/lemon-squeezy",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const signature = req.headers.get("x-signature")
    const body = await req.text()
    
    // Verify signature...
    
    const event = JSON.parse(body)
    
    await ctx.runMutation(internal.billing.handleWebhook, {
      eventType: event.meta.event_name,
      data: event.data
    })
    
    return new Response("OK", { status: 200 })
  })
})

export default http
```

### Public API Endpoint

```typescript
http.route({
  path: "/api/public/status",
  method: "GET",
  handler: httpAction(async (ctx) => {
    return new Response(
      JSON.stringify({ status: "ok", timestamp: Date.now() }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  })
})
```

---

## API Versioning

### URL Versioning (for HTTP APIs)

```typescript
http.route({
  path: "/v1/customers",
  method: "GET",
  handler: httpAction(async (ctx) => {
    // v1 implementation
  })
})

http.route({
  path: "/v2/customers",
  method: "GET",
  handler: httpAction(async (ctx) => {
    // v2 implementation with breaking changes
  })
})
```

### Function Versioning (for Convex Functions)

```typescript
// Keep old version
export const create = mutation({
  args: { /* ... */ },
  handler: async (ctx, args) => { /* ... */ }
})

// Add new version with different name
export const createV2 = mutation({
  args: { /* ... with changes ... */ },
  handler: async (ctx, args) => { /* ... */ }
})
```

---

## Rate Limiting

### Client-Side

```typescript
import { useThrottle } from "@/hooks/use-throttle"

function SearchInput() {
  const [query, setQuery] = useState("")
  const throttledQuery = useThrottle(query, 300)
  
  const { data } = useQuery(
    convexQuery(api.customers.search, { query: throttledQuery })
  )
}
```

### Server-Side

See `SECURITY.md` for server-side rate limiting patterns.
