/**
 * Billing Configuration
 *
 * Configure Polar in your Convex environment:
 * - POLAR_ORGANIZATION_TOKEN
 * - POLAR_WEBHOOK_SECRET
 * - POLAR_SERVER (sandbox | production)
 * - POLAR_PRO_MONTHLY_PRODUCT_ID, POLAR_PRO_YEARLY_PRODUCT_ID
 * - POLAR_BUSINESS_MONTHLY_PRODUCT_ID, POLAR_BUSINESS_YEARLY_PRODUCT_ID
 */

export interface PlanConfig {
  id: string;
  name: string;
  price: string;
  description: string;
  features: Array<string>;
  limits: {
    maxCustomers: number;
    maxStaff: number;
    maxClients: number;
  };
  productKey?: string;
  interval?: 'month' | 'year';
}

const polarServer = import.meta.env.VITE_POLAR_SERVER;

export const PLANS: Record<string, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    price: '$0',
    description: 'For small teams getting started',
    features: ['Up to 3 customers', 'Up to 2 team members', 'Up to 10 external users', 'Basic support'],
    limits: { maxCustomers: 3, maxStaff: 2, maxClients: 10 },
  },
  proMonthly: {
    id: 'proMonthly',
    name: 'Pro',
    price: '$29',
    interval: 'month',
    description: 'For growing teams',
    features: [
      'Up to 25 customers',
      'Up to 10 team members',
      'Up to 100 external users',
      'Priority support',
      'Custom branding',
    ],
    limits: { maxCustomers: 25, maxStaff: 10, maxClients: 100 },
    productKey: 'proMonthly',
  },
  proYearly: {
    id: 'proYearly',
    name: 'Pro',
    price: '$290',
    interval: 'year',
    description: 'For growing teams',
    features: [
      'Up to 25 customers',
      'Up to 10 team members',
      'Up to 100 external users',
      'Priority support',
      'Custom branding',
    ],
    limits: { maxCustomers: 25, maxStaff: 10, maxClients: 100 },
    productKey: 'proYearly',
  },
  businessMonthly: {
    id: 'businessMonthly',
    name: 'Business',
    price: '$99',
    interval: 'month',
    description: 'For large teams',
    features: [
      'Up to 100 customers',
      'Up to 50 team members',
      'Up to 500 external users',
      '24/7 dedicated support',
      'Custom integrations',
    ],
    limits: { maxCustomers: 100, maxStaff: 50, maxClients: 500 },
    productKey: 'businessMonthly',
  },
  businessYearly: {
    id: 'businessYearly',
    name: 'Business',
    price: '$990',
    interval: 'year',
    description: 'For large teams',
    features: [
      'Up to 100 customers',
      'Up to 50 team members',
      'Up to 500 external users',
      '24/7 dedicated support',
      'Custom integrations',
    ],
    limits: { maxCustomers: 100, maxStaff: 50, maxClients: 500 },
    productKey: 'businessYearly',
  },
};

export function isBillingConfigured(): boolean {
  return !!polarServer;
}

export function isPlanAvailable(planId: string): boolean {
  const plan = PLANS[planId];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Defensive check for runtime safety
  if (plan === undefined) {
    return false;
  }
  if (planId === 'free') return true;
  return !!plan.productKey;
}

export function getAvailablePlans(): Array<PlanConfig> {
  return Object.values(PLANS).filter((plan) => (plan.id === 'free' ? true : !!plan.productKey));
}
