export const FREE_TIER_LIMITS = {
  maxCustomers: 3,
  maxStaff: 2,
  maxClients: 10,
} as const;

type PlanLimits = {
  name: string;
  maxCustomers: number;
  maxStaff: number;
  maxClients: number;
};

export const PLAN_TIERS: Record<string, PlanLimits> = {
  proMonthly: {
    name: 'Pro',
    maxCustomers: 25,
    maxStaff: 10,
    maxClients: 100,
  },
  proYearly: {
    name: 'Pro',
    maxCustomers: 25,
    maxStaff: 10,
    maxClients: 100,
  },
  businessMonthly: {
    name: 'Business',
    maxCustomers: 100,
    maxStaff: 50,
    maxClients: 500,
  },
  businessYearly: {
    name: 'Business',
    maxCustomers: 100,
    maxStaff: 50,
    maxClients: 500,
  },
};

export function getLimitsForProductKey(productKey: string | undefined | null): {
  maxCustomers: number;
  maxStaff: number;
  maxClients: number;
} {
  if (!productKey) {
    return FREE_TIER_LIMITS;
  }

  const plan = PLAN_TIERS[productKey];
  return {
    maxCustomers: plan.maxCustomers,
    maxStaff: plan.maxStaff,
    maxClients: plan.maxClients,
  };

  return {
    maxCustomers: plan.maxCustomers,
    maxStaff: plan.maxStaff,
    maxClients: plan.maxClients,
  };
}

export function getLimitsForSubscription(params: {
  status: string | undefined | null;
  productKey: string | undefined | null;
}): {
  maxCustomers: number;
  maxStaff: number;
  maxClients: number;
} {
  const isPaid = params.status === 'active' || params.status === 'trialing';
  return isPaid ? getLimitsForProductKey(params.productKey) : FREE_TIER_LIMITS;
}

export function getPlanName(productKey: string | undefined | null): string {
  if (!productKey) {
    return 'Free';
  }

  const plan = PLAN_TIERS[productKey];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Defensive check for runtime safety
  if (plan !== undefined) {
    return plan.name;
  }
  return 'Free';
}
