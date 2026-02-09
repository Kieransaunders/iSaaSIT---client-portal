---
phase: 02-team-management
plan: 01
subsystem: api
tags: [workos, convex, invitations, user-management, team]

# Dependency graph
requires:
  - phase: 01-workos-integration
    provides: WorkOS organization creation, user sync, org storage in Convex
provides:
  - pendingInvitations table in Convex schema for tracking WorkOS invitations
  - Soft-delete support (deletedAt field) on users table
  - sendInvitation action with admin auth, usage cap enforcement, WorkOS API integration
  - revokeInvitation and resendInvitation actions for invitation lifecycle management
  - listPendingInvitations query for org-scoped invitation display
affects: [team-ui, invitation-acceptance, user-onboarding]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Convex internal.ts pattern: separate file for internal queries/mutations when 'use node' files need them"
    - "Usage cap enforcement: count existing + pending users before allowing new invitations"
    - "WorkOS invitation lifecycle: send → pending → accept OR revoke"

key-files:
  created:
    - convex/schema.ts (pendingInvitations table)
    - convex/invitations/send.ts
    - convex/invitations/manage.ts
    - convex/invitations/queries.ts
    - convex/invitations/internal.ts
  modified:
    - convex/schema.ts (added deletedAt to users, pendingInvitations table)

key-decisions:
  - "Separate internal.ts for queries/mutations: Node.js files ('use node') can only contain actions, so internal queries and mutations live in separate non-Node file"
  - "Usage caps enforce maxStaff/maxClients by counting existing active users + pending invitations"
  - "Client invitations require customerId - enforced via validation in sendInvitation action"
  - "Resend pattern: revoke old invitation + send new (no native resend in WorkOS SDK)"

patterns-established:
  - "Admin-only pattern: all invitation management requires role='admin' check before proceeding"
  - "Org isolation: all invitation queries/actions verify user's orgId matches resource's orgId"
  - "Internal helper pattern: shared queries/mutations in internal.ts for reuse across actions"

# Metrics
duration: 6min
completed: 2026-02-09
---

# Phase 02 Plan 01: Team Management Foundation Summary

**pendingInvitations table with soft-delete users, WorkOS invitation actions (send/revoke/resend) enforcing usage caps and admin-only access**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-09T12:58:05Z
- **Completed:** 2026-02-09T13:04:29Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Schema extended with pendingInvitations table (7 fields, 3 indexes) and soft-delete support (deletedAt on users)
- Send invitation action validates admin role, enforces maxStaff/maxClients caps, calls WorkOS API, stores pending invitation in Convex
- Revoke and resend invitation actions manage full invitation lifecycle via WorkOS API
- List pending invitations query returns org-scoped invitations with customer names enriched

## Task Commits

Each task was committed atomically:

1. **Task 1: Update schema with pendingInvitations table and soft-delete field** - `5d9e3b3` (feat)
2. **Task 2: Create invitation actions (send, revoke, resend) and query** - `b66c878` (feat)

## Files Created/Modified
- `convex/schema.ts` - Added pendingInvitations table (workosInvitationId, email, orgId, role, customerId, inviterUserId, createdAt, expiresAt) with by_org, by_workos_id, by_email_org indexes; added deletedAt optional field to users
- `convex/invitations/send.ts` - sendInvitation action: admin auth check, role validation (client requires customerId), usage cap enforcement (maxStaff/maxClients vs active + pending counts), WorkOS sendInvitation call, store pending in Convex
- `convex/invitations/manage.ts` - revokeInvitation action (WorkOS revoke + Convex delete), resendInvitation action (revoke old + send new + update Convex record)
- `convex/invitations/queries.ts` - listPendingInvitations query: admin-only, org-scoped, enriched with customer names
- `convex/invitations/internal.ts` - Internal helper queries (getUserRecord, getOrgUserCounts, getCustomer, getPendingInvitation) and mutations (storePendingInvitation, deletePendingInvitation, updatePendingInvitation)

## Decisions Made

**1. Separate internal.ts for queries and mutations**
- **Rationale:** Convex "use node" files (required for WorkOS SDK) can only contain actions. Internal queries and mutations needed by actions must live in separate non-Node file.
- **Pattern:** Actions in send.ts/manage.ts call helpers via `internal.invitations.internal.*`

**2. Usage cap enforcement includes pending invitations**
- **Rationale:** Prevent race condition where multiple invites sent before any accepted could exceed plan limits
- **Implementation:** Count active users (excluding deletedAt) + pending invitations per role, compare to org.maxStaff / org.maxClients

**3. Client invitations require customerId validation**
- **Rationale:** Client users must belong to a customer for data isolation
- **Implementation:** sendInvitation throws ConvexError if role="client" and customerId not provided or customer doesn't exist in org

**4. Resend implemented as revoke + send**
- **Rationale:** WorkOS SDK doesn't provide native resend method
- **Implementation:** resendInvitation action revokes old invitation in WorkOS, sends new one, updates Convex record with new workosInvitationId and expiresAt

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Convex auto-extraction of internal functions**
- **Issue:** Initially placed internal queries/mutations in send.ts ("use node" file), causing Convex deploy error: "Mutation/Query functions can't be defined in Node.js files"
- **Resolution:** Created internal.ts for all internal helpers. Convex also auto-generated mutations.ts and queries.ts during codegen, which contain duplicates but don't cause conflicts.
- **Impact:** Architecture is cleaner - internal.ts is single source of truth for shared helpers

## User Setup Required

**External services require manual configuration.** See plan frontmatter for:
- WorkOS webhook endpoint must be configured in WorkOS Dashboard -> Webhooks -> Create Webhook
- Endpoint URL for `invitation.accepted` events (to be implemented in future plan)
- Note: Webhook handling is not implemented in this plan - this is data foundation only

## Next Phase Readiness

**Ready for:**
- Team UI implementation (invite form, pending invitations table)
- Invitation acceptance webhook handler (to move pending → active users)
- Staff-customer assignment features (next phase)

**Notes:**
- Schema foundation complete - pendingInvitations table supports full invitation lifecycle
- Actions enforce business rules (admin-only, usage caps, org isolation)
- Soft delete (deletedAt) ready for user removal features
- WorkOS SDK integration patterns established for other user management features

---
*Phase: 02-team-management*
*Completed: 2026-02-09*
