import { ConvexError, v  } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Sync current WorkOS user to Convex
 * Called on first login to create user record
 */
export const syncCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    const workosUserId = user.subject;

    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", workosUserId))
      .first();

    const email = user.email ?? "";
    const firstName = typeof user.given_name === "string" ? user.given_name : undefined;
    const lastName = typeof user.family_name === "string" ? user.family_name : undefined;

    if (existing) {
      // Update user data from WorkOS
      await ctx.db.patch("users", existing._id, {
        email,
        firstName,
        lastName,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    // Create new user without org (will be assigned during onboarding)
    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      workosUserId,
      email,
      firstName,
      lastName,
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});

/**
 * Get current user's profile
 */
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    const workosUserId = user.subject;

    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", workosUserId))
      .first();

    if (!userRecord) {
      return null;
    }

    // Get org name if user has an org
    let orgName: string | null = null;
    if (userRecord.orgId) {
      const org = await ctx.db.get("orgs", userRecord.orgId);
      orgName = org?.name ?? null;
    }

    return {
      ...userRecord,
      orgName,
    };
  },
});
