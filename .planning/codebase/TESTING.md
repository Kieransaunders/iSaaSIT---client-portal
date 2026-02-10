# Testing Guide

Testing patterns and strategies for iSaaSIT.

## Table of Contents

- [Current State](#current-state)
- [Testing Philosophy](#testing-philosophy)
- [Manual Testing](#manual-testing)
- [Convex Function Testing](#convex-function-testing)
- [Future Test Setup](#future-test-setup)
- [Testing Patterns](#testing-patterns)
- [Testing Checklists](#testing-checklists)

---

## Current State

**No automated test suite is currently implemented.** This is intentional for a starter template - we prioritize:

1. **Manual testing** during development
2. **TypeScript** for compile-time safety  
3. **Clear patterns** that are easy to test later

The codebase is structured to make adding tests straightforward when the project matures.

---

## Testing Philosophy

### When to Add Tests

Consider adding automated tests when:

1. **Project stabilizes** - Core features are settled
2. **Team grows** - Multiple developers need safety net
3. **Critical paths identified** - Core user flows must not break
4. **Regression bugs occur** - Same bugs keep appearing

### Test Priority Order

Start with:
1. Critical auth flows
2. Billing/payment flows
3. Data mutation functions
4. Role-based access control

---

## Manual Testing

### Development Testing Workflow

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

### Type Safety as Testing

```bash
# Type check entire project
npx tsc --noEmit

# Included in lint script
npm run lint  # Runs: tsc && eslint
```

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

### Test Data Seeding

```typescript
// convex/seed.ts
import { internalMutation } from './_generated/server';
import { v } from 'convex/values';

export const seedTestData = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Only run in development
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot seed in production');
    }

    // Create test org
    const orgId = await ctx.db.insert('orgs', {
      workosOrgId: 'test-org',
      name: 'Test Organization',
      maxCustomers: 10,
      maxStaff: 5,
      maxClients: 50,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { orgId };
  },
});
```

Run seed:
```bash
npx convex run seed:seedTestData
```

---

## Future Test Setup

### Recommended Frameworks

| Type | Tool | Purpose |
|------|------|---------|
| Unit Tests | Vitest | Testing utilities and hooks |
| Component Tests | React Testing Library | Component rendering |
| Convex Tests | `@convex-test/core` | Backend function testing |
| E2E Tests | Playwright | Full user flow testing |

### Vitest Setup (Future)

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**vitest.config.ts**:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

### Convex Test Setup (Future)

```bash
npm install -D @convex-test/core
```

**convex/__tests__/customers.test.ts**:
```typescript
import { test, expect } from '@convex-test/core';
import { api } from '../_generated/api';

test('create customer', async (ctx) => {
  const orgId = await ctx.runMutation(api.testHelpers.createOrg, {
    name: 'Test Org',
  });

  const customerId = await ctx.runMutation(api.customers.create, {
    orgId,
    name: 'Test Customer',
  });

  const customer = await ctx.runQuery(api.customers.get, { customerId });
  expect(customer?.name).toBe('Test Customer');
});
```

### Playwright E2E Setup (Future)

```bash
npm init playwright@latest
```

**e2e/auth.spec.ts**:
```typescript
import { test, expect } from '@playwright/test';

test('user can sign in', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Sign In');

  // WorkOS redirects to their hosted auth
  await expect(page).toHaveURL(/workos.com/);
});

test('protected route redirects when not authenticated', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/');
});

test('admin can create customer', async ({ page }) => {
  // Sign in as admin
  await signInAsRole(page, 'admin');

  // Navigate to customers
  await page.goto('/customers');
  await page.click('text=New Customer');

  // Fill form
  await page.fill('[name="name"]', 'Test Customer');
  await page.click('text=Create');

  // Verify
  await expect(page.locator('text=Test Customer')).toBeVisible();
});
```

---

## Testing Patterns

### Unit Test Patterns (Future)

```typescript
// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('merges tailwind classes', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });
});
```

### Component Test Patterns (Future)

```typescript
// src/components/ui/button.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByText('Delete');
    expect(button).toHaveClass('bg-destructive');
  });

  it('forwards ref', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Button ref={ref}>Button</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
```

### Convex Test Helpers (Future)

```typescript
// convex/testHelpers.ts
import { mutation } from './_generated/server';
import { v } from 'convex/values';

// Only available in development
export const createTestOrg = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Test helpers disabled in production');
    }

    return await ctx.db.insert('orgs', {
      workosOrgId: `test-${Date.now()}`,
      name: args.name,
      maxCustomers: 100,
      maxStaff: 50,
      maxClients: 500,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const cleanupTestData = mutation({
  args: {},
  handler: async (ctx) => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Test helpers disabled in production');
    }

    // Delete test orgs
    const testOrgs = await ctx.db
      .query('orgs')
      .filter((q) => q.startswith(q.field('workosOrgId'), 'test-'))
      .collect();

    for (const org of testOrgs) {
      await ctx.db.delete('orgs', org._id);
    }

    return { deleted: testOrgs.length };
  },
});
```

### Mocking Patterns (Future)

```typescript
// Mock WorkOS auth in tests
vi.mock('@workos/authkit-tanstack-react-start', () => ({
  getAuth: vi.fn(() => Promise.resolve({
    user: { id: 'test-user', email: 'test@example.com' },
    accessToken: 'mock-token',
  })),
  getSignInUrl: vi.fn(() => Promise.resolve('/signin')),
}));

// Mock Convex hooks
vi.mock('convex/react', () => ({
  useQuery: vi.fn(() => undefined),
  useMutation: vi.fn(() => vi.fn()),
}));
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

## CI/CD Testing (Future)

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

## Debugging Failed Tests

### Convex Function Fails

1. Check Convex logs:
   ```bash
   npx convex logs
   ```

2. Test in dashboard with same args

3. Add logging:
   ```typescript
   console.log('Input:', args);
   console.log('User:', ctx.auth?.userId);
   ```

### Frontend Test Fails

1. Run with headed browser:
   ```bash
   npx playwright test --headed
   ```

2. Slow down for visibility:
   ```typescript
   test.use({ launchOptions: { slowMo: 500 } });
   ```

3. Take screenshots:
   ```typescript
   await page.screenshot({ path: 'debug.png' });
   ```

---

## Resources

- [Convex Testing](https://docs.convex.dev/testing)
- [Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)
