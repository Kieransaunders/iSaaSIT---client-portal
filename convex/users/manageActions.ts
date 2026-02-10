"use node";

import { WorkOS } from "@workos-inc/node";
import { ConvexError, v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";

const isNonFatalWorkosError = (error: unknown) => {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return false;
  }

  const status = (error as { status?: number }).status;
  return status === 404 || status === 409;
};

/**
 * Delete a user in WorkOS and soft-delete them in Convex
 * Admin-only action
 */
export const removeUser = action({
  args: {
    userId: v.id("users"),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const workosUserId = identity.subject;

    const currentUser = await ctx.runQuery(internal.users.internal.getUserByWorkosId, {
      workosUserId,
    });

    if (!currentUser?.orgId) {
      throw new ConvexError("User not in organization");
    }

    if (currentUser.role !== "admin") {
      throw new ConvexError("Admin role required to remove users");
    }

    const targetUser = await ctx.runQuery(internal.users.internal.getUserById, {
      userId: args.userId,
    });

    if (!targetUser) {
      throw new ConvexError("User not found");
    }

    if (targetUser.orgId !== currentUser.orgId) {
      throw new ConvexError("Cannot remove user from another organization");
    }

    if (targetUser._id === currentUser._id) {
      throw new ConvexError("Cannot remove yourself");
    }

    try {
      const workos = new WorkOS(process.env.WORKOS_API_KEY);
      await workos.userManagement.deleteUser(targetUser.workosUserId);
    } catch (error) {
      if (!isNonFatalWorkosError(error)) {
        const message = error instanceof Error ? error.message : "Unknown error";
        throw new ConvexError(`Failed to delete user in WorkOS: ${message}`);
      }
    }

    await ctx.runMutation(internal.users.internal.softDeleteUser, {
      userId: args.userId,
    });

    return { success: true };
  },
});
