# Pitfalls Research: WorkOS + Convex + Lemon Squeezy

## Critical Pitfalls (Data/Security Risk)

### 1. Data Leakage Between Tenants

**The problem:** Forgetting to scope queries by org/customer leaks data across tenants.

**Warning signs:**
- Queries without `orgId` filter
- Direct `ctx.db.get(id)` without ownership check
- Missing role checks in mutations

**Prevention:**
- Add scoping helper that always runs first
- Code review checklist: "Is this query scoped?"
- Test with multiple orgs to catch leaks

**Phase to address:** Phase 3 (Role-Based Scoping)

### 2. Client Accessing Other Customer Data

**The problem:** Client role can see data from other customers in same org.

**Warning signs:**
- Query filters by `orgId` but not `customerId`
- Staff assignment logic applied to clients

**Prevention:**
- Client queries MUST filter by `user.customerId`
- Different code paths for client vs staff scoping
- Integration tests with client user seeing only their data

**Phase to address:** Phase 3

### 3. Webhook Signature Bypass

**The problem:** Accepting webhooks without verifying signature allows spoofed events.

**Warning signs:**
- No signature verification code
- Webhook handler returns 200 regardless of signature

**Prevention:**
- Always verify Lemon Squeezy signature using `X-Signature` header
- Reject with 401 if signature invalid
- Log failed verification attempts

**Phase to address:** Phase 4 (Billing)

---

## High-Risk Pitfalls (Functional Bugs)

### 4. WorkOS Webhook Race Conditions

**The problem:** User signs up → creates org → webhook arrives late → data inconsistent.

**Warning signs:**
- Org creation fails because "user doesn't exist"
- User can't see org they just created

**Prevention:**
- Create org record optimistically in mutation
- Webhook updates existing record (upsert pattern)
- Use idempotency keys

**Phase to address:** Phase 2 (Org Creation)

### 5. Subscription Webhook Out-of-Order

**The problem:** `subscription_updated` arrives before `subscription_created`.

**Warning signs:**
- "Subscription not found" errors
- Missing subscription data

**Prevention:**
- Use upsert pattern for subscription records
- Handle all events idempotently
- Don't assume event order

**Phase to address:** Phase 4

### 6. Usage Cap Race Condition

**The problem:** Two staff create customers simultaneously, both pass cap check, both succeed.

**Warning signs:**
- Customer count exceeds `maxCustomers`
- Cap enforcement fails under load

**Prevention:**
- Check count AND insert in same transaction
- Convex mutations are transactional, use this
- Check cap again after insert (belt + suspenders)

**Phase to address:** Phase 4

---

## Medium-Risk Pitfalls (UX/Maintenance)

### 7. WorkOS/Convex User ID Mismatch

**The problem:** Using WorkOS user ID vs Convex `_id` inconsistently.

**Warning signs:**
- "User not found" errors
- Joins failing silently

**Prevention:**
- Decide: WorkOS ID as primary key? Or Convex ID with WorkOS ID as indexed field?
- Recommended: Convex ID primary, WorkOS ID indexed for lookups
- Document the convention

**Phase to address:** Phase 1 (Schema)

### 8. Org Deletion Cascade Failure

**The problem:** Deleting org leaves orphaned customers, assignments, etc.

**Warning signs:**
- Ghost data in queries
- Foreign key-like errors

**Prevention:**
- Soft delete (status field) preferred
- If hard delete: cascade in transaction
- Document deletion behavior

**Phase to address:** Phase 2

### 9. Role Mismatch Between WorkOS and Convex

**The problem:** WorkOS says "admin", Convex user record says "staff".

**Warning signs:**
- User can't do what their role should allow
- Inconsistent behavior after role change

**Prevention:**
- Single source of truth: WorkOS
- Read role from JWT, not Convex user record
- Sync role to Convex only for queries that can't access JWT

**Phase to address:** Phase 3

### 10. Lemon Squeezy Test vs Production Mode

**The problem:** Webhooks work in test, fail in production (or vice versa).

**Warning signs:**
- "Signature invalid" in production only
- Different signing secrets

**Prevention:**
- Separate env vars for test/prod signing secrets
- Test with simulated events before going live
- Verify webhook URL is production URL

**Phase to address:** Phase 4

---

## Low-Risk Pitfalls (Nice to Avoid)

### 11. N+1 Queries for Staff Assignments

**The problem:** Loading customers, then loading assignments for each = slow.

**Warning signs:**
- Dashboard loads slowly with many customers
- Many sequential Convex calls

**Prevention:**
- Batch load assignments in single query
- Use Convex's `.collect()` then filter in memory

**Phase to address:** Phase 3

### 12. Email Template Hardcoding

**The problem:** Invite emails have hardcoded text, can't customize per org.

**Warning signs:**
- Agencies ask for custom branding
- Can't A/B test email copy

**Prevention:**
- Use React Email components
- Store customizable fields (logo, colors) on org
- Defer full customization to v2

**Phase to address:** Phase 2 (Invites)

---

## Pitfall Checklist by Phase

### Phase 1 (Foundation)
- [ ] WorkOS/Convex ID convention documented
- [ ] Schema supports all scoping patterns

### Phase 2 (Org + Customer)
- [ ] Webhook race conditions handled (upsert)
- [ ] Org deletion cascade planned

### Phase 3 (Roles + Scoping)
- [ ] Every query scoped by org
- [ ] Client queries scoped by customer
- [ ] Role read from JWT, not Convex

### Phase 4 (Billing)
- [ ] Webhook signatures verified
- [ ] Subscription events idempotent
- [ ] Usage cap checks transactional
- [ ] Test vs prod mode separated
