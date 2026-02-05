# Phase 1: WorkOS Integration - Research

**Researched:** 2026-02-05
**Domain:** WorkOS Organizations API + Convex Actions
**Confidence:** HIGH

## Summary

This phase replaces the mock org ID with real WorkOS API integration. The current codebase generates fake `org_${timestamp}_${random}` IDs during onboarding. The real implementation requires:

1. **Convex action** that calls the WorkOS Organizations API to create an org
2. **Organization membership creation** to add the user as admin of the new org
3. **Settings page integration** to view and update org details via WorkOS API
4. **Sync pattern** storing WorkOS org ID in Convex for data association

The WorkOS Node.js SDK (`@workos-inc/node` v8.x) provides all necessary methods. The free tier supports unlimited organizations. User decisions require: org creation during signup with name + billing email (stored as metadata), fail-with-retry on API errors.

**Primary recommendation:** Create a Convex action that calls `workos.organizations.createOrganization()` and `workos.userManagement.createOrganizationMembership()`, then store the returned org ID in Convex. Use WorkOS metadata for billing email since it's not a native field.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @workos-inc/node | 8.x | WorkOS API access | Official SDK, required for org management |
| convex | 1.31+ | Backend platform | Already in project, actions support external APIs |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none additional needed) | - | - | WorkOS SDK handles all org operations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| WorkOS SDK | Direct fetch to REST API | SDK handles auth headers, types, retries |
| Convex action | TanStack Start server function | Action keeps logic in Convex, same auth context |

**Installation:**
```bash
npm install @workos-inc/node@8
```

**Environment Variables (set via Convex Dashboard):**
```bash
npx convex env set WORKOS_API_KEY sk_test_...  # Or sk_live_... for production
```

Note: `WORKOS_CLIENT_ID` is already configured for auth. The API key is needed for Organizations API calls.

## Architecture Patterns

### Recommended Project Structure
```
convex/
├── orgs/
│   ├── create.ts       # Updated: real WorkOS API call
│   ├── get.ts          # Unchanged: queries from Convex
│   └── update.ts       # New: update via WorkOS API
├── workos.ts           # New: WorkOS SDK instance + helpers
src/
├── routes/
│   └── onboarding.tsx  # Updated: add billing email field
│   └── _authenticated/
│       └── settings.tsx # Updated: real org data + save
```

### Pattern 1: Convex Action for External API
**What:** Use Convex `action` (not mutation) for WorkOS API calls
**When to use:** Any operation that calls external services
**Example:**
```typescript
// Source: https://docs.convex.dev/functions/actions
"use node";
import { action } from "./_generated/server";
import { WorkOS } from "@workos-inc/node";
import { v } from "convex/values";

const workos = new WorkOS(process.env.WORKOS_API_KEY!);

export const createOrganization = action({
  args: {
    name: v.string(),
    billingEmail: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Create org in WorkOS
    const org = await workos.organizations.createOrganization({
      name: args.name,
      metadata: {
        billingEmail: args.billingEmail,
      },
    });

    // 2. Store in Convex via mutation
    await ctx.runMutation(internal.orgs.create.storeOrg, {
      workosOrgId: org.id,
      name: org.name,
      billingEmail: args.billingEmail,
    });

    return { orgId: org.id };
  },
});
```

### Pattern 2: Add User to Organization (Membership)
**What:** After creating org, add the current user as admin member
**When to use:** Org creation during signup flow
**Example:**
```typescript
// Source: https://hexdocs.pm/workos/WorkOS.UserManagement.html (parameters match Node SDK)
// User ID comes from JWT identity
const identity = await ctx.auth.getUserIdentity();
const workosUserId = identity?.subject; // WorkOS user ID from JWT

await workos.userManagement.createOrganizationMembership({
  userId: workosUserId,
  organizationId: org.id,
  roleSlug: "admin", // Optional: defaults to "member"
});
```

### Pattern 3: Billing Email via Metadata
**What:** Store billing email in WorkOS org metadata (not a native field)
**When to use:** User decisions require billing email at signup
**Example:**
```typescript
// Source: https://workos.com/docs/authkit/metadata
// Setting during creation:
const org = await workos.organizations.createOrganization({
  name: "Acme Corp",
  metadata: {
    billingEmail: "billing@acme.com",
  },
});

// Updating later:
await workos.organizations.updateOrganization({
  organization: org.id,
  metadata: {
    billingEmail: "new-billing@acme.com",
  },
});
```

### Anti-Patterns to Avoid
- **Calling WorkOS from frontend:** API key exposure risk. Always use Convex action.
- **Mock IDs in production:** Current code uses `org_${Date.now()}_...`. Must replace.
- **Storing org data only in Convex:** WorkOS is source of truth for org identity. Keep synced.
- **Ignoring membership:** Creating org without adding user as member leaves user orphaned.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Org ID generation | Random string generator | WorkOS `createOrganization` | WorkOS IDs are globally unique, tie into SSO/SCIM |
| User-org association | Custom membership table | WorkOS `createOrganizationMembership` | WorkOS manages roles, memberships, integrates with SSO |
| Org metadata storage | Separate Convex fields | WorkOS `metadata` field | 10 key-value pairs, up to 600 chars each |
| API error retry | Custom retry logic | SDK built-in + exponential backoff | SDK handles most cases; add backoff for 429 |

**Key insight:** WorkOS is the authoritative source for organization identity and membership. Convex stores the `workosOrgId` as a foreign key plus any app-specific data (subscription, caps) that WorkOS doesn't manage.

## Common Pitfalls

### Pitfall 1: Forgetting to Create Membership
**What goes wrong:** Org created in WorkOS, user has no membership, JWT has no org_id
**Why it happens:** Developers assume org creation = user belongs to org
**How to avoid:** Always call `createOrganizationMembership` after `createOrganization`
**Warning signs:** User can create org but gets redirected back to onboarding

### Pitfall 2: API Key vs Client ID Confusion
**What goes wrong:** Using `WORKOS_CLIENT_ID` (public) instead of `WORKOS_API_KEY` (secret)
**Why it happens:** Both are required, different purposes
**How to avoid:**
- Client ID (`client_01...`): For auth redirect URLs, JWT validation
- API Key (`sk_test_...` or `sk_live_...`): For server-side API calls
**Warning signs:** 401 errors from WorkOS API

### Pitfall 3: Missing "use node" Directive
**What goes wrong:** Action fails with `WorkOS is not defined` or package errors
**Why it happens:** WorkOS SDK requires Node.js runtime, Convex default is V8
**How to avoid:** Add `"use node";` at top of file using @workos-inc/node
**Warning signs:** Import errors, undefined errors in action

### Pitfall 4: Race Condition - JWT Not Updated
**What goes wrong:** User creates org, redirects to dashboard, JWT still has no org_id
**Why it happens:** WorkOS membership creation doesn't instantly update existing JWT
**How to avoid:**
- Store org association in Convex users table (immediate)
- Use Convex data for routing decisions, not just JWT
- JWT will update on next login/refresh
**Warning signs:** Inconsistent redirect behavior after org creation

### Pitfall 5: Not Handling API Errors with Retry
**What goes wrong:** WorkOS API fails, user stuck with no recovery option
**Why it happens:** Network issues, rate limits, WorkOS downtime
**How to avoid:** Per user decision - show error with retry button
**Warning signs:** Users reporting "stuck" on org creation

### Pitfall 6: Metadata Limits
**What goes wrong:** Error when storing too much in org metadata
**Why it happens:** WorkOS limits: 10 keys max, 40 char keys, 600 char values
**How to avoid:** Store only essential data; billing email fits easily
**Warning signs:** API error mentioning metadata limits

## Code Examples

Verified patterns from official sources:

### Complete Org Creation Action
```typescript
// convex/workos/createOrg.ts
// Source: Composite from WorkOS SDK docs + Convex action docs
"use node";
import { action, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { WorkOS } from "@workos-inc/node";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const createOrganization = action({
  args: {
    name: v.string(),
    billingEmail: v.string(),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }
    const workosUserId = identity.subject;

    // Initialize WorkOS SDK
    const workos = new WorkOS(process.env.WORKOS_API_KEY!);

    // Create organization in WorkOS
    const org = await workos.organizations.createOrganization({
      name: args.name,
      metadata: {
        billingEmail: args.billingEmail,
      },
    });

    // Add user as admin member
    await workos.userManagement.createOrganizationMembership({
      userId: workosUserId,
      organizationId: org.id,
      roleSlug: "admin",
    });

    // Store in Convex
    const convexOrgId = await ctx.runMutation(internal.orgs.create.storeOrg, {
      workosOrgId: org.id,
      name: org.name,
      billingEmail: args.billingEmail,
      workosUserId: workosUserId,
    });

    return {
      orgId: convexOrgId,
      workosOrgId: org.id,
    };
  },
});

// Internal mutation to store org (called by action)
export const storeOrg = internalMutation({
  args: {
    workosOrgId: v.string(),
    name: v.string(),
    billingEmail: v.string(),
    workosUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Create org record
    const orgId = await ctx.db.insert("orgs", {
      workosOrgId: args.workosOrgId,
      name: args.name,
      billingEmail: args.billingEmail,
      subscriptionStatus: "inactive",
      planId: "free",
      maxCustomers: 3,
      maxStaff: 2,
      maxClients: 10,
      createdAt: now,
      updatedAt: now,
    });

    // Update user record with org association
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", args.workosUserId))
      .first();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        orgId,
        role: "admin",
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("users", {
        workosUserId: args.workosUserId,
        orgId,
        role: "admin",
        email: "", // Will be updated from identity
        createdAt: now,
        updatedAt: now,
      });
    }

    return orgId;
  },
});
```

### Get Organization (with WorkOS data)
```typescript
// convex/workos/getOrg.ts
// Source: WorkOS SDK docs
"use node";
import { action } from "../_generated/server";
import { WorkOS } from "@workos-inc/node";
import { v } from "convex/values";

export const getOrganization = action({
  args: {
    workosOrgId: v.string(),
  },
  handler: async (ctx, args) => {
    const workos = new WorkOS(process.env.WORKOS_API_KEY!);

    const org = await workos.organizations.getOrganization(args.workosOrgId);

    return {
      id: org.id,
      name: org.name,
      metadata: org.metadata,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    };
  },
});
```

### Update Organization
```typescript
// convex/workos/updateOrg.ts
// Source: https://workos.com/docs/reference/organization/update
"use node";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { WorkOS } from "@workos-inc/node";
import { v } from "convex/values";

export const updateOrganization = action({
  args: {
    workosOrgId: v.string(),
    name: v.optional(v.string()),
    billingEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const workos = new WorkOS(process.env.WORKOS_API_KEY!);

    const updateData: any = {
      organization: args.workosOrgId,
    };

    if (args.name) {
      updateData.name = args.name;
    }

    if (args.billingEmail) {
      updateData.metadata = {
        billingEmail: args.billingEmail,
      };
    }

    const org = await workos.organizations.updateOrganization(updateData);

    // Sync to Convex
    await ctx.runMutation(internal.orgs.update.syncOrg, {
      workosOrgId: args.workosOrgId,
      name: org.name,
      billingEmail: args.billingEmail,
    });

    return org;
  },
});
```

### Frontend Error Handling with Retry
```typescript
// src/routes/onboarding.tsx (partial)
// Source: User decision - fail with retry
const [error, setError] = useState<string | null>(null);
const [isRetrying, setIsRetrying] = useState(false);

const handleCreateOrg = async () => {
  setError(null);
  setIsLoading(true);

  try {
    await createOrganization({
      name: orgName,
      billingEmail: billingEmail,
    });
    // Success - redirect
    navigate({ to: '/dashboard' });
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Failed to create organization. Please try again.'
    );
  } finally {
    setIsLoading(false);
  }
};

// In JSX:
{error && (
  <Alert variant="destructive">
    <AlertDescription>{error}</AlertDescription>
    <Button
      variant="outline"
      onClick={handleCreateOrg}
      disabled={isLoading}
    >
      {isLoading ? 'Retrying...' : 'Retry'}
    </Button>
  </Alert>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Mock org IDs | WorkOS API | This phase | Real org identity, SSO-ready |
| Org in Convex only | WorkOS + Convex sync | This phase | Source of truth established |
| No membership | Explicit membership creation | This phase | Role-based access works |

**Deprecated/outdated:**
- `allowProfilesOutsideOrganization` field: Removed from WorkOS organizations in SDK v8
- `domains` field on org creation: Now uses `domainData` with state field

## Open Questions

Things that couldn't be fully resolved:

1. **Schema update for billingEmail**
   - What we know: Current schema has no `billingEmail` field on orgs table
   - What's unclear: Exact field name/type to add
   - Recommendation: Add `billingEmail: v.optional(v.string())` to orgs schema

2. **JWT refresh timing**
   - What we know: org_id appears in JWT after membership creation
   - What's unclear: Exactly when JWT refreshes automatically
   - Recommendation: Use Convex user.orgId for immediate routing, JWT for downstream auth

3. **Rate limit specifics**
   - What we know: WorkOS returns 429 on rate limit
   - What's unclear: Exact limits not documented publicly
   - Recommendation: Implement exponential backoff if 429 occurs; unlikely for org creation volume

## Sources

### Primary (HIGH confidence)
- [WorkOS API Reference - Organization Create](https://workos.com/docs/reference/organization/create) - Create org endpoint, Node.js SDK example
- [WorkOS API Reference - Organization Update](https://workos.com/docs/reference/organization/update) - Update parameters including metadata
- [WorkOS Metadata Docs](https://workos.com/docs/authkit/metadata) - Metadata limits (10 keys, 40/600 chars), update patterns
- [Convex Actions Documentation](https://docs.convex.dev/functions/actions) - External API calls, "use node" directive
- [Convex Environment Variables](https://docs.convex.dev/production/environment-variables) - process.env access in functions

### Secondary (MEDIUM confidence)
- [WorkOS Elixir SDK Docs](https://hexdocs.pm/workos/WorkOS.UserManagement.html) - createOrganizationMembership parameters (matches Node SDK)
- [WorkOS Node SDK GitHub](https://github.com/workos/workos-node) - Version 8.x requirements (Node 20+)
- [WorkOS Pricing](https://workos.com/pricing) - Free tier: unlimited orgs, 1M MAU

### Tertiary (LOW confidence)
- Rate limit behavior: General best practices, WorkOS-specific limits not documented

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official WorkOS SDK, well-documented Convex patterns
- Architecture: HIGH - Pattern verified against official Convex action docs
- Pitfalls: MEDIUM - Based on general WorkOS patterns + community issues

**Research date:** 2026-02-05
**Valid until:** 2026-03-05 (30 days - stable APIs)
