import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Sync user from WorkOS invitation acceptance webhook
 * Creates new user or updates existing user with invitation data
 */
export const syncFromInvitation = internalMutation({
  args: {
    workosUserId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    orgId: v.id("orgs"),
    role: v.union(v.literal("staff"), v.literal("client")),
    customerId: v.optional(v.id("customers")),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", args.workosUserId))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing user with invitation data
      await ctx.db.patch(existing._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        orgId: args.orgId,
        role: args.role,
        customerId: args.customerId,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      workosUserId: args.workosUserId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      orgId: args.orgId,
      role: args.role,
      customerId: args.customerId,
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});

/**
 * Delete pending invitation after it's been accepted
 * Idempotent - won't error if invitation already deleted
 */
export const deletePendingInvitationByWorkosId = internalMutation({
  args: {
    workosInvitationId: v.string(),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("pendingInvitations")
      .withIndex("by_workos_id", (q) => q.eq("workosInvitationId", args.workosInvitationId))
      .first();

    if (invitation) {
      await ctx.db.delete(invitation._id);
    }
  },
});
