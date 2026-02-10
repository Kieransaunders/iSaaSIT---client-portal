# Troubleshooting Guide

Common errors and solutions for iSaaSIT development.

## Table of Contents

- [Convex Errors](#convex-errors)
- [Authentication Errors](#authentication-errors)
- [TypeScript Errors](#typescript-errors)
- [Build Errors](#build-errors)
- [Runtime Errors](#runtime-errors)
- [Development Workflow](#development-workflow)

---

## Convex Errors

### "Cannot find module 'convex/_generated/api'"

**Cause**: Convex types haven't been generated yet.

**Solution**:
```bash
npx convex dev
```

This generates the `_generated` folder with types for your schema and functions.

---

### "Error: Unable to parse your Convex functions"

**Cause**: Syntax error in a Convex function file.

**Solution**:
1. Check the error message for the file path
2. Look for:
   - Missing commas in object literals
   - Missing closing braces
   - TypeScript syntax errors
3. Run `npx convex dev` again after fixing

**Common culprits**:
```typescript
// ❌ Missing comma
export const myQuery = query({
  args: { name: v.string() }  // Missing comma
  handler: async (ctx, args) => { ... }
})

// ✅ Correct
export const myQuery = query({
  args: { name: v.string() },
  handler: async (ctx, args) => { ... },
})
```

---

### "Error: A validator is required for all function arguments"

**Cause**: Missing or invalid argument validators.

**Solution**:
```typescript
// ❌ Missing validator
export const myQuery = query({
  args: { name: "string" },  // Wrong
  handler: async (ctx, args) => { ... }
})

// ✅ Correct
export const myQuery = query({
  args: { name: v.string() },  // Use v from convex/values
  handler: async (ctx, args) => { ... }
})
```

---

### "Error: Return validator required"

**Cause**: Function doesn't specify what it returns.

**Solution**:
```typescript
// ✅ With return type
export const myQuery = query({
  args: { id: v.id("users") },
  returns: v.union(
    v.object({ ... }),
    v.null()
  ),
  handler: async (ctx, args) => { ... }
})

// ✅ Or if returning nothing
export const myMutation = mutation({
  args: { id: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
    return null
  }
})
```

---

### "Error: Index not found"

**Cause**: Query references an index that doesn't exist in schema.

**Solution**:
```typescript
// Check your schema.ts
export default defineSchema({
  users: defineTable({
    orgId: v.id("orgs"),
    email: v.string(),
  })
    .index("by_org", ["orgId"])  // Must match the name used in query
})

// In your query
export const listUsers = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("by_org", q => q.eq("orgId", orgId))  // Name must match
      .collect()
  }
})
```

---

### "Error: Unauthorized" in Convex function

**Cause**: JWT validation failed or auth context is missing.

**Solution**:
1. Check `auth.config.ts` is correctly configured
2. Verify WorkOS Client ID is set in Convex:
   ```bash
   npx convex env set WORKOS_CLIENT_ID your_client_id
   ```
3. Check user is actually logged in on frontend
4. Verify JWT hasn't expired (re-login if needed)

---

### Slow Queries / Timeouts

**Cause**: Query isn't using an index, causing table scan.

**Solution**:
```typescript
// ❌ Slow - no index
export const slowQuery = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("orgId"), orgId))  // filter is slow
      .collect()
  }
})

// ✅ Fast - uses index
export const fastQuery = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("by_org", q => q.eq("orgId", orgId))  // uses index
      .collect()
  }
})
```

---

## Authentication Errors

### Invited users are asked to create an organization

**Cause**: WorkOS invitation webhook isn’t reaching Convex, so the user never gets `orgId` assigned in Convex.

**Solution**:
1. In the WorkOS Dashboard, add a webhook endpoint that points to your Convex HTTP action:
   - **Dev**: `https://<your-deployment>.convex.site/webhooks/workos`
   - **Prod**: `https://<your-prod-deployment>.convex.site/webhooks/workos`
2. Enable the `invitation.accepted` event for that webhook.
3. Set the webhook secret in Convex (not just `.env.local`):
   ```bash
   npx convex env set WORKOS_WEBHOOK_SECRET <secret>
   ```
4. Retry the invite flow after the webhook is configured.

**Notes**:
- The handler lives in `convex/webhooks/workos.ts` and is mounted in `convex/http.ts`.
- Without the webhook, invited users will look like “no org” and be redirected to onboarding.

### "No authenticated user" despite being logged in

**Cause**: Convex auth context not properly set up.

**Solution**:
1. Check `convex/auth.config.ts`:
   ```typescript
   export default {
     providers: [
       {
         domain: process.env.WORKOS_DOMAIN,
         applicationID: process.env.WORKOS_CLIENT_ID,
       },
     ],
   }
   ```

2. Verify environment variable is set:
   ```bash
   npx convex env list
   ```

---

### "redirect is not defined"

**Cause**: Missing import in route file.

**Solution**:
```typescript
// ✅ Correct import
import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const { user } = await getAuth()
    if (!user) throw redirect({ to: "/" })
  }
})
```

---

### WorkOS callback fails

**Cause**: Redirect URI mismatch.

**Solution**:
1. Check `WORKOS_REDIRECT_URI` in `.env.local` matches exactly what's in WorkOS dashboard
2. Common issues:
   - `http` vs `https`
   - `localhost:3000` vs `localhost:5173`
   - Trailing slashes

---

## TypeScript Errors

### "Cannot find module '@/...' or its corresponding type declarations"

**Cause**: Path alias not recognized.

**Solution**:
1. Check `tsconfig.json` has paths configured:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

2. Restart TypeScript server in your editor

---

### "Property 'X' does not exist on type 'Y'"

**Cause**: Convex types not regenerated after schema change.

**Solution**:
```bash
npx convex dev
```

Or restart your editor to pick up new types.

---

### "Type 'string' is not assignable to type 'Id<"users">'"

**Cause**: Using plain string instead of typed ID.

**Solution**:
```typescript
import { Id } from "./_generated/dataModel"

// ✅ Correct
function getUser(userId: Id<"users">) { ... }

// ❌ Wrong
function getUser(userId: string) { ... }
```

---

## Build Errors

### "routeTree.gen.ts not found"

**Cause**: TanStack Router hasn't generated routes.

**Solution**:
```bash
# Restart dev server - it auto-generates
npm run dev

# Or manually generate
npx tanstack-router generate
```

---

### "Build failed: Cannot resolve 'convex/_generated/api'"

**Cause**: Building without Convex types generated.

**Solution**:
```bash
# Generate Convex types first
npx convex dev

# Then build
npm run build
```

---

## Runtime Errors

### "React Hook useQuery is called conditionally"

**Cause**: Hook called inside if statement or after early return.

**Solution**:
```typescript
// ❌ Wrong
function Component() {
  const { user } = useAuth()
  if (!user) return <div>Not logged in</div>
  
  const { data } = useQuery(...)  // ❌ Hook after return
}

// ✅ Correct
function Component() {
  const { user } = useAuth()
  const { data } = useQuery(...)  // ✅ Hook at top level
  
  if (!user) return <div>Not logged in</div>
}
```

---

### "Cannot read properties of undefined (reading 'X')"

**Cause**: Accessing property on potentially undefined value.

**Solution**:
```typescript
// ❌ Unsafe
return <div>{customer.name}</div>

// ✅ Safe with optional chaining
return <div>{customer?.name}</div>

// ✅ Or with loading state
const { data: customer, isLoading } = useQuery(...)
if (isLoading) return <Loading />
if (!customer) return <NotFound />
return <div>{customer.name}</div>
```

---

### Infinite re-render loop

**Cause**: Object/array created inline in dependency array.

**Solution**:
```typescript
// ❌ Creates new object every render
useEffect(() => {
  doSomething({ orgId })
}, [{ orgId }])  // ❌ New object every time

// ✅ Stable reference
const deps = useMemo(() => ({ orgId }), [orgId])
useEffect(() => {
  doSomething(deps)
}, [deps])

// ✅ Or just use primitive
useEffect(() => {
  doSomething({ orgId })
}, [orgId])  // ✅ Primitive is stable
```

---

## Development Workflow

### Changes not reflecting

| Issue | Solution |
|-------|----------|
| Convex changes | Restart `npm run dev:backend` |
| Route changes | Restart dev server (route tree regenerates) |
| Type changes | Run `npx convex dev` or restart TS server |
| CSS changes | Should be HMR, but hard refresh if not |

---

### Port already in use

```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

---

### "Cannot GET /callback" or 404 on refresh

**Cause**: TanStack Start SSR not handling client-side routes.

**Solution**:
1. Check `start.ts` configuration
2. Ensure `ssr: true` is set correctly
3. For Netlify, add `_redirects` file:
   ```
   /* /index.html 200
   ```

---

## Debugging Tips

### Enable Convex Debug Logs

```bash
VITE_CONVEX_DEBUG=1 npm run dev
```

### Check Network Requests

In browser DevTools:
1. Open Network tab
2. Filter by "convex"
3. Look for WebSocket connections and request/response

### Inspect Convex Dashboard

```bash
npx convex dashboard
```

Useful for:
- Viewing database tables
- Running queries manually
- Checking function logs
- Monitoring performance

### React Query DevTools

Included automatically when using `ConvexProviderWithAuth`. Look for the floating icon in bottom-right corner.

---

## Getting Help

1. Check this troubleshooting guide
2. Review `.cursor/rules/08-development-workflow.mdc`
3. Check Convex logs: `npx convex dashboard`
4. Search [Convex Discord](https://convex.dev/community)
5. Search [TanStack Discord](https://tanstack.com/discord)
