import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Organizations - synced from WorkOS, extended with subscription data
  orgs: defineTable({
    // WorkOS organization ID (primary identifier)
    workosOrgId: v.string(),
    // Organization name (from WorkOS)
    name: v.string(),
    // Billing email (stored in WorkOS metadata)
    billingEmail: v.optional(v.string()),
    // Subscription data from Lemon Squeezy
    subscriptionId: v.optional(v.string()),
    subscriptionStatus: v.optional(v.union(
      v.literal("inactive"),
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("past_due"),
      v.literal("unpaid"),
      v.literal("paused")
    )),
    planId: v.optional(v.string()),
    // Usage caps from plan metadata
    maxCustomers: v.number(),
    maxStaff: v.number(),
    maxClients: v.number(),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workos_org_id", ["workosOrgId"])
    .index("by_subscription_id", ["subscriptionId"]),

  // Customers - client companies managed by an org
  customers: defineTable({
    orgId: v.id("orgs"),
    name: v.string(),
    email: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_org_name", ["orgId", "name"]),

  // User profiles - extends WorkOS user data with app-specific fields
  users: defineTable({
    // WorkOS user ID
    workosUserId: v.string(),
    // Organization membership
    orgId: v.optional(v.id("orgs")),
    // Role: Admin, Staff, or Client
    role: v.optional(v.union(
      v.literal("admin"),
      v.literal("staff"),
      v.literal("client")
    )),
    // For Client users: which customer they belong to
    customerId: v.optional(v.id("customers")),
    // Profile data (synced from WorkOS)
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    profilePictureUrl: v.optional(v.string()),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workos_user_id", ["workosUserId"])
    .index("by_org", ["orgId"])
    .index("by_org_role", ["orgId", "role"])
    .index("by_customer", ["customerId"]),

  // Staff-Customer assignments - maps staff to customers they can access
  staffCustomerAssignments: defineTable({
    staffUserId: v.id("users"),
    customerId: v.id("customers"),
    orgId: v.id("orgs"),
    createdAt: v.number(),
  })
    .index("by_staff", ["staffUserId"])
    .index("by_customer", ["customerId"])
    .index("by_org", ["orgId"])
    // Prevent duplicate assignments
    .index("by_staff_customer", ["staffUserId", "customerId"]),

  // Temporary: Keep numbers table from template until fully migrated
  numbers: defineTable({
    value: v.number(),
  }),
});
