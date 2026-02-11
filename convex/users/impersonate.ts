import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Start impersonating a user
 * Only available to admins
 */
export const startImpersonating = mutation({
    args: {
        targetUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("Not authenticated");
        }

        const adminRecord = await ctx.db
            .query("users")
            .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", identity.subject))
            .unique();

        if (!adminRecord || adminRecord.role !== "admin") {
            throw new ConvexError("Only admins can impersonate users");
        }

        const targetUser = await ctx.db.get('users', args.targetUserId);
        if (!targetUser) {
            throw new ConvexError("Target user not found");
        }

        if (targetUser.orgId !== adminRecord.orgId) {
            throw new ConvexError("Cannot impersonate a user from a different organization");
        }

        // Don't allow impersonating yourself (waste of a field)
        if (args.targetUserId === adminRecord._id) {
            return;
        }

        await ctx.db.patch('users', adminRecord._id, {
            impersonatingUserId: args.targetUserId,
        });
    },
});

/**
 * Stop impersonating
 */
export const stopImpersonating = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("Not authenticated");
        }

        const adminRecord = await ctx.db
            .query("users")
            .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", identity.subject))
            .unique();

        if (!adminRecord) {
            throw new ConvexError("User not found");
        }

        await ctx.db.patch('users', adminRecord._id, {
            impersonatingUserId: undefined,
        });
    },
});

/**
 * Get the current impersonation status for the authenticated user
 */
export const getImpersonationStatus = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", identity.subject))
            .unique();

        if (!user?.impersonatingUserId) return null;

        const targetUser = await ctx.db.get('users', user.impersonatingUserId);
        return targetUser;
    },
});
