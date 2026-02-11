---
name: polar-sh
description: |
  Polar.sh subscription billing integration for SaaS. Use when:
  - Setting up subscription payments with Polar.sh
  - Integrating Polar checkout and customer portal
  - Handling Polar webhooks in Convex
  - Managing subscription lifecycle (create, update, cancel)
  - Implementing usage-based billing or tiered pricing
  - Migrating from Lemon Squeezy to Polar.sh
  Triggers: polar, subscription, billing, checkout, webhook, customer portal, @polar-sh, @convex-dev/polar
---

# Polar.sh Billing Integration

Polar.sh is a subscription billing platform with first-class support for SaaS. This skill covers integration with Convex backend and TanStack Start frontend.

## Quick Reference

### Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   TanStack      │────▶│   Convex         │────▶│   Polar.sh      │
│   Start (UI)    │◄────│   (Backend)      │◄────│   (Billing)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                        │
        │ CheckoutLink           │ Webhooks              │
        │ CustomerPortalLink     │ syncProducts          │ Payment
        └────────────────────────┴────────────────────────┘
```

### Installation

```bash
# Convex component
npm install @convex-dev/polar

# TanStack Start adapter (optional - for direct API routes)
npm install @polar-sh/tanstack-start
```

## Convex Component Setup

### 1. Configure Convex Component

Create `convex/convex.config.ts`:

```typescript
import { defineApp } from 'convex/server';
import polar from '@convex-dev/polar/convex.config.js';

const app = defineApp();
app.use(polar);

export default app;
```

### 2. Set Environment Variables

```bash
# Polar Organization Token (from Polar Dashboard)
npx convex env set POLAR_ORGANIZATION_TOKEN polar_org_xxx

# Webhook Secret (from Polar Dashboard)
npx convex env set POLAR_WEBHOOK_SECRET whsec_xxx

# Server environment (sandbox for testing)
npx convex env set POLAR_SERVER sandbox
# or for production:
npx convex env set POLAR_SERVER production
```

### 3. Initialize Polar Client

Create `convex/polar.ts`:

```typescript
import { Polar } from '@convex-dev/polar';
import { components } from './_generated/api';
import { api } from './_generated/api';

export const polar = new Polar(components.polar, {
  // Map product keys to Polar product IDs
  products: {
    free: 'free', // Special key for free tier
    proMonthly: 'product_xxx', // From Polar Dashboard
    proYearly: 'product_yyy',
    businessMonthly: 'product_zzz',
  },

  // Function to get current user info
  getUserInfo: async (ctx) => {
    const user = await ctx.runQuery(api.users.getCurrentUser);
    return {
      userId: user._id,
      email: user.email,
    };
  },
});

// Export API functions
export const {
  // Queries
  getCurrentSubscription,
  listUserSubscriptions,
  getConfiguredProducts,
  listAllProducts,

  // Mutations
  changeCurrentSubscription,
  cancelCurrentSubscription,

  // Actions
  generateCheckoutLink,
  generateCustomerPortalUrl,
} = polar.api();
```

### 4. Setup Webhook Handler

Create or update `convex/http.ts`:

```typescript
import { httpRouter } from 'convex/server';
import { polar } from './polar';

const http = httpRouter();

// Register Polar webhook handler at /polar/events
polar.registerRoutes(http);

// Or with custom callbacks
polar.registerRoutes(http, {
  path: '/polar/events',
  onSubscriptionCreated: async (ctx, event) => {
    console.log('New subscription:', event.data.id);
    // Notify user, update analytics, etc.
  },
  onSubscriptionUpdated: async (ctx, event) => {
    console.log('Subscription updated:', event.data.id);
    // Handle cancellations, upgrades, etc.
  },
  onSubscriptionCanceled: async (ctx, event) => {
    console.log('Subscription cancelled:', event.data.id);
  },
});

export default http;
```

### 5. Create Products in Polar Dashboard

1. Go to Polar Dashboard → Products
2. Create a product for each plan (monthly/yearly need separate products)
3. Copy product IDs and update `convex/polar.ts`
4. Set webhook endpoint: `https://your-app.convex.site/polar/events`
5. Enable webhook events:
   - `product.created`
   - `product.updated`
   - `subscription.created`
   - `subscription.updated`

## Frontend Integration

### Display Pricing with Checkout

```tsx
import { useQuery, useAction } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function PricingPage() {
  const products = useQuery(api.polar.getConfiguredProducts);
  const generateCheckout = useAction(api.polar.generateCheckoutLink);

  const handleSubscribe = async (productKey: string) => {
    const { url } = await generateCheckout({ productKey });
    if (url) {
      window.location.href = url;
    }
  };

  if (!products) return <div>Loading...</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {products.proMonthly && (
        <Card>
          <CardHeader>
            <CardTitle>Pro Monthly</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${(products.proMonthly.prices[0].priceAmount ?? 0) / 100}/mo
            </p>
            <Button onClick={() => handleSubscribe('proMonthly')}>
              Subscribe
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### Customer Portal Link

```tsx
import { useAction } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Button } from '@/components/ui/button';

function ManageSubscriptionButton() {
  const getPortalUrl = useAction(api.polar.generateCustomerPortalUrl);

  const handleManage = async () => {
    const { url } = await getPortalUrl({});
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <Button variant="outline" onClick={handleManage}>
      Manage Subscription
    </Button>
  );
}
```

### Check Subscription Status

```tsx
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

function SubscriptionStatus() {
  const subscription = useQuery(api.polar.getCurrentSubscription);

  if (!subscription) {
    return <div>No active subscription</div>;
  }

  const isActive = subscription.status === 'active';
  const isTrialing = subscription.status === 'trialing';
  const currentPeriodEnd = new Date(subscription.currentPeriodEnd);

  return (
    <div>
      <p>Status: {subscription.status}</p>
      <p>Plan: {subscription.productKey}</p>
      <p>Renews: {currentPeriodEnd.toLocaleDateString()}</p>
    </div>
  );
}
```

## Usage-Based Limits Integration

### Define Plan Limits

Create `convex/plans.ts`:

```typescript
import { v } from 'convex/values';
import { query } from './_generated/server';
import { polar } from './polar';

const PLAN_LIMITS: Record<string, { maxCustomers: number; maxStaff: number; maxProjects: number }> = {
  free: { maxCustomers: 3, maxStaff: 2, maxProjects: 5 },
  proMonthly: { maxCustomers: 25, maxStaff: 10, maxProjects: 50 },
  proYearly: { maxCustomers: 25, maxStaff: 10, maxProjects: 50 },
  businessMonthly: { maxCustomers: 100, maxStaff: 50, maxProjects: 200 },
};

export const getCurrentLimits = query({
  args: {},
  returns: v.object({
    maxCustomers: v.number(),
    maxStaff: v.number(),
    maxProjects: v.number(),
  }),
  handler: async (ctx) => {
    // Try to get subscription limits
    const subscription = await polar.getCurrentSubscription(ctx, {});
    
    if (subscription?.status === 'active' || subscription?.status === 'trialing') {
      const limits = PLAN_LIMITS[subscription.productKey];
      if (limits) return limits;
    }

    // Default to free tier
    return PLAN_LIMITS.free;
  },
});
```

### Enforce Limits in Mutations

```typescript
import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { ConvexError } from 'convex/values';
import { polar } from './polar';

export const createCustomer = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
  },
  returns: v.id('customers'),
  handler: async (ctx, args) => {
    // Get current limits
    const subscription = await polar.getCurrentSubscription(ctx, {});
    const productKey = subscription?.status === 'active' 
      ? subscription.productKey 
      : 'free';
    
    const limits = PLAN_LIMITS[productKey];

    // Count existing customers
    const existingCount = await ctx.db
      .query('customers')
      .withIndex('by_org', q => q.eq('orgId', ctx.auth.userId))
      .collect()
      .then(c => c.length);

    // Check limit
    if (existingCount >= limits.maxCustomers) {
      throw new ConvexError({
        code: 'USAGE_LIMIT',
        message: `Customer limit reached (${limits.maxCustomers})`,
        limit: limits.maxCustomers,
        current: existingCount,
        upgradeUrl: '/billing',
      });
    }

    return await ctx.db.insert('customers', args);
  },
});
```

## TanStack Start Adapter (Alternative)

For direct API routes without Convex:

### Checkout Route

```tsx
// src/routes/api/checkout.ts
import { Checkout } from '@polar-sh/tanstack-start';
import { createFileRoute } from '@tanstack/react-start';

export const Route = createFileRoute('/api/checkout')({
  server: {
    handlers: {
      GET: Checkout({
        accessToken: process.env.POLAR_ACCESS_TOKEN!,
        successUrl: `${process.env.VITE_APP_URL}/billing/success`,
        returnUrl: process.env.VITE_APP_URL,
        server: process.env.POLAR_SERVER as 'sandbox' | 'production',
      }),
    },
  },
});
```

### Customer Portal Route

```tsx
// src/routes/api/portal.ts
import { CustomerPortal } from '@polar-sh/tanstack-start';
import { createFileRoute } from '@tanstack/react-start';
import { getAuth } from '@workos/authkit-tanstack-react-start';

export const Route = createFileRoute('/api/portal')({
  server: {
    handlers: {
      GET: CustomerPortal({
        accessToken: process.env.POLAR_ACCESS_TOKEN!,
        getCustomerId: async (request: Request) => {
          // Get user from auth
          const { user } = await getAuth();
          // Return Polar customer ID stored in your DB
          return user?.id ?? '';
        },
        returnUrl: process.env.VITE_APP_URL,
        server: process.env.POLAR_SERVER as 'sandbox' | 'production',
      }),
    },
  },
});
```

### Webhook Route

```tsx
// src/routes/api/webhooks/polar.ts
import { Webhooks } from '@polar-sh/tanstack-start';
import { createFileRoute } from '@tanstack/react-start';

export const Route = createFileRoute('/api/webhooks/polar')({
  server: {
    handlers: {
      POST: Webhooks({
        webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
        onSubscriptionCreated: async (payload) => {
          console.log('New subscription:', payload.data);
          // Sync to your database
        },
        onSubscriptionUpdated: async (payload) => {
          console.log('Subscription updated:', payload.data);
        },
        onSubscriptionCanceled: async (payload) => {
          console.log('Subscription cancelled:', payload.data);
        },
      }),
    },
  },
});
```

## Migrating from Lemon Squeezy

### 1. Replace Dependencies

```bash
npm uninstall @lemonsqueezy/lemonsqueezy.js
npm install @convex-dev/polar
```

### 2. Update Configuration

Replace `src/config/billing.ts`:

```typescript
// Before (Lemon Squeezy)
export interface PlanConfig {
  id: string;
  name: string;
  price: string;
  variantId?: string;
}

export const PLANS: Record<string, PlanConfig> = {
  pro: { id: 'pro', name: 'Pro', price: '$29', variantId: '12345' },
};

// After (Polar.sh)
// Use Polar product keys instead - configured in convex/polar.ts
export const PLAN_DISPLAY: Record<string, { name: string; price: string }> = {
  proMonthly: { name: 'Pro Monthly', price: '$29' },
  proYearly: { name: 'Pro Yearly', price: '$290' },
};
```

### 3. Update Schema

Remove Lemon Squeezy fields, add Polar fields:

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  orgs: defineTable({
    name: v.string(),
    // Remove: lemonSqueezyCustomerId, lemonSqueezySubscriptionId
    // Polar customer ID (optional - managed by component)
    polarCustomerId: v.optional(v.string()),
  }),
});
```

### 4. Update Convex Functions

Replace Lemon Squeezy queries/mutations with Polar equivalents:

```typescript
// Before (Lemon Squeezy)
import { query } from './_generated/server';

export const getBillingInfo = query({
  handler: async (ctx) => {
    const org = await getOrg(ctx);
    // Query Lemon Squeezy API
    const subscription = await fetchLemonSqueezySubscription(org.subscriptionId);
    return { status: subscription.status };
  },
});

// After (Polar.sh)
import { polar } from './polar';

export const getBillingInfo = polar.api().getCurrentSubscription;
```

### 5. Update Frontend Components

```tsx
// Before (Lemon Squeezy)
import { getCheckoutUrl } from '@/config/billing';

<UpgradeButton
  planId="pro"
  email={org.email}
  orgName={org.name}
  orgConvexId={org._id}
/>

// After (Polar.sh)
import { useAction } from 'convex/react';
import { api } from '../convex/_generated/api';

function SubscribeButton({ productKey }: { productKey: string }) {
  const generateCheckout = useAction(api.polar.generateCheckoutLink);

  const handleClick = async () => {
    const { url } = await generateCheckout({ productKey });
    if (url) window.location.href = url;
  };

  return <Button onClick={handleClick}>Subscribe</Button>;
}
```

## Common Patterns

### Trial Handling

```tsx
function TrialBanner() {
  const subscription = useQuery(api.polar.getCurrentSubscription);

  if (!subscription || subscription.status !== 'trialing') return null;

  const daysLeft = Math.ceil(
    (new Date(subscription.trialEnd!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className={`p-4 rounded-lg ${daysLeft <= 3 ? 'bg-amber-100' : 'bg-blue-100'}`}>
      <p>Your trial ends in {daysLeft} days</p>
      <Link to="/billing">Upgrade now</Link>
    </div>
  );
}
```

### Cancel Subscription

```tsx
function CancelSubscriptionButton() {
  const cancel = useMutation(api.polar.cancelCurrentSubscription);
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      await cancel({});
      toast.success('Subscription cancelled');
    } catch (error) {
      toast.error('Failed to cancel');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="destructive" onClick={handleCancel} disabled={isLoading}>
      Cancel Subscription
    </Button>
  );
}
```

### Change Plan

```tsx
function ChangePlanButton({ newProductKey }: { newProductKey: string }) {
  const changePlan = useMutation(api.polar.changeCurrentSubscription);

  const handleChange = async () => {
    await changePlan({ productKey: newProductKey });
    toast.success('Plan changed successfully');
  };

  return <Button onClick={handleChange}>Switch to {newProductKey}</Button>;
}
```

## Environment Variables Reference

| Variable | Source | Description |
|----------|--------|-------------|
| `POLAR_ORGANIZATION_TOKEN` | Polar Dashboard → Settings → API Keys | Organization access token |
| `POLAR_WEBHOOK_SECRET` | Polar Dashboard → Settings → Webhooks | Webhook signing secret |
| `POLAR_SERVER` | Set manually | `sandbox` or `production` |

For TanStack Start adapter only:
| Variable | Description |
|----------|-------------|
| `POLAR_ACCESS_TOKEN` | Same as `POLAR_ORGANIZATION_TOKEN` |
| `VITE_APP_URL` | Your app's base URL |

## Critical Rules

1. **Always use Convex component for state** - Don't store subscription state in your own tables; use Polar's synced data
2. **Check subscription status** - Always verify `status === 'active'` or `'trialing'` before granting paid features
3. **Handle webhook failures gracefully** - Polar will retry webhooks; ensure idempotency
4. **Test in sandbox first** - Use `POLAR_SERVER=sandbox` for development
5. **Product keys are static** - Map product keys (like `'proMonthly'`) to Polar product IDs in config

## Error Handling

```typescript
import { ConvexError } from 'convex/values';

// Polar component throws these errors:
throw new ConvexError({
  code: 'POLAR_ERROR',
  message: 'Failed to generate checkout link',
  details: error.message,
});

// Frontend handling:
try {
  await generateCheckout({ productKey: 'proMonthly' });
} catch (error) {
  if (error.data?.code === 'POLAR_ERROR') {
    toast.error('Billing service unavailable. Please try again.');
  }
}
```

## Resources

- [Polar.sh Documentation](https://polar.sh/docs)
- [Convex Polar Component](https://www.convex.dev/components/polar)
- [TanStack Start Adapter](https://polar.sh/docs/integrate/sdk/adapters/tanstack-start)
- [Polar SDK Reference](https://github.com/polarsource/polar-js)
