---
name: convex
description: |
  Backend development with Convex - a reactive database platform with TypeScript support. Use this skill when:
  - Creating or modifying Convex functions (queries, mutations, actions)
  - Defining or updating Convex schemas and indexes
  - Working with files in a convex/ directory
  - Building React apps that use useQuery, useMutation, or useAction hooks
  - Setting up real-time data subscriptions
  - Implementing file storage, scheduling, or authentication with Convex
  - Troubleshooting Convex TypeScript errors or query patterns
  Triggers: convex, useQuery, useMutation, useAction, ctx.db, v.string(), v.object(), defineSchema, defineTable
---

# Convex

Convex is a reactive backend platform providing database, serverless functions, and real-time sync with end-to-end TypeScript type safety.

## Quick Reference

### Project Structure
```
convex/
├── _generated/        # Auto-generated (never edit)
├── schema.ts          # Database schema
├── http.ts            # HTTP endpoints (optional)
└── [yourFunctions].ts # Queries, mutations, actions
```

### Function Types

| Type | Use For | Can Access DB | Can Call External APIs |
|------|---------|---------------|------------------------|
| `query` | Read data | Yes (read) | No |
| `mutation` | Write data | Yes (read/write) | No |
| `action` | External APIs | No (use runQuery/runMutation) | Yes |

## Core Patterns

### 1. Schema Definition

Always define schemas in `convex/schema.ts`:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("user")),
  })
    .index("by_email", ["email"])
    .index("by_role_and_name", ["role", "name"]),

  messages: defineTable({
    authorId: v.id("users"),
    content: v.string(),
    channelId: v.id("channels"),
  })
    .index("by_channel", ["channelId"]),
});
```

**Index naming**: Use descriptive names like `by_field` or `by_field1_and_field2`.

### 2. Query Functions

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getUser = query({
  args: { userId: v.id("users") },
  returns: v.union(v.null(), v.object({
    _id: v.id("users"),
    name: v.string(),
    email: v.string(),
  })),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Query with index - ALWAYS use indexes, never filter()
export const getUsersByRole = query({
  args: { role: v.string() },
  returns: v.array(v.object({ _id: v.id("users"), name: v.string() })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_role_and_name", (q) => q.eq("role", args.role))
      .collect();
  },
});
```

**Critical**: Never use `.filter()` - always define indexes and use `.withIndex()`.

### 3. Mutation Functions

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string()
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      role: "user",
    });
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { name: args.name });
    return null;
  },
});
```

### 4. Action Functions (External APIs)

```typescript
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const sendEmail = action({
  args: { userId: v.id("users"), subject: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get data via internal query
    const user = await ctx.runQuery(internal.users.getUser, {
      userId: args.userId
    });

    // Call external API
    await fetch("https://api.email.com/send", {
      method: "POST",
      body: JSON.stringify({ to: user.email, subject: args.subject }),
    });

    return null;
  },
});
```

For Node.js APIs, add `"use node";` at the top of the file.

### 5. React Integration

```tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function UserList() {
  // Automatically subscribes and re-renders on changes
  const users = useQuery(api.users.list);
  const createUser = useMutation(api.users.create);

  if (users === undefined) return <div>Loading...</div>;

  return (
    <div>
      {users.map(user => <div key={user._id}>{user.name}</div>)}
      <button onClick={() => createUser({ name: "New User" })}>
        Add User
      </button>
    </div>
  );
}
```

## Common Validators

| Type | Validator | Example |
|------|-----------|---------|
| String | `v.string()` | `name: v.string()` |
| Number | `v.number()` | `age: v.number()` |
| Boolean | `v.boolean()` | `active: v.boolean()` |
| ID | `v.id("table")` | `userId: v.id("users")` |
| Optional | `v.optional(v)` | `bio: v.optional(v.string())` |
| Array | `v.array(v)` | `tags: v.array(v.string())` |
| Object | `v.object({})` | `profile: v.object({ ... })` |
| Union | `v.union(v, v)` | `status: v.union(v.literal("a"), v.literal("b"))` |
| Literal | `v.literal(val)` | `type: v.literal("admin")` |
| Any | `v.any()` | `metadata: v.any()` |

## Critical Rules

1. **Always include `args` and `returns` validators** on all functions
2. **Never use `.filter()`** - define indexes and use `.withIndex()`
3. **Actions cannot access `ctx.db`** - use `ctx.runQuery`/`ctx.runMutation`
4. **Keep `npx convex dev` running** - it generates types automatically
5. **Query index fields in definition order** - you can't skip fields
6. **Return `v.null()` not `undefined`** - undefined becomes null on clients

## References

For detailed patterns, see:
- [functions.md](references/functions.md) - Complete function patterns and context API
- [database.md](references/database.md) - Schema, indexes, reading/writing data
- [react.md](references/react.md) - React hooks and client setup
- [docs/CONVEX_LLMS.md](/docs/CONVEX_LLMS.md) - Full Convex LLM documentation (offline copy)
