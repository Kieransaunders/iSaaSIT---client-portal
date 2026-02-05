# Security Guide

Security best practices for iSaaSIT development.

## Table of Contents

- [Authentication Security](#authentication-security)
- [Authorization Patterns](#authorization-patterns)
- [Data Isolation](#data-isolation)
- [Input Validation](#input-validation)
- [Environment Variables](#environment-variables)
- [Common Vulnerabilities](#common-vulnerabilities)

---

## Authentication Security

### JWT Validation

All authentication is handled via WorkOS AuthKit with JWT tokens.

**Critical**: Never trust client-side auth state in Convex functions.

```typescript
// ✅ Correct - Verify auth in Convex
export const getSensitiveData = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    // Get user from auth context (verified by Convex)
    const userId = ctx.auth?.userId
    if (!userId) {
      throw new Error("Unauthorized")
    }
    
    // Verify user has access to this org
    const membership = await ctx.db
      .query("orgMemberships")
      .withIndex("by_user_org", q => q.eq("userId", userId).eq("orgId", args.orgId))
      .unique()
    
    if (!membership) {
      throw new Error("Forbidden")
    }
    
    return await ctx.db.get(args.orgId)
  }
})
```

---

## Authorization Patterns

### Role-Based Access Control (RBAC)

```typescript
// convex/lib/auth.ts
type Role = "admin" | "staff" | "client"

export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: Role[]
) {
  const user = await getCurrentUser(ctx)
  if (!user) {
    throw new Error("Unauthorized")
  }
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden: insufficient permissions")
  }
  
  return user
}

// Usage in mutations
export const deleteCustomer = mutation({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    // Only admins can delete
    const user = await requireRole(ctx, ["admin"])
    
    // ... delete logic
  }
})
```

### Resource-Level Authorization

```typescript
export const updateCustomer = mutation({
  args: {
    customerId: v.id("customers"),
    data: v.object({ name: v.optional(v.string()) })
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const customer = await ctx.db.get(args.customerId)
    
    if (!customer) {
      throw new Error("Not found")
    }
    
    // Check access based on role
    switch (user.role) {
      case "admin":
        // Admins can update any customer in their org
        if (customer.orgId !== user.orgId) {
          throw new Error("Forbidden")
        }
        break
        
      case "staff":
        // Staff need assignment
        const hasAccess = await checkStaffAccess(ctx, user._id, args.customerId)
        if (!hasAccess) {
          throw new Error("Forbidden")
        }
        break
        
      case "client":
        // Clients can only update their own customer
        if (user.customerId !== args.customerId) {
          throw new Error("Forbidden")
        }
        break
    }
    
    return await ctx.db.patch(args.customerId, args.data)
  }
})
```

---

## Data Isolation

### Multi-Tenant Data Isolation

**Golden Rule**: Every query must filter by `orgId`.

```typescript
// ✅ Correct - Always scope to org
export const listCustomers = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    
    // Verify user belongs to this org
    if (user.orgId !== args.orgId) {
      throw new Error("Forbidden")
    }
    
    // Query scoped to org
    return await ctx.db
      .query("customers")
      .withIndex("by_org", q => q.eq("orgId", args.orgId))
      .collect()
  }
})

// ❌ DANGEROUS - Returns all data
export const listAllCustomers = query({
  handler: async (ctx) => {
    return await ctx.db.query("customers").collect()  // ❌ No org filter!
  }
})
```

### Staff Data Isolation

```typescript
export const getAccessibleCustomers = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx)
    
    if (user.role === "admin") {
      // Admin sees all in org
      return await ctx.db
        .query("customers")
        .withIndex("by_org", q => q.eq("orgId", user.orgId))
        .collect()
    }
    
    if (user.role === "staff") {
      // Staff sees only assigned
      const assignments = await ctx.db
        .query("staffCustomerAssignments")
        .withIndex("by_user", q => q.eq("userId", user._id))
        .collect()
      
      const customers = []
      for (const assignment of assignments) {
        const customer = await ctx.db.get(assignment.customerId)
        if (customer) customers.push(customer)
      }
      return customers
    }
    
    if (user.role === "client") {
      // Client sees only their customer
      if (!user.customerId) return []
      const customer = await ctx.db.get(user.customerId)
      return customer ? [customer] : []
    }
    
    return []
  }
})
```

---

## Input Validation

### Always Validate Arguments

```typescript
import { v } from "convex/values"

export const createCustomer = mutation({
  args: {
    // ✅ Strong validation
    name: v.string(),
    email: v.optional(v.string()),
    orgId: v.id("orgs"),
    
    // ✅ Enum validation
    status: v.union(
      v.literal("active"),
      v.literal("inactive")
    )
  },
  handler: async (ctx, args) => {
    // Additional validation
    if (args.name.length < 2) {
      throw new Error("Name must be at least 2 characters")
    }
    
    if (args.email && !isValidEmail(args.email)) {
      throw new Error("Invalid email format")
    }
    
    // ... create logic
  }
})
```

### Sanitize User Input

```typescript
function sanitizeInput(input: string): string {
  // Remove potential XSS
  return input
    .replace(/[<>]/g, "")  // Remove < and >
    .trim()
}

export const createPost = mutation({
  args: {
    title: v.string(),
    content: v.string()
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("posts", {
      title: sanitizeInput(args.title),
      content: sanitizeInput(args.content)  // Sanitize before storing
    })
  }
})
```

---

## Environment Variables

### Sensitive Configuration

```bash
# .env.local - NEVER commit this file

# WorkOS AuthKit
WORKOS_CLIENT_ID=client_xxx          # Public, safe to expose
WORKOS_API_KEY=sk_test_xxx           # SECRET - server only
WORKOS_COOKIE_PASSWORD=xxx           # SECRET - min 32 chars

# Convex
VITE_CONVEX_URL=https://xxx          # Public, starts with VITE_

# Lemon Squeezy (when implementing)
LEMON_SQUEEZY_API_KEY=xxx            # SECRET
LEMON_SQUEEZY_WEBHOOK_SECRET=xxx     # SECRET - verify webhooks
```

### Secrets in Convex

```bash
# Set secrets in Convex (encrypted at rest)
npx convex env set WORKOS_API_KEY sk_test_xxx
npx convex env set LEMON_SQUEEZY_API_KEY xxx

# List env vars
npx convex env list

# Remove secret
npx convex env remove WORKOS_API_KEY
```

### Frontend vs Backend Secrets

```typescript
// ✅ Frontend-safe (exposed to browser)
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL

// ❌ Never use in frontend
const API_KEY = process.env.WORKOS_API_KEY  // Won't work, shouldn't do this

// ✅ Use in Convex functions only (server-side)
const apiKey = process.env.WORKOS_API_KEY  // In convex/*.ts files
```

---

## Common Vulnerabilities

### SQL Injection (Prevented by Convex)

Convex uses parameterized queries internally - SQL injection is not possible.

```typescript
// ✅ Safe - Convex handles parameterization
const user = await ctx.db
  .query("users")
  .withIndex("by_email", q => q.eq("email", userInput))
  .unique()
```

### NoSQL Injection

Still possible if not validating inputs:

```typescript
// ❌ Vulnerable - user could pass {$gt: ""}
export const findUser = query({
  args: { filter: v.any() },  // ❌ Too permissive
  handler: async (ctx, args) => {
    return await ctx.db.query("users").filter(args.filter).collect()
  }
})

// ✅ Safe - strict validators
export const findUser = query({
  args: { email: v.string() },  // ✅ Specific type
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", q => q.eq("email", args.email))
      .unique()
  }
})
```

### IDOR (Insecure Direct Object Reference)

```typescript
// ❌ Vulnerable - no ownership check
export const getCustomer = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.customerId)  // ❌ Any ID works!
  }
})

// ✅ Safe - check ownership
export const getCustomer = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const customer = await ctx.db.get(args.customerId)
    
    if (!customer || customer.orgId !== user.orgId) {
      throw new Error("Not found")  // Same message for not found / no access
    }
    
    return customer
  }
})
```

### Information Leakage

```typescript
// ❌ Leaks existence
export const getCustomer = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const customer = await ctx.db.get(args.customerId)
    
    if (!customer) {
      throw new Error("Customer not found")  // ❌ Reveals it doesn't exist
    }
    
    if (customer.orgId !== user.orgId) {
      throw new Error("Access denied")  // ❌ Reveals it exists but user can't access
    }
    
    return customer
  }
})

// ✅ Safe - same error for both cases
export const getCustomer = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const customer = await ctx.db.get(args.customerId)
    
    if (!customer || customer.orgId !== user.orgId) {
      throw new Error("Not found")  // ✅ Same message
    }
    
    return customer
  }
})
```

---

## Rate Limiting

### Convex Built-in Limits

Convex has automatic rate limiting:
- Queries: ~1000/second per client
- Mutations: ~100/second per client

### Custom Rate Limiting

```typescript
// convex/lib/rateLimit.ts
export async function checkRateLimit(
  ctx: MutationCtx,
  key: string,
  maxRequests: number,
  windowMs: number
) {
  const now = Date.now()
  const windowStart = now - windowMs
  
  const requests = await ctx.db
    .query("rateLimitLogs")
    .withIndex("by_key_time", q => 
      q.eq("key", key).gte("timestamp", windowStart)
    )
    .collect()
  
  if (requests.length >= maxRequests) {
    throw new Error("Rate limit exceeded. Please try again later.")
  }
  
  await ctx.db.insert("rateLimitLogs", {
    key,
    timestamp: now
  })
}

// Usage
export const sendInvite = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    
    // Limit to 10 invites per hour per user
    await checkRateLimit(
      ctx,
      `invite:${user._id}`,
      10,
      60 * 60 * 1000  // 1 hour
    )
    
    // ... send invite logic
  }
})
```

---

## Webhook Security

### Verify Webhook Signatures

```typescript
// convex/http.ts
import crypto from "crypto"

http.route({
  path: "/webhooks/lemon-squeezy",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const payload = await req.text()
    const signature = req.headers.get("x-signature")
    
    // Verify signature
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex")
    
    if (signature !== expectedSignature) {
      return new Response("Invalid signature", { status: 401 })
    }
    
    // Process webhook...
  })
})
```

---

## Security Checklist

Before deploying:

- [ ] All Convex functions validate authentication
- [ ] All queries filter by `orgId`
- [ ] Role-based access is enforced
- [ ] Input validation on all mutations
- [ ] No secrets in frontend code
- [ ] Webhook signatures verified
- [ ] Error messages don't leak information
- [ ] Rate limiting on sensitive operations
- [ ] `.env.local` is in `.gitignore`
- [ ] Production secrets rotated
