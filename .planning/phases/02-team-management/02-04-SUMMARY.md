---
phase: 02-team-management
plan: 04
subsystem: ui
tags: [team-ui, react, tanstack-router, convex-react, invitations, user-management]

# Dependency graph
requires:
  - phase: 02-01
    provides: pendingInvitations schema, invitation actions (send/revoke/resend)
  - phase: 02-03
    provides: User management mutations (remove/restore), org members query, member counts
provides:
  - Team page with tabbed interface (All/Staff/Clients/Pending)
  - InviteDialog component with role picker and conditional customer dropdown
  - TeamTable component with remove/restore actions and confirmation
  - PendingTable component with resend/revoke actions
  - Complete admin UI for team and invitation management
affects: [team-workflow, onboarding-flow, user-experience]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Tabbed data filtering: single data source (listOrgMembers), client-side filtering per tab"
    - "Confirmation dialogs for destructive actions: AlertDialog before user removal"
    - "Conditional form fields: customer dropdown only visible when role === 'client'"
    - "Loading states: Skeleton components while queries resolve"

key-files:
  created:
    - src/components/team/invite-dialog.tsx
    - src/components/team/team-table.tsx
  modified:
    - src/routes/_authenticated/team.tsx (complete rewrite from placeholder)

key-decisions:
  - "Client-side tab filtering: Query all members once, filter by role/status in component for better UX"
  - "Separate TeamTable and PendingTable: Different data shapes (users vs invitations) require distinct components"
  - "Inline error handling: Catch async errors in handlers, log to console (future: toast notifications)"

patterns-established:
  - "Dialog-based forms: InviteDialog pattern for modal forms with validation and submission"
  - "Table with inline actions: TeamTable shows contextual actions (remove/restore) based on user status"
  - "Confirmation before destructive actions: User removal requires AlertDialog confirmation"

# Metrics
duration: 2min
completed: 2026-02-09
---

# Phase 02 Plan 04: Team Management UI Summary

**Full team page with tabbed member table (All/Staff/Clients/Pending), invite dialog with role picker and conditional customer dropdown, and comprehensive member management actions**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-09T13:18:47Z
- **Completed:** 2026-02-09T13:20:49Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Team page completely rewritten from placeholder to functional admin interface
- InviteDialog component collects email, role (staff/client), and optional customer (required for clients)
- TeamTable component displays org members with name, email, role, status badges, join date, and action buttons
- PendingTable component shows pending invitations with email, role, customer, sent date, expiration, and actions
- Tabbed interface filters members by role (All/Staff/Clients) and shows pending invitations separately
- Tab counts dynamically update based on backend data (totalActive, staffCount, clientCount, pendingCount)
- Remove user action requires confirmation dialog before executing
- Restore user action re-activates soft-deleted users
- Resend invitation revokes old and sends new invitation
- Revoke invitation cancels pending invitation
- Loading states handled with skeleton components
- Empty states for each tab with helpful messages

## Task Commits

Each task was committed atomically:

1. **Task 1: Create InviteDialog and TeamTable components** - `dc927d9` (feat)
2. **Task 2: Rewrite team page with tabs and wire to backend** - `44b885d` (feat)

## Files Created/Modified

- `src/components/team/invite-dialog.tsx` - Dialog component with form (email input, role select, conditional customer select). Validates email format and client role requirements. Calls `api.invitations.send.sendInvitation` action. Shows error alerts on failure. Resets form on success/cancel.
- `src/components/team/team-table.tsx` - Two exports: TeamTable (displays active/removed users with name, email, role badge, status badge, join date, remove/restore buttons) and PendingTable (displays pending invitations with email, role, customer, dates, resend/revoke buttons). Empty states with icons. AlertDialog for removal confirmation.
- `src/routes/_authenticated/team.tsx` - Complete rewrite. Uses Tabs component with 4 tabs. Queries: listOrgMembers, getOrgMemberCounts, listPendingInvitations. Mutations: removeUser, restoreUser. Actions: revokeInvitation, resendInvitation. Client-side filtering for staff/client tabs. Handler functions with error logging. Loading state with skeletons. Invite button opens InviteDialog.

## Decisions Made

**1. Client-side tab filtering instead of separate backend queries**
- **Rationale:** Single listOrgMembers query returns all users with status field. Client-side filtering by role/status provides instant tab switching without extra network requests.
- **Implementation:** `allActiveMembers`, `staffMembers`, `clientMembers` derived by filtering `members` array.
- **Future impact:** If org has 1000+ users, may need server-side pagination and filtering.

**2. Separate TeamTable and PendingTable components**
- **Rationale:** Users and invitations have different data shapes and actions. Combining into one table would require complex conditionals.
- **Implementation:** TeamTable accepts `TeamMember[]` with remove/restore callbacks. PendingTable accepts `PendingInvitation[]` with resend/revoke callbacks.
- **Pattern:** Specialized table components for different data types.

**3. Inline error handling with console.error (not toasts)**
- **Rationale:** Toast notification system not yet implemented. Console logging allows debugging without blocking UI.
- **Implementation:** All async handlers wrapped in try/catch, errors logged to console.
- **Future impact:** Replace console.error with toast notifications in future plan.

**4. Confirmation dialog only for user removal (not revoke)**
- **Rationale:** Removing a user is more permanent and impactful than revoking an invitation. User loses access to data, assignments are deleted.
- **Implementation:** AlertDialog shown before removeUser mutation. Revoke/resend actions execute immediately.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all APIs were stable and component integration was straightforward.

## User Setup Required

**No external services require manual configuration.**

**Testing the UI:**

1. Navigate to `/team` in the app
2. Click "Invite Member" to open invite dialog
3. Fill email, select role (staff or client)
4. If client role, select a customer from dropdown
5. Click "Send Invite" to send invitation
6. Check "Pending" tab to see pending invitation
7. Click "Resend" or "Revoke" to manage invitation
8. Once invitation accepted (via webhook), user appears in appropriate tab
9. Click "Remove" on active user (requires confirmation)
10. User moves to "Removed" status (still visible in All tab)
11. Click "Restore" on removed user to re-activate

**Note:** Actual invitation acceptance requires WorkOS webhook to be configured (completed in Plan 02-03).

## Next Phase Readiness

**Ready for:**
- Phase 2 verification checkpoint (Plan 02-05)
- End-to-end team management workflow fully functional
- Phase 3: Billing integration can now reference team size for plan limits

**Notes:**
- Team management UI complete - admins can manage full user lifecycle
- Invitation flow end-to-end: send → pending → accept (webhook) → active
- Soft delete pattern allows user restoration without data loss
- Tab counts provide visibility into team composition at a glance

**No blockers for next plan.**

---
*Phase: 02-team-management*
*Completed: 2026-02-09*
