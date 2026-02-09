/**
 * Lemon Squeezy Subscription Sync
 *
 * Internal mutations to update org subscription state based on webhook events.
 */

import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { FREE_TIER_LIMITS, getLimitsForVariant } from "./plans";

/**
 * Process a Lemon Squeezy subscription webhook event
 *
 * Updates org subscription status and plan limits based on event type.
 *
 * Event handling:
 * - subscription_created: Set subscription ID, status, plan limits
 * - subscription_updated: Update subscription status, plan limits, trial state
 * - subscription_cancelled: Mark cancelled, keep limits until period ends
 * - subscription_expired: Revert to free tier (handles trial expiration and regular expiration)
 * - subscription_payment_failed: Mark past_due, keep limits (LS retries payment)
 */
export const processSubscriptionEvent = internalMutation({
  args: {
    eventName: v.string(),
    customerId: v.optional(v.string()),
    subscriptionId: v.string(),
    variantId: v.string(),
    status: v.string(),
    orgConvexId: v.optional(v.string()),
    trialEndsAt: v.optional(v.string()),
    endsAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find the org: try custom data first (from checkout), then fall back to subscription ID
    let org = null;

    if (args.orgConvexId) {
      org = await ctx.db.get(args.orgConvexId as any);
    }

    // Fall back to finding by subscription ID
    if (!org) {
      org = await ctx.db
        .query("orgs")
        .withIndex("by_subscription_id", (q) =>
          q.eq("subscriptionId", args.subscriptionId)
        )
        .first();
    }

    if (!org) {
      console.warn(
        `Webhook for unknown org. Subscription: ${args.subscriptionId}, Event: ${args.eventName}`
      );
      return;
    }

    const now = Date.now();

    // Map Lemon Squeezy status to schema union
    const mapStatus = (lsStatus: string) => {
      switch (lsStatus) {
        case "active":
        case "on_trial":
          return "active";
        case "cancelled":
          return "cancelled";
        case "past_due":
          return "past_due";
        case "unpaid":
          return "unpaid";
        case "paused":
          return "paused";
        default:
          return "inactive";
      }
    };

    // Handle different event types
    if (args.eventName === "subscription_created" || args.eventName === "subscription_updated") {
      // Get plan limits for this variant
      const limits = getLimitsForVariant(args.variantId);

      // Prepare trial timestamp if present
      const trialEndsAt = args.trialEndsAt
        ? new Date(args.trialEndsAt).getTime()
        : undefined;

      await ctx.db.patch(org._id, {
        subscriptionId: args.subscriptionId,
        subscriptionStatus: mapStatus(args.status),
        planId: args.variantId,
        lemonSqueezyCustomerId: args.customerId,
        maxCustomers: limits.maxCustomers,
        maxStaff: limits.maxStaff,
        maxClients: limits.maxClients,
        trialEndsAt,
        updatedAt: now,
      });
    } else if (args.eventName === "subscription_cancelled") {
      // Keep current limits (user has access until period ends)
      // Store endsAt timestamp if provided
      const endsAt = args.endsAt ? new Date(args.endsAt).getTime() : undefined;

      await ctx.db.patch(org._id, {
        subscriptionStatus: "cancelled",
        endsAt,
        updatedAt: now,
      });
    } else if (args.eventName === "subscription_expired") {
      // Subscription expired - revert to free tier
      // This handles both trial expiration and regular subscription expiration
      await ctx.db.patch(org._id, {
        subscriptionStatus: "inactive",
        maxCustomers: FREE_TIER_LIMITS.maxCustomers,
        maxStaff: FREE_TIER_LIMITS.maxStaff,
        maxClients: FREE_TIER_LIMITS.maxClients,
        planId: undefined,
        subscriptionId: undefined,
        trialEndsAt: undefined,
        endsAt: undefined,
        updatedAt: now,
      });
    } else if (args.eventName === "subscription_payment_failed") {
      // Mark as past_due, keep current limits (Lemon Squeezy will retry)
      await ctx.db.patch(org._id, {
        subscriptionStatus: "past_due",
        updatedAt: now,
      });
    }
  },
});
