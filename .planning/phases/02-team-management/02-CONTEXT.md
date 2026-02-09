# Phase 2: Team Management - Context

**Gathered:** 2026-02-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Invite staff and client users to the org, manage org membership, and assign staff to customers. Users receive email invites, sign up via WorkOS, and land in the org with the correct role. Admin can view, remove, and restore members. Staff assignment to customers is managed from customer detail.

</domain>

<decisions>
## Implementation Decisions

### Invite flow
- Single invite form (one email + role at a time, no bulk)
- Two role options: Staff or Client (admin is implicit — org creator only)
- When "Client" role is selected, a customer dropdown appears to link the client
- Pending invites are visible on the team page with status badge
- Admin can resend or revoke pending invites

### Team page layout
- Table/list format with columns: name, email, role, status, joined date
- Tabs for segmentation: All | Staff | Clients | Pending
- Pending tab shows invites that haven't been accepted yet

### Removal & edge cases
- Soft delete: removed users are marked inactive, can't log in, but data preserved
- Confirmation dialog before removal ("Are you sure you want to remove [name]?")
- Removed users can be restored by admin — preserves history and assignments

### Claude's Discretion
- Invite button placement (top-right vs contextual per tab)
- Staff unassignment behavior on removal (auto-unassign vs block until manually unassigned)
- Exact table styling and empty state design
- Invite email content and delivery method (WorkOS email vs Resend)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-team-management*
*Context gathered: 2026-02-09*
