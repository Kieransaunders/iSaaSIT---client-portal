# Research Summary: iSaaSIT

## Key Findings

### Stack

**Confirmed choices work well together:**
- WorkOS AuthKit + Convex have official zero-config integration via `@convex-dev/workos-authkit`
- Lemon Squeezy webhooks documented for Convex HTTP actions
- TanStack Start + Netlify deployment supported

**Integration pattern:** WorkOS handles auth/orgs/roles → Convex stores business data + receives webhooks → Lemon Squeezy handles billing → Resend sends transactional email.

### Table Stakes for Agency SaaS

Must ship:
- Org creation post-signup
- Customer CRUD with org scoping
- Staff assignment to customers
- Client portal with limited access
- Billing with usage caps (maxCustomers, maxStaff, maxClients)
- Role-based data scoping (Admin sees all, Staff sees assigned, Client sees own)

### Architecture Approach

**Data model:**
- `orgs` — Synced from WorkOS, extended with billing data
- `customers` — Agency's client companies
- `staffCustomerAssignments` — Links staff to customers
- `users` — Synced from WorkOS, links clients to customers

**Scoping strategy:** Query-level checks using role from JWT. Admin filters by orgId, Staff filters by assigned customers, Client filters by their customerId.

**Build order:** Foundation → Org/Customer → Roles/Scoping → Billing

### Critical Pitfalls to Avoid

1. **Data leakage** — Every query must be scoped by org AND role
2. **Client seeing other customers** — Client queries must filter by customerId, not just orgId
3. **Webhook signature bypass** — Always verify Lemon Squeezy signatures
4. **Race conditions** — Use upsert patterns for webhook handlers
5. **Usage cap race** — Check and insert in same transaction

## Recommendations

### Do First
- Set up `@convex-dev/workos-authkit` component for user/org sync
- Define Convex schema with proper indexes
- Add shadcn/ui components

### Watch Out For
- WorkOS user ID vs Convex ID — pick a convention, document it
- Role source of truth — read from JWT, not Convex
- Webhook idempotency — handle duplicate/out-of-order events

### Defer to v2
- Custom roles (hardcode Admin/Staff/Client)
- Multiple orgs per user
- Audit logs
- File uploads
- AI features

## Phase Mapping

| Phase | Focus | Key Pitfalls |
|-------|-------|--------------|
| 1 | Foundation (shadcn, schema, WorkOS sync) | ID convention |
| 2 | Org creation + Customer CRUD | Webhook race conditions |
| 3 | Roles + data scoping | Data leakage, client scoping |
| 4 | Billing + caps | Signature verification, cap race |

## Sources

- [Convex AuthKit Docs](https://docs.convex.dev/auth/authkit/)
- [WorkOS AuthKit for Convex](https://workos.com/blog/convex-authkit)
- [Lemon Squeezy + Convex Guide](https://medium.com/@peteuadiale1/simplifying-saas-payments-integrate-lemon-squeezy-webhooks-with-convex-4783f360ed94)
- [Convex Row Level Security](https://stack.convex.dev/row-level-security)
- [Lemon Squeezy Webhook Docs](https://docs.lemonsqueezy.com/guides/developer-guide/webhooks)
