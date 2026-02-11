import { ConvexError, v } from "convex/values";
import { query } from "../_generated/server";
import { getEffectiveUser } from "../users/utils";

/**
 * Get the customer record for the current client user
 * Only works for users with role='client'
 */
export const getMyCustomer = query({
    args: {},
    handler: async (ctx) => {
        const user = await getEffectiveUser(ctx);

        if (!user) {
            return null;
        }

        // Only clients have a customerId
        if (user.role !== "client" || !user.customerId) {
            return null;
        }

        // Get the customer record
        const customer = await ctx.db.get('customers', user.customerId);
        return customer;
    },
});

/**
 * Get staff members assigned to the current client user's customer
 * Only works for users with role='client'
 */
export const getMyAssignedStaff = query({
    args: {},
    handler: async (ctx) => {
        const user = await getEffectiveUser(ctx);

        if (!user) {
            return [];
        }

        // Only clients have a customerId
        if (user.role !== "client" || !user.customerId) {
            return [];
        }

        // Get assignments for this customer
        const assignments = await ctx.db
            .query("staffCustomerAssignments")
            .withIndex("by_customer", (q) => q.eq("customerId", user.customerId!))
            .collect();

        // Get the staff user records
        const staffUsers = await Promise.all(
            assignments.map(async (assignment) => {
                const staffUser = await ctx.db.get('users', assignment.staffUserId);
                return staffUser;
            })
        );

        // Filter out any null values and return
        return staffUsers.filter((u) => u !== null);
    },
});
