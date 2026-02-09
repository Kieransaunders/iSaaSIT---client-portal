import { ConvexError, v  } from "convex/values";
import { mutation } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/**
 * Create a new organization in Convex (after creating in WorkOS)
 * This is called after the org is created in WorkOS via their API
 */
export const createOrg = mutation({
  args: {
    workosOrgId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    // Check if org already exists
    const existing = await ctx.db
      .query("orgs")
      .withIndex("by_workos_org_id", (q) => q.eq("workosOrgId", args.workosOrgId))
      .first();

    if (existing) {
      throw new ConvexError("Organization already exists");
    }

    // Create org with free tier defaults
    const now = Date.now();
    const orgId = await ctx.db.insert("orgs", {
      workosOrgId: args.workosOrgId,
      name: args.name,
      subscriptionStatus: "inactive",
      planId: "free",
      // Free tier limits
      maxCustomers: 3,
      maxStaff: 2,
      maxClients: 10,
      createdAt: now,
      updatedAt: now,
    });

    return orgId;
  },
});

/**
 * Get or create the current user's organization
 * Called during onboarding to check if user needs to create org
 */
export const getOrCreateMyOrg = mutation({
  args: {
    workosOrgId: v.string(),
    orgName: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    const workosUserId = user.subject;

    // Check if user already has an org
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", workosUserId))
      .first();

    if (existingUser?.orgId) {
      // User already has an org, return it
      const org = await ctx.db.get("orgs", existingUser.orgId);
      return { org, isNew: false };
    }

    // Check if org exists in Convex
    const org = await ctx.db
      .query("orgs")
      .withIndex("by_workos_org_id", (q) => q.eq("workosOrgId", args.workosOrgId))
      .first();

    let orgId: Id<"orgs">;

    if (!org) {
      // Create new org
      const now = Date.now();
      orgId = await ctx.db.insert("orgs", {
        workosOrgId: args.workosOrgId,
        name: args.orgName,
        subscriptionStatus: "inactive",
        planId: "free",
        maxCustomers: 3,
        maxStaff: 2,
        maxClients: 10,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      orgId = org._id;
    }

    // Create or update user record
    const now = Date.now();
    const email = user.email ?? "";
    const firstName = typeof user.given_name === "string" ? user.given_name : undefined;
    const lastName = typeof user.family_name === "string" ? user.family_name : undefined;

    if (existingUser) {
      await ctx.db.patch("users", existingUser._id, {
        orgId,
        role: "admin",
        email,
        firstName,
        lastName,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("users", {
        workosUserId,
        orgId,
        role: "admin",
        email,
        firstName,
        lastName,
        createdAt: now,
        updatedAt: now,
      });
    }

    const newOrg = await ctx.db.get("orgs", orgId);
    return { org: newOrg, isNew: true };
  },
});
