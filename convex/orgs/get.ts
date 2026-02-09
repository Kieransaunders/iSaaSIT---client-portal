import { ConvexError, v } from "convex/values";
import { internalQuery, query } from "../_generated/server";

/**
 * Get the current user's organization
 */
export const getMyOrg = query({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    const workosUserId = user.subject;

    // Find user record
    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", workosUserId))
      .first();

    if (!userRecord?.orgId) {
      return null;
    }

    // Get org details
    const org = await ctx.db.get("orgs", userRecord.orgId);
    if (!org) {
      return null;
    }

    return {
      ...org,
      _id: org._id,
    };
  },
});

/**
 * Get organization by ID (for admin/verification purposes)
 */
export const getOrgById = query({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    const workosUserId = user.subject;

    // Find user to verify they belong to this org
    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", workosUserId))
      .first();

    if (!userRecord?.orgId) {
      return null;
    }

    const org = await ctx.db.get("orgs", userRecord.orgId);
    return org;
  },
});

/**
 * Check if current user has an organization
 * Used to determine if user should be redirected to onboarding
 */
export const hasOrg = query({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      return { hasOrg: false, isAuthenticated: false };
    }

    const workosUserId = user.subject;

    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", workosUserId))
      .first();

    return {
      hasOrg: !!userRecord?.orgId,
      isAuthenticated: true,
      role: userRecord?.role,
    };
  },
});

/**
 * Internal query to get user's org by WorkOS user ID
 * Used by actions that need org context
 */
export const getMyOrgInternal = internalQuery({
  args: {
    workosUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", args.workosUserId))
      .first();

    if (!userRecord?.orgId) {
      return null;
    }

    const org = await ctx.db.get("orgs", userRecord.orgId);
    return org;
  },
});

/**
 * Internal query to get org by WorkOS organization ID
 * Used by webhook handlers to look up org from WorkOS data
 */
export const getOrgByWorkosOrgId = internalQuery({
  args: {
    workosOrgId: v.string(),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db
      .query("orgs")
      .withIndex("by_workos_org_id", (q) => q.eq("workosOrgId", args.workosOrgId))
      .first();

    return org;
  },
});
