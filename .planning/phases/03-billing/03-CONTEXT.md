# Phase 3: Billing - Context

**Gathered:** 2026-02-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Working Lemon Squeezy subscriptions with checkout, webhook processing, plan cap enforcement, and a billing dashboard. Users can upgrade/downgrade plans, see usage against limits, view invoices, and cancel subscriptions. All billing state synced via webhooks.

</domain>

<decisions>
## Implementation Decisions

### Pricing & plans
- 3 tiers: Free, Pro, Business
- Claude's discretion on specific limit numbers (customers, staff, clients per tier) — current free tier is 3/2/10
- 14-day free trial of Pro for new users, then drop to Free if no subscription
- Monthly billing only (no annual option)

### Cap enforcement UX
- Hard block when hitting a limit — action is prevented entirely
- Upgrade prompt appears inline in the dialog/form where the action was attempted (e.g., "Create Customer" dialog shows limit message + upgrade button)
- Warning banner appears in the app at 80%+ usage of any limit
- Downgrade handling: Claude's discretion — simplest approach that protects user data

### Checkout & upgrade flow
- Lemon Squeezy checkout overlay (embedded in-app, not redirect) — per https://docs.lemonsqueezy.com/help/checkout/checkout-overlay
- Pre-fill user's email and org name in checkout
- After successful payment: redirect to billing page with confirmation of new plan
- Upgrade accessible from: billing page and cap enforcement inline prompts (2 entry points)

### Billing dashboard
- Shows: current plan name, usage progress bars, upgrade button, invoice list
- Usage displayed as colored progress bars with counts (e.g., "Customers: 2/25") — green → yellow → red as usage increases
- Invoice list: simple table with date, amount, paid/pending status, link to Lemon Squeezy receipt
- Cancel button on billing page with confirmation dialog explaining what happens (processes via Lemon Squeezy API)

### Claude's Discretion
- Specific limit numbers per plan tier
- Downgrade over-limit handling approach
- Progress bar color thresholds
- Confirmation dialog copy for cancellation
- Trial expiration notification approach

</decisions>

<specifics>
## Specific Ideas

- Checkout overlay reference: https://docs.lemonsqueezy.com/help/checkout/checkout-overlay
- Usage bars should visually communicate urgency: green when low, yellow approaching limit, red at/near limit
- Inline upgrade prompt in create dialogs — user shouldn't have to navigate away to understand they need to upgrade

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-billing*
*Context gathered: 2026-02-09*
