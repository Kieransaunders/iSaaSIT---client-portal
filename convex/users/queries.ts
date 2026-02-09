import { ConvexError } from "convex/values";
import { query } from "../_generated/server";

/**
 * List all members of the current user's organization
 * Admin-only query that includes both active and removed users
 */
export const listOrgMembers = query({
  args: {},
  handler: async (ctx) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const workosUserId = identity.subject;

    // Get current user record
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", workosUserId))
      .first();

    if (!currentUser?.orgId) {
      throw new ConvexError("User not in organization");
    }

    // Only admin can list all members
    if (currentUser.role !== "admin") {
      throw new ConvexError("Permission denied");
    }

    // Get all users in the organization
    const users = await ctx.db
      .query("users")
      .withIndex("by_org", (q) => q.eq("orgId", currentUser.orgId))
      .collect();

    // Enrich with status and displayName, sort by status
    const enrichedUsers = users.map((user) => {
      const status = user.deletedAt ? "removed" : "active";
      const displayName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.email;

      return {
        ...user,
        status,
        displayName,
      };
    });

    // Sort: active users first, then removed users
    enrichedUsers.sort((a, b) => {
      if (a.status === "active" && b.status === "removed") return -1;
      if (a.status === "removed" && b.status === "active") return 1;
      return 0;
    });

    return enrichedUsers;
  },
});

/**
 * Get counts of organization members by role
 * Admin-only query for team page tab counts
 */
export const getOrgMemberCounts = query({
  args: {},
  handler: async (ctx) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const workosUserId = identity.subject;

    // Get current user record
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", workosUserId))
      .first();

    if (!currentUser?.orgId) {
      return {
        staffCount: 0,
        clientCount: 0,
        pendingCount: 0,
        totalActive: 0,
      };
    }

    const orgId = currentUser.orgId;

    // Get all active users (exclude deleted)
    const users = await ctx.db
      .query("users")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();

    const activeUsers = users.filter((u) => !u.deletedAt);
    const staffCount = activeUsers.filter((u) => u.role === "staff").length;
    const clientCount = activeUsers.filter((u) => u.role === "client").length;

    // Count pending invitations
    const pendingInvitations = await ctx.db
      .query("pendingInvitations")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();

    return {
      staffCount,
      clientCount,
      pendingCount: pendingInvitations.length,
      totalActive: activeUsers.length,
    };
  },
});
