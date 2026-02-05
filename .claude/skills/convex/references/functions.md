# Convex Functions Reference

## Function Decorators

### Public Functions
```typescript
import { query, mutation, action } from "./_generated/server";
```

### Internal Functions (not exposed to clients)
```typescript
import { internalQuery, internalMutation, internalAction } from "./_generated/server";
```

## Function Naming and Paths

File path + export name = API path:
- `convex/users.ts` with `export const list` → `api.users.list`
- `convex/foo/bar.ts` with `export const get` → `api.foo.bar.get`
- Default export → `api.filename.default`

## Query Context (`QueryCtx`)

```typescript
ctx.db          // Database reader (get, query)
ctx.storage     // File storage (getUrl)
ctx.auth        // Authentication (getUserIdentity)
```

### Query Patterns

```typescript
// Get single document by ID
const user = await ctx.db.get(args.userId);

// Query with index (ALWAYS use this, not filter)
const users = await ctx.db
  .query("users")
  .withIndex("by_email", (q) => q.eq("email", args.email))
  .unique();

// Range queries
const recent = await ctx.db
  .query("messages")
  .withIndex("by_timestamp", (q) =>
    q.gte("timestamp", args.since)
     .lt("timestamp", args.until)
  )
  .order("desc")
  .take(50);

// Async iteration (preferred for large datasets)
for await (const doc of ctx.db.query("items").withIndex("by_status")) {
  // Process each document
}
```

### Collection Methods
| Method | Returns | Use When |
|--------|---------|----------|
| `.collect()` | All docs | Small result sets |
| `.first()` | First doc or null | Need first match |
| `.unique()` | Single doc | Exactly one expected (throws if multiple) |
| `.take(n)` | First n docs | Limited results |
| `.paginate(opts)` | Page + cursor | Pagination |

## Mutation Context (`MutationCtx`)

Includes everything from QueryCtx plus:

```typescript
ctx.db          // Database reader/writer
ctx.scheduler   // Schedule functions
```

### Write Operations

```typescript
// Insert - returns new document ID
const id = await ctx.db.insert("users", {
  name: "Alice",
  email: "alice@example.com"
});

// Patch - shallow merge (keeps other fields)
await ctx.db.patch(userId, { name: "Alice Smith" });

// Replace - full replacement (removes unlisted fields)
await ctx.db.replace(userId, {
  name: "Alice Smith",
  email: "alice.smith@example.com"
});

// Delete
await ctx.db.delete(userId);
```

## Action Context (`ActionCtx`)

```typescript
ctx.runQuery    // Execute internal query
ctx.runMutation // Execute internal mutation
ctx.runAction   // Execute internal action (use sparingly)
ctx.storage     // File storage
ctx.auth        // Authentication
ctx.scheduler   // Schedule functions
ctx.vectorSearch // Vector search
```

### Action Pattern

```typescript
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

export const processOrder = action({
  args: { orderId: v.id("orders") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Read data via internal query
    const order = await ctx.runQuery(internal.orders.get, {
      orderId: args.orderId
    });

    // Call external API
    const result = await fetch("https://api.stripe.com/...", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.STRIPE_KEY}` },
      body: JSON.stringify({ amount: order.total }),
    });

    // Write result via internal mutation
    await ctx.runMutation(internal.orders.markPaid, {
      orderId: args.orderId,
      paymentId: result.id,
    });

    return null;
  },
});
```

### Node.js Runtime

Add directive at file top for Node.js APIs:

```typescript
"use node";

import { action } from "./_generated/server";
import crypto from "crypto";  // Node.js built-in now available
```

## Scheduling

```typescript
// Schedule for future execution
await ctx.scheduler.runAfter(60000, internal.tasks.cleanup, { batchId });

// Schedule at specific time
await ctx.scheduler.runAt(timestamp, internal.tasks.remind, { userId });
```

### Cron Jobs (`convex/crons.ts`)

```typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Every 5 minutes
crons.interval("cleanup", { minutes: 5 }, internal.tasks.cleanup, {});

// Cron expression
crons.cron("daily report", "0 9 * * *", internal.reports.daily, {});

export default crons;
```

## Internal vs Public Functions

```typescript
// Public - callable from clients
export const list = query({ ... });

// Internal - only callable from other Convex functions
export const processInternal = internalMutation({ ... });

// Call internal functions
await ctx.runQuery(internal.users.getById, { id });
await ctx.runMutation(internal.orders.process, { orderId });
```

## HTTP Endpoints (`convex/http.ts`)

```typescript
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    await ctx.runMutation(internal.events.record, { data: body });
    return new Response("OK", { status: 200 });
  }),
});

export default http;
```

## Type Annotations for Same-File Calls

When calling functions in the same file, TypeScript may need help:

```typescript
import { FunctionReference } from "convex/server";

// Explicit type annotation resolves circular reference
const result = await ctx.runQuery(
  getUser as FunctionReference<"query", "internal">,
  { userId }
);
```
