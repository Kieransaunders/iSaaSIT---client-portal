import type { QueryCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

/**
 * Resolves the "effective" user. 
 * If an admin is impersonating another user, returns the impersonated user's record.
 * Otherwise returns the record for the actual authenticated user.
 */
export async function getEffectiveUser(ctx: QueryCtx): Promise<Doc<"users"> | null> {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        return null;
    }

    // Find the actual user record
    const actualUser = await ctx.db
        .query("users")
        .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", identity.subject))
        .unique();

    if (!actualUser) {
        return null;
    }

    // If this is an admin and they are impersonating someone, resolve the target
    if (actualUser.role === "admin" && actualUser.impersonatingUserId) {
        const impersonatedUser = await ctx.db.get('users', actualUser.impersonatingUserId);
        if (impersonatedUser) {
            return impersonatedUser;
        }
    }

    return actualUser;
}
