# Stack Research: iSaaSIT

## Recommended Stack

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| Frontend | React | 19.x | Already in place, latest stable |
| Framework | TanStack Start | 1.x | SSR support, already integrated |
| Styling | Tailwind CSS | 4.x | Already in place |
| UI Components | shadcn/ui | latest | Accessible, customizable, Tailwind-native |
| Backend | Convex | 1.31+ | Already integrated, real-time by default |
| Auth | WorkOS AuthKit | via `@convex-dev/workos-authkit` | Zero-config with Convex, orgs built-in |
| Billing | Lemon Squeezy | API v1 | MoR for global sales, simpler than Stripe for indie |
| Email | Resend | latest | React Email support, good DX |
| Deploy | Netlify | - | TanStack Start adapter available |

## Integration Patterns

### WorkOS + Convex

**Official component:** `@convex-dev/workos-authkit`

The component syncs user data from WorkOS to Convex via webhooks registered in `convex/http.ts`. User create/update/delete events are automatically synced.

**Organizations:** WorkOS manages org membership natively. The component can sync org data to Convex for querying. Define org-related tables in Convex schema and let webhooks populate them.

**Roles:** Define roles in WorkOS dashboard (Admin, Staff, Client). Access role from JWT claims in Convex functions.

```typescript
// Access user context in Convex
const identity = await ctx.auth.getUserIdentity();
const orgId = identity?.org_id;
const role = identity?.org_role; // From WorkOS
```

### Lemon Squeezy + Convex

**Webhook handling:** Use Convex HTTP actions to receive webhooks.

Key pattern from [Peter Uadiale's guide](https://medium.com/@peteuadiale1/simplifying-saas-payments-integrate-lemon-squeezy-webhooks-with-convex-4783f360ed94):

1. Create HTTP action in `convex/http.ts` for `/webhooks/lemonsqueezy`
2. Verify webhook signature using signing secret
3. Call internal mutation to update subscription data
4. Return 200 to acknowledge (Lemon Squeezy retries on non-200)

**Events to handle:**
- `subscription_created` — New subscription, store plan + caps
- `subscription_updated` — Plan change, update caps
- `subscription_cancelled` — Mark inactive
- `subscription_payment_success` — Log payment
- `subscription_payment_failed` — Alert admin

**Testing:** Use Lemon Squeezy's "Simulate event" feature in test mode.

### Data Scoping with Convex RLS

From [Convex Stack RLS guide](https://stack.convex.dev/row-level-security):

Use custom function wrappers to enforce row-level security:

```typescript
// Define rules per table
const rules = {
  customers: {
    read: async (ctx, doc) => {
      const user = await getCurrentUser(ctx);
      if (user.role === "admin") return doc.orgId === user.orgId;
      if (user.role === "staff") return isAssignedTo(ctx, user.id, doc._id);
      if (user.role === "client") return doc._id === user.customerId;
      return false;
    }
  }
};
```

**Key insight:** Authorization checks defined in one place, applied automatically. Convex caches query results, making repeated auth checks efficient.

## What NOT to Use

| Don't Use | Why | Use Instead |
|-----------|-----|-------------|
| Better Auth | Different auth paradigm, WorkOS already integrated | WorkOS AuthKit |
| Stripe | More complex setup, not MoR | Lemon Squeezy |
| NextAuth/Auth.js | Doesn't integrate with WorkOS orgs | WorkOS AuthKit |
| Custom role storage | Duplicates WorkOS, sync headaches | WorkOS roles |
| Prisma/Drizzle | Different paradigm, lose Convex reactivity | Convex native |

## Confidence Levels

| Component | Confidence | Notes |
|-----------|------------|-------|
| WorkOS + Convex | High | Official integration, well-documented |
| Lemon Squeezy + Convex | Medium | Documented pattern exists, less common |
| TanStack Start + Netlify | Medium | Adapter exists, verify edge cases |
| shadcn/ui + Tailwind 4 | High | Standard pairing |

## Sources

- [Convex AuthKit Docs](https://docs.convex.dev/auth/authkit/)
- [WorkOS AuthKit for Convex](https://workos.com/blog/convex-authkit)
- [@convex-dev/workos-authkit](https://www.npmjs.com/package/@convex-dev/workos-authkit)
- [Lemon Squeezy + Convex Guide](https://medium.com/@peteuadiale1/simplifying-saas-payments-integrate-lemon-squeezy-webhooks-with-convex-4783f360ed94)
- [Lemon Squeezy Webhook Docs](https://docs.lemonsqueezy.com/guides/developer-guide/webhooks)
- [Convex Row Level Security](https://stack.convex.dev/row-level-security)
