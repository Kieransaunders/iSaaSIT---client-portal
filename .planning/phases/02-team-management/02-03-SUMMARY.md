---
phase: 02-team-management
plan: 03
subsystem: webhooks
tags: [workos, webhooks, convex, http-router, user-sync, team-management]

# Dependency graph
requires:
  - phase: 02-01
    provides: pendingInvitations schema, WorkOS invitation actions
  - phase: 01-workos-integration
    provides: WorkOS SDK integration patterns, org/user sync
provides:
  - WorkOS webhook endpoint at /webhooks/workos handling invitation.accepted events
  - User sync mutation creating/updating users from invitation data with role/customerId
  - User management mutations (removeUser, restoreUser) with soft delete
  - Org members query with active/removed status filtering
  - Member counts query for team page tab display
affects: [team-ui, invitation-lifecycle, user-management-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Convex httpRouter for webhook endpoints with signature verification"
    - "Web Crypto API for HMAC SHA-256 signature verification (non-Node HTTP actions)"
    - "Soft delete pattern: removeUser auto-unassigns staff assignments"
    - "Admin-only mutations with org isolation for user management"

key-files:
  created:
    - convex/http.ts
    - convex/users/sync.ts
    - convex/webhooks/workos.ts
    - convex/users/manage.ts
    - convex/users/queries.ts
  modified:
    - convex/invitations/internal.ts (added getPendingInvitationByWorkosId)
    - convex/orgs/get.ts (added getOrgByWorkosOrgId)

key-decisions:
  - "Web Crypto API for webhook verification: HTTP actions can't use 'use node', so manual HMAC SHA-256 verification instead of WorkOS SDK constructEvent"
  - "Auto-unassign on removal: removeUser automatically deletes all staff assignments for removed staff users"
  - "Status field in listOrgMembers: computed active/removed status for frontend filtering"

patterns-established:
  - "Webhook signature verification in non-Node HTTP actions using Web Crypto API"
  - "Soft delete with cascading cleanup (assignments auto-removed)"
  - "Admin-only user management with self-removal prevention"

# Metrics
duration: 4min
completed: 2026-02-09
---

# Phase 02 Plan 03: WorkOS Webhook & User Management Backend Summary

**WorkOS invitation.accepted webhook syncing users to Convex with role/customerId plus admin user management (remove, restore, list) with soft delete and auto-unassignment**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-09T13:10:27Z
- **Completed:** 2026-02-09T13:14:30Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- WorkOS webhook endpoint registered at /webhooks/workos via Convex httpRouter
- Webhook verifies HMAC SHA-256 signature using Web Crypto API (non-Node HTTP action pattern)
- invitation.accepted event handler syncs user to Convex with correct role and customerId from pending invitation
- Pending invitation automatically cleaned up after successful user sync
- Admin user management: removeUser soft-deletes (sets deletedAt) and auto-unassigns staff assignments
- restoreUser clears deletedAt to restore removed users
- listOrgMembers returns all org users with computed status (active/removed) and displayName
- getOrgMemberCounts provides per-role counts for team page tab display

## Task Commits

Each task was committed atomically:

1. **Task 1: Create WorkOS webhook handler and user sync mutation** - `da80294` (feat)
2. **Task 2: Create user management mutations and org members query** - `68d4b6e` (feat)

## Files Created/Modified

- `convex/http.ts` - HTTP router registering POST /webhooks/workos endpoint
- `convex/users/sync.ts` - syncFromInvitation internal mutation creates/updates user with invitation data; deletePendingInvitationByWorkosId cleans up pending invitation
- `convex/webhooks/workos.ts` - HTTP action handling WorkOS webhooks with manual HMAC SHA-256 signature verification, processes invitation.accepted events
- `convex/users/manage.ts` - removeUser (soft delete + auto-unassign) and restoreUser mutations, admin-only with org isolation
- `convex/users/queries.ts` - listOrgMembers (all users with status field) and getOrgMemberCounts (per-role counts) queries, admin-only
- `convex/invitations/internal.ts` - Added getPendingInvitationByWorkosId internal query for webhook lookup
- `convex/orgs/get.ts` - Added getOrgByWorkosOrgId internal query for webhook org lookup
- `convex/_generated/api.d.ts` - Auto-generated API types updated

## Decisions Made

**1. Manual HMAC verification instead of WorkOS SDK**
- **Rationale:** Convex HTTP actions cannot use "use node" directive (error: "Only actions can be defined in Node.js"). WorkOS SDK's constructEvent requires Node runtime.
- **Implementation:** Manual HMAC SHA-256 signature verification using Web Crypto API. WorkOS signature format: `t=timestamp,v1=signature`, signed payload: `timestamp.body`.
- **Pattern:** Established for all future webhook handlers in Convex (non-Node HTTP actions with manual crypto).

**2. Auto-unassign staff on removal**
- **Rationale:** When staff user is removed, their customer assignments become stale. Auto-cleanup prevents orphaned assignments.
- **Implementation:** removeUser mutation queries staffCustomerAssignments by by_staff index, deletes all assignments if target is staff role.
- **Future impact:** Restore action does NOT re-create assignments - admin must manually re-assign after restore.

**3. Computed status field in listOrgMembers**
- **Rationale:** Frontend needs active/removed distinction for filtering/display. Computing at query time avoids schema change.
- **Implementation:** Returns enriched user objects with `status: "active" | "removed"` based on deletedAt field presence.

**4. Self-removal prevention**
- **Rationale:** Admin removing themselves could lock out organization if they're the only admin.
- **Implementation:** removeUser throws ConvexError "Cannot remove yourself" if target userId matches current user.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Convex HTTP action Node.js restriction**
- **Issue:** Initial implementation used `"use node"` directive in webhooks/workos.ts to use WorkOS SDK's constructEvent method. Convex deployment failed: "Only actions can be defined in Node.js."
- **Resolution:** Refactored to non-Node HTTP action with manual HMAC SHA-256 verification using Web Crypto API. Signature format parsed from `workos-signature` header (t=timestamp,v1=signature), compared against computed HMAC of `timestamp.body`.
- **Impact:** Pattern established for all future webhook handlers in Convex - manual crypto verification instead of SDK helpers.

## User Setup Required

**External services require manual configuration.**

**WorkOS webhook endpoint configuration:**

1. Navigate to WorkOS Dashboard → Webhooks → Create Webhook
2. Set endpoint URL to: `https://[your-convex-deployment].convex.cloud/webhooks/workos`
   - Get deployment URL from Convex dashboard or `npx convex dashboard`
3. Select event: `invitation.accepted`
4. Copy the webhook signing secret
5. Add to environment variables:
   ```bash
   WORKOS_WEBHOOK_SECRET=<secret>
   ```
6. Deploy to Convex: `npx convex deploy`

**Verification:**
- Send a test invitation via WorkOS dashboard or app
- Check Convex logs for "Successfully synced user [email] from invitation acceptance"
- Query users table - invited user should appear with correct role and customerId
- Pending invitation should be deleted

## Next Phase Readiness

**Ready for:**
- Team UI implementation (team page listing all members with remove/restore actions)
- Invitation acceptance end-to-end flow now complete (send → accept webhook → user synced)
- User management features (admin can manage team lifecycle)

**Notes:**
- Webhook endpoint must be configured in WorkOS dashboard before invitations work end-to-end
- WORKOS_WEBHOOK_SECRET environment variable required for signature verification
- Removed users excluded from standard queries but available via listOrgMembers for restore
- Staff assignments auto-removed on user removal, not auto-restored on restore (manual re-assignment required)

**No blockers for next plan.**

---
*Phase: 02-team-management*
*Completed: 2026-02-09*
