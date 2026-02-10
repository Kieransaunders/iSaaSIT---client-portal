---
status: testing
phase: 03-billing
source:
  - 03-01-SUMMARY.md
  - 03-02-SUMMARY.md
  - 03-03-SUMMARY.md
  - 03-04-SUMMARY.md
started: 2026-02-09T18:15:00Z
updated: 2026-02-09T18:15:00Z
---

## Current Test

number: 1
name: Upgrade Button Opens Lemon Squeezy Checkout
expected: |
  Click "Upgrade" button on billing page → Lemon Squeezy checkout overlay opens with pre-filled email and org name. Checkout shows plan options (Pro $29, Business $99).
awaiting: user response

## Tests

### 1. Upgrade Button Opens Lemon Squeezy Checkout
expected: Click "Upgrade" button on billing page → Lemon Squeezy checkout overlay opens with pre-filled email and org name. Checkout shows plan options (Pro $29, Business $99).
result: [pending]

### 2. Billing Page Shows Usage Statistics
expected: Billing page displays real customer/staff/client counts from database with progress bars. Shows "X of Y" format with percentage indicator.
result: [pending]

### 3. Usage Progress Bars Color-Coded by Threshold
expected: Progress bars are green below 80%, amber at 80-89%, red at 90%+. Visual feedback matches usage levels.
result: [pending]

### 4. Trial Banner Shows Days Remaining
expected: If org has active trial, amber banner at top shows "Your 14-day Pro trial ends in X days" with countdown. Banner has urgency styling when ≤3 days remain.
result: [pending]

### 5. Cancel Subscription Shows Confirmation Dialog
expected: Click "Cancel Subscription" → AlertDialog opens asking for confirmation. Shows warning about reverting to free tier. Confirm button triggers cancellation.
result: [pending]

### 6. Customer Portal Link for Invoices
expected: "View Invoices & Receipts" button opens Lemon Squeezy customer portal in new tab. Only visible if subscription exists.
result: [pending]

### 7. Customer Creation Blocked at Limit
expected: When at customer limit (10/10), open "Add Customer" dialog → CapReachedBanner shows "Customer limit reached (10/10). Upgrade your plan." Submit button is disabled.
result: [pending]

### 8. Warning Banner at 80% Usage
expected: When any resource at 80%+ usage (e.g., 8/10 customers), amber warning banner appears at top of all authenticated pages: "You're approaching your plan limits. Customers: 8/10. Upgrade to increase your limits."
result: [pending]

### 9. Warning Banner Dismissible
expected: Click X button on warning banner → banner disappears. Refresh page → banner reappears (only stored in component state).
result: [pending]

### 10. Upgrade Prompt Links to Billing Page
expected: Click "Upgrade Plan" button in CapReachedBanner or UsageWarningBanner → navigates to /billing page.
result: [pending]

### 11. Team Invitation Fixed (From Earlier Fix)
expected: Accept team invitation email → redirected to /?code=XXX → automatically redirects to /callback → completes authentication → lands on dashboard/onboarding.
result: [pending]

## Summary

total: 11
passed: 0
issues: 0
pending: 11
skipped: 0

## Gaps

[none yet]
