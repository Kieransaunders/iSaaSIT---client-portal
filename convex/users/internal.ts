import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";

const userSummary = v.object({
  _id: v.id("users"),
  orgId: v.optional(v.id("orgs")),
  role: v.optional(v.union(v.literal("admin"), v.literal("staff"), v.literal("client"))),
  workosUserId: v.string(),
  deletedAt: v.optional(v.number()),
});

export const getUserByWorkosId = internalQuery({
  args: {
    workosUserId: v.string(),
  },
  returns: v.union(v.null(), userSummary),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", args.workosUserId))
      .first();

    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      orgId: user.orgId,
      role: user.role,
      workosUserId: user.workosUserId,
      deletedAt: user.deletedAt,
    };
  },
});

export const getUserById = internalQuery({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(v.null(), userSummary),
  handler: async (ctx, args) => {
    const user = await ctx.db.get("users", args.userId);

    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      orgId: user.orgId,
      role: user.role,
      workosUserId: user.workosUserId,
      deletedAt: user.deletedAt,
    };
  },
});

export const softDeleteUser = internalMutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const targetUser = await ctx.db.get("users", args.userId);

    if (!targetUser) {
      throw new ConvexError("User not found");
    }

    await ctx.db.patch("users", args.userId, {
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });

    if (targetUser.role === "staff") {
      const assignments = await ctx.db
        .query("staffCustomerAssignments")
        .withIndex("by_staff", (q) => q.eq("staffUserId", args.userId))
        .collect();

      for (const assignment of assignments) {
        await ctx.db.delete("staffCustomerAssignments", assignment._id);
      }
    }

    return null;
  },
});
