"use node";
import { WorkOS } from "@workos-inc/node";
import { ConvexError, v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";

export const updateOrganization = action({
  args: {
    name: v.optional(v.string()),
    billingEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const workosUserId = identity.subject;

    // Get user record and verify admin role
    const userRecord = await ctx.runQuery(internal.invitations.internal.getUserRecord, {
      workosUserId,
    });

    if (!userRecord) {
      throw new ConvexError("User record not found");
    }

    if (userRecord.role !== "admin") {
      throw new ConvexError("Admin role required to update organization");
    }

    if (!userRecord.orgId) {
      throw new ConvexError("User not in organization");
    }

    // Get user's org from Convex
    const userOrg = await ctx.runQuery(internal.orgs.get.getMyOrgInternal, {
      workosUserId,
    });

    if (!userOrg) {
      throw new ConvexError("No organization found");
    }

    // Initialize WorkOS
    const workos = new WorkOS(process.env.WORKOS_API_KEY);

    try {
      // Build update payload
      const updateData: any = {
        organization: userOrg.workosOrgId,
      };

      if (args.name) {
        updateData.name = args.name;
      }

      if (args.billingEmail !== undefined) {
        updateData.metadata = {
          billingEmail: args.billingEmail,
        };
      }

      // Update in WorkOS
      await workos.organizations.updateOrganization(updateData);

      // Sync to Convex
      await ctx.runMutation(internal.orgs.update.syncOrgUpdate, {
        orgId: userOrg._id,
        name: args.name,
        billingEmail: args.billingEmail,
      });

      return { success: true };
    } catch (error) {
      throw new ConvexError(
        error instanceof Error
          ? error.message
          : "Failed to update organization. Please try again."
      );
    }
  },
});
