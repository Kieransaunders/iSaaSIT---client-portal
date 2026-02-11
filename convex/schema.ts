import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // Organizations - synced from WorkOS, extended with subscription data
  orgs: defineTable({
    // WorkOS organization ID (primary identifier)
    workosOrgId: v.string(),
    // Organization name (from WorkOS)
    name: v.string(),
    // Billing email (stored in WorkOS metadata)
    billingEmail: v.optional(v.string()),
    // Subscription data from billing provider
    subscriptionId: v.optional(v.string()),
    subscriptionStatus: v.optional(
      v.union(
        v.literal('inactive'),
        v.literal('active'),
        v.literal('trialing'),
        v.literal('cancelled'),
        v.literal('past_due'),
        v.literal('unpaid'),
        v.literal('paused'),
      ),
    ),
    planId: v.optional(v.string()),
    // Trial end timestamp (for UI display of trial status)
    trialEndsAt: v.optional(v.number()),
    // Subscription end timestamp (set when cancelled, access until this date)
    endsAt: v.optional(v.number()),
    // Usage caps from plan metadata
    maxCustomers: v.number(),
    maxStaff: v.number(),
    maxClients: v.number(),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_workos_org_id', ['workosOrgId'])
    .index('by_subscription_id', ['subscriptionId']),

  // Customers - client companies managed by an org
  customers: defineTable({
    orgId: v.id('orgs'),
    name: v.string(),
    email: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_org', ['orgId'])
    .index('by_org_name', ['orgId', 'name']),

  // User profiles - extends WorkOS user data with app-specific fields
  users: defineTable({
    // WorkOS user ID
    workosUserId: v.string(),
    // Organization membership
    orgId: v.optional(v.id('orgs')),
    // Role: Admin, Staff, or Client
    role: v.optional(v.union(v.literal('admin'), v.literal('staff'), v.literal('client'))),
    // For Client users: which customer they belong to
    customerId: v.optional(v.id('customers')),
    // For Admin users: which user they are currently acting as
    impersonatingUserId: v.optional(v.id('users')),
    // Profile data (synced from WorkOS)
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    profilePictureUrl: v.optional(v.string()),
    // Soft delete support
    deletedAt: v.optional(v.number()),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_workos_user_id', ['workosUserId'])
    .index('by_org', ['orgId'])
    .index('by_org_role', ['orgId', 'role'])
    .index('by_customer', ['customerId']),

  // Staff-Customer assignments - maps staff to customers they can access
  staffCustomerAssignments: defineTable({
    staffUserId: v.id('users'),
    customerId: v.id('customers'),
    orgId: v.id('orgs'),
    createdAt: v.number(),
  })
    .index('by_staff', ['staffUserId'])
    .index('by_customer', ['customerId'])
    .index('by_org', ['orgId'])
    // Prevent duplicate assignments
    .index('by_staff_customer', ['staffUserId', 'customerId']),

  // Pending invitations - tracks invitations sent via WorkOS
  pendingInvitations: defineTable({
    // WorkOS invitation ID
    workosInvitationId: v.string(),
    // Invited user's email
    email: v.string(),
    // Organization this invitation belongs to
    orgId: v.id('orgs'),
    // Role being invited
    role: v.union(v.literal('staff'), v.literal('client')),
    // For client invites: which customer they'll belong to
    customerId: v.optional(v.id('customers')),
    // User who sent the invitation
    inviterUserId: v.id('users'),
    // Timestamps
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index('by_org', ['orgId'])
    .index('by_workos_id', ['workosInvitationId'])
    .index('by_email_org', ['email', 'orgId']),

  // Temporary: Keep numbers table from template until fully migrated
  numbers: defineTable({
    value: v.number(),
  }),
});
