/**
 * Lemon Squeezy Plan Tier Configuration
 *
 * This file defines plan limits. Variant IDs are passed from the frontend
 * via environment variables (VITE_LEMONSQUEEZY_*_VARIANT_ID).
 *
 * The variant ID is stored on the org when a subscription is created,
 * and we look up plan limits based on that stored variant ID.
 */

export const FREE_TIER_LIMITS = {
  maxCustomers: 3,
  maxStaff: 2,
  maxClients: 10,
} as const;

/**
 * Plan tier definitions.
 * Keys should match the variant IDs you configure in your environment.
 */
export const PLAN_TIERS: Record<
  string,
  {
    name: string;
    maxCustomers: number;
    maxStaff: number;
    maxClients: number;
  }
> = {
  // Pro Plan - Small agencies
  // Configure via VITE_LEMONSQUEEZY_PRO_VARIANT_ID in your .env.local
  pro: {
    name: "Pro",
    maxCustomers: 25,
    maxStaff: 10,
    maxClients: 100,
  },

  // Business Plan - Growing agencies
  // Configure via VITE_LEMONSQUEEZY_BUSINESS_VARIANT_ID in your .env.local
  business: {
    name: "Business",
    maxCustomers: 100,
    maxStaff: 50,
    maxClients: 500,
  },
};

/**
 * Get plan limits for a given Lemon Squeezy variant ID
 *
 * @param variantId - Lemon Squeezy variant ID from subscription data
 * @returns Plan limits object (defaults to FREE_TIER_LIMITS for unknown variants)
 */
export function getLimitsForVariant(variantId: string | undefined): {
  maxCustomers: number;
  maxStaff: number;
  maxClients: number;
} {
  if (!variantId) {
    return FREE_TIER_LIMITS;
  }

  const plan = PLAN_TIERS[variantId];

  if (!plan) {
    // Unknown variant ID - default to free tier
    return FREE_TIER_LIMITS;
  }

  return {
    maxCustomers: plan.maxCustomers,
    maxStaff: plan.maxStaff,
    maxClients: plan.maxClients,
  };
}

/**
 * Get display name for a plan variant
 *
 * @param variantId - Lemon Squeezy variant ID (optional)
 * @returns Plan name ("Free", "Pro", or "Business")
 */
export function getPlanName(variantId: string | undefined): string {
  if (!variantId) {
    return "Free";
  }

  const plan = PLAN_TIERS[variantId];
  return plan?.name ?? "Free";
}
