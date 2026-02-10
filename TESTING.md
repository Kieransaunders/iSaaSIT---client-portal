# Testing Guide

Testing patterns and strategies for iSaaSIT.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Manual Testing](#manual-testing)
- [Convex Function Testing](#convex-function-testing)
- [E2E Testing](#e2e-testing)
- [Testing Checklists](#testing-checklists)

---

## Testing Philosophy

iSaaSIT includes a **minimal Playwright smoke suite** for critical flows, and still prioritizes:

1. **Manual testing** during development
2. **TypeScript** for compile-time safety
3. **Clear patterns** that are easy to test later

As your project matures, consider adding:
- Unit tests for utilities
- Integration tests for Convex functions
- Expanded E2E coverage for critical user flows

---

## Manual Testing

### Development Testing Workflow

Test continuously while developing:

```bash
# Start dev server
npm run dev

# Open browser
open http://localhost:3000
```

### Browser DevTools Testing

**Network Tab**:
- Monitor Convex WebSocket connections
- Check auth token refresh
- Verify API responses

**React Query DevTools**:
- Included automatically with Convex
- Check cache behavior
- Inspect query keys

**Application Tab**:
- Inspect cookies (WorkOS session)
- Check localStorage

---

## Convex Function Testing

### Test via Dashboard

```bash
# Open Convex dashboard
npx convex dashboard
```

Navigate to:
- Functions tab → Select function
- Run with test arguments
- View results and logs

### Test via CLI

```bash
# Run query
npx convex run api.customers:get --json '{"customerId": "kx..."}'

# Run mutation
npx convex run api.customers:create --json '{"orgId": "kx...", "name": "Test"}'

# Test internal function
npx convex run api.internal.billing:syncSubscription
```

### Test Files (Example)

When you add tests, structure them like this:

```typescript
// convex/__tests__/customers.test.ts (hypothetical)
import { test, expect } from "@convex-test/core"
import { api } from "../_generated/api"

test("create customer", async (ctx) => {
  const orgId = await ctx.runMutation(api.testHelpers.createOrg, {
    name: "Test Org"
  })
  
  const customerId = await ctx.runMutation(api.customers.create, {
    orgId,
    name: "Test Customer"
  })
  
  const customer = await ctx.runQuery(api.customers.get, { customerId })
  expect(customer?.name).toBe("Test Customer")
})
```

---

## E2E Testing

### Playwright Smoke Suite (Included)

The repo ships with a small E2E suite in `e2e/smoke.spec.ts` that covers:
- Sign-in link validity
- Org creation (if needed)
- Customer CRUD

**Setup**

```bash
# Install deps (adds @playwright/test to devDependencies)
npm install

# Install browsers
npx playwright install

# Start app + Convex
npm run dev
```

**Create an authenticated storage state**

```bash
# Opens a browser so you can sign in once; saves storage state
npx playwright codegen --save-storage=playwright/.auth/user.json http://localhost:3000
```

If the storage state file is missing, authenticated smoke tests will be skipped.
For the RBAC smoke test, create a staff user and save storage to `playwright/.auth/staff.json`.

**Run the smoke suite**

```bash
npm run test:e2e
```

**Environment overrides**
- `PLAYWRIGHT_BASE_URL` to point at a non-default app URL
- `PLAYWRIGHT_STORAGE_STATE` to use a different auth state file
- `PLAYWRIGHT_STORAGE_STATE_STAFF` to run the staff RBAC smoke test with a non-admin user

Example test:

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test('user can sign in', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Sign In')
  
  // WorkOS redirects to their hosted auth
  await expect(page).toHaveURL(/workos.com/)
  
  // ... test auth flow
})

test('protected route redirects when not authenticated', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL('/')
})

test('admin can create customer', async ({ page }) => {
  // Sign in as admin
  await signInAsRole(page, 'admin')
  
  // Navigate to customers
  await page.goto('/customers')
  await page.click('text=New Customer')
  
  // Fill form
  await page.fill('[name="name"]', 'Test Customer')
  await page.click('text=Create')
  
  // Verify
  await expect(page.locator('text=Test Customer')).toBeVisible()
})
```

---

## Testing Checklists

### Authentication Testing

| Test | Steps | Expected |
|------|-------|----------|
| Sign in | Click sign in, complete WorkOS flow | Redirected to dashboard |
| Sign out | Click sign out | Redirected to home, session cleared |
| Protected route | Visit /dashboard while logged out | Redirected to sign in |
| Token refresh | Wait 15 min, perform action | Seamless refresh, no error |
| Role access | Staff tries to access admin page | 403 or redirect |

### Multi-Tenancy Testing

| Test | Steps | Expected |
|------|-------|----------|
| Data isolation | Create customer in Org A, check Org B | Org B can't see Org A's data |
| Staff access | Assign staff to Customer 1, check Customer 2 | Staff sees only Customer 1 |
| Client access | Client user logs in | Sees only their customer data |
| Cross-org query | Manually call API with different orgId | 403 Forbidden |

### CRUD Testing

| Test | Steps | Expected |
|------|-------|----------|
| Create | Fill form, submit | Item created, appears in list |
| Read | View list, click item | Item details displayed |
| Update | Edit item, save | Changes persisted, UI updates |
| Delete | Delete item, confirm | Item removed, list updates |
| Validation | Submit form with invalid data | Error messages shown |

### Billing Testing (if enabled)

| Test | Steps | Expected |
|------|-------|----------|
| Checkout | Click upgrade, complete payment | Subscription active |
| Usage cap | Try to exceed plan limits | Error message, upgrade prompt |
| Webhook | Trigger test webhook from LS | Subscription updates in app |
| Cancel | Cancel subscription | Reverts to free plan |

---

## Test Data Management

### Seed Data Script

```typescript
// convex/seed.ts
import { internalMutation } from "./_generated/server"
import { v } from "convex/values"

export const seedTestData = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Only run in development
    if (process.env.NODE_ENV === "production") {
      throw new Error("Cannot seed in production")
    }
    
    // Create test org
    const orgId = await ctx.db.insert("orgs", {
      workOsOrgId: "test-org",
      name: "Test Organization",
      maxCustomers: 10,
      maxStaff: 5,
      maxClients: 50,
    })
    
    // Create test customers
    for (let i = 0; i < 5; i++) {
      await ctx.db.insert("customers", {
        orgId,
        name: `Test Customer ${i + 1}`,
        status: "active",
      })
    }
    
    return { orgId, customersCreated: 5 }
  }
})
```

Run seed:
```bash
npx convex run seed:seedTestData
```

### Test Helpers

```typescript
// convex/testHelpers.ts
import { mutation } from "./_generated/server"
import { v } from "convex/values"

// Only available in development
export const createTestOrg = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Test helpers disabled in production")
    }
    
    return await ctx.db.insert("orgs", {
      workOsOrgId: `test-${Date.now()}`,
      name: args.name,
      maxCustomers: 100,
      maxStaff: 50,
      maxClients: 500,
    })
  }
})
```

---

## Performance Testing

### Convex Performance

```bash
# Monitor function performance
npx convex dashboard

# Look for:
# - Slow queries (>100ms)
# - Missing indexes
# - High read/write counts
```

### Frontend Performance

```bash
# Lighthouse
npm install -g lighthouse
lighthouse http://localhost:3000

# Or use Chrome DevTools → Lighthouse tab
```

Key metrics:
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Cumulative Layout Shift: < 0.1

---

## Debugging Failed Tests

### Convex Function Fails

1. Check Convex logs:
   ```bash
   npx convex logs
   ```

2. Test in dashboard with same args

3. Add logging:
   ```typescript
   console.log("Input:", args)
   console.log("User:", ctx.auth?.userId)
   ```

### Frontend Test Fails

1. Run with headed browser:
   ```bash
   npx playwright test --headed
   ```

2. Slow down for visibility:
   ```typescript
   test.use({ launchOptions: { slowMo: 500 } })
   ```

3. Take screenshots:
   ```typescript
   await page.screenshot({ path: 'debug.png' })
   ```

---

## CI/CD Testing

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          
      - run: npm ci
      
      - run: npm run lint
      
      - run: npm run build
      
      # Add tests here when ready
      # - run: npm test
```

---

## When to Add Tests

Consider adding automated tests when:

1. **Project stabilizes** - Core features are settled
2. **Team grows** - Multiple developers need safety net
3. **Critical paths identified** - Core user flows must not break
4. **Regression bugs occur** - Same bugs keep appearing

Start with:
1. Critical auth flows
2. Billing/payment flows
3. Data mutation functions
4. Role-based access control

---

## Resources

- [Convex Testing](https://docs.convex.dev/testing)
- [Playwright](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
