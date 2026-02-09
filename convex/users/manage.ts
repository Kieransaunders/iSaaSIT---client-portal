import { ConvexError, v  } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Soft-delete a user (sets deletedAt timestamp)
 * Admin-only action that also removes all staff assignments
 */
export const removeUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const workosUserId = identity.subject;

    // Get current user record and verify admin role
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", workosUserId))
      .first();

    if (!currentUser?.orgId) {
      throw new ConvexError("User not in organization");
    }

    if (currentUser.role !== "admin") {
      throw new ConvexError("Admin role required to remove users");
    }

    // Get target user
    const targetUser = await ctx.db.get("users", args.userId);
    if (!targetUser) {
      throw new ConvexError("User not found");
    }

    // Verify target user belongs to same org
    if (targetUser.orgId !== currentUser.orgId) {
      throw new ConvexError("Cannot remove user from another organization");
    }

    // Prevent admin from removing themselves
    if (targetUser._id === currentUser._id) {
      throw new ConvexError("Cannot remove yourself");
    }

    // Soft delete: set deletedAt timestamp
    await ctx.db.patch("users", args.userId, {
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Auto-unassign: remove all staff assignments if target is staff
    if (targetUser.role === "staff") {
      const assignments = await ctx.db
        .query("staffCustomerAssignments")
        .withIndex("by_staff", (q) => q.eq("staffUserId", args.userId))
        .collect();

      for (const assignment of assignments) {
        await ctx.db.delete("staffCustomerAssignments", assignment._id);
      }
    }

    return { success: true };
  },
});

/**
 * Restore a previously removed user (clears deletedAt)
 * Admin-only action
 */
export const restoreUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const workosUserId = identity.subject;

    // Get current user record and verify admin role
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", workosUserId))
      .first();

    if (!currentUser?.orgId) {
      throw new ConvexError("User not in organization");
    }

    if (currentUser.role !== "admin") {
      throw new ConvexError("Admin role required to restore users");
    }

    // Get target user
    const targetUser = await ctx.db.get("users", args.userId);
    if (!targetUser) {
      throw new ConvexError("User not found");
    }

    // Verify target user belongs to same org
    if (targetUser.orgId !== currentUser.orgId) {
      throw new ConvexError("Cannot restore user from another organization");
    }

    // Verify user is actually removed
    if (!targetUser.deletedAt) {
      throw new ConvexError("User is not removed");
    }

    // Clear deletedAt to restore
    await ctx.db.patch("users", args.userId, {
      deletedAt: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
