/**
 * Billing Configuration
 *
 * Configure your Lemon Squeezy plans via environment variables:
 *
 * VITE_LEMONSQUEEZY_STORE_SLUG=your-store-slug
 * VITE_LEMONSQUEEZY_PRO_VARIANT_ID=12345
 * VITE_LEMONSQUEEZY_BUSINESS_VARIANT_ID=67890
 *
 * Get these values from your Lemon Squeezy Dashboard:
 * - Store slug: Settings -> Store -> Store URL
 * - Variant IDs: Products -> [Your Product] -> Variants -> Copy the ID from URL
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
  variantId?: string;
}

const storeSlug = import.meta.env.VITE_LEMONSQUEEZY_STORE_SLUG;

/**
 * Plan configurations
 * Add or modify plans here. Each plan maps to a Lemon Squeezy variant.
 */
export const PLANS: Record<string, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    price: "$0",
    description: "For small teams getting started",
    features: [
      "Up to 3 customers",
      "Up to 2 team members",
      "Up to 10 external users",
      "Basic support",
    ],
    limits: { maxCustomers: 3, maxStaff: 2, maxClients: 10 },
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: "$29",
    description: "For growing teams",
    features: [
      "Up to 25 customers",
      "Up to 10 team members",
      "Up to 100 external users",
      "Priority support",
      "Custom branding",
    ],
    limits: { maxCustomers: 25, maxStaff: 10, maxClients: 100 },
    variantId: import.meta.env.VITE_LEMONSQUEEZY_PRO_VARIANT_ID,
  },
  business: {
    id: "business",
    name: "Business",
    price: "$99",
    description: "For large teams",
    features: [
      "Up to 100 customers",
      "Up to 50 team members",
      "Up to 500 external users",
      "24/7 dedicated support",
      "Custom integrations",
    ],
    limits: { maxCustomers: 100, maxStaff: 50, maxClients: 500 },
    variantId: import.meta.env.VITE_LEMONSQUEEZY_BUSINESS_VARIANT_ID,
  },
};

/**
 * Check if billing is properly configured
 */
export function isBillingConfigured(): boolean {
  return !!storeSlug;
}

/**
 * Check if a specific plan is available (has a variant ID configured)
 */
export function isPlanAvailable(planId: string): boolean {
  const plan = PLANS[planId];
  if (plan === undefined) return false;
  if (planId === "free") return true; // Free plan is always available
  return !!plan.variantId;
}

/**
 * Get available plans (excluding those without variant IDs)
 */
export function getAvailablePlans(): Array<PlanConfig> {
  return Object.values(PLANS).filter((plan) =>
    plan.id === "free" ? true : !!plan.variantId
  );
}

/**
 * Get checkout URL for a plan
 */
export function getCheckoutUrl(
  planId: string,
  options: {
    email: string;
    orgName: string;
    orgConvexId: string;
  }
): string | null {
  if (!storeSlug) {
    console.error("VITE_LEMONSQUEEZY_STORE_SLUG not configured");
    return null;
  }

  const plan = PLANS[planId];
  if (!plan?.variantId) {
    console.error(`Plan ${planId} not found or variant ID not configured`);
    return null;
  }

  const checkoutUrl = new URL(
    `https://${storeSlug}.lemonsqueezy.com/checkout/buy/${plan.variantId}`
  );
  checkoutUrl.searchParams.set("checkout[email]", options.email);
  checkoutUrl.searchParams.set("checkout[name]", options.orgName);
  checkoutUrl.searchParams.set("checkout[custom][org_convex_id]", options.orgConvexId);

  return checkoutUrl.toString();
}

/**
 * Get plan by variant ID (used when processing webhooks)
 */
export function getPlanByVariantId(variantId: string): PlanConfig | undefined {
  return Object.values(PLANS).find((plan) => plan.variantId === variantId);
}
