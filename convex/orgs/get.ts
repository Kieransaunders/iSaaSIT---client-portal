import { ConvexError, v } from "convex/values";
import { internalQuery, query } from "../_generated/server";
import { getEffectiveUser } from "../users/utils";

/**
 * Get the current user's organization
 */
export const getMyOrg = query({
  args: {},
  handler: async (ctx) => {
    const userRecord = await getEffectiveUser(ctx);

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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    // Find user to verify they belong to this org
    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", identity.subject))
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { hasOrg: false, isAuthenticated: false };
    }

    const userRecord = await getEffectiveUser(ctx);

    return {
      hasOrg: !!userRecord?.orgId,
      isAuthenticated: true,
      role: userRecord?.role,
      userId: userRecord?._id,
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

/**
 * Internal query to get org by Convex ID
 * Used by server-side sync actions
 */
export const getOrgByIdInternal = internalQuery({
  args: {
    orgId: v.id("orgs"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get("orgs", args.orgId);
  },
});
