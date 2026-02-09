# Project State: iSaaSIT

**Last updated:** 2026-02-09

## Project Reference

See: .planning/PROJECT.md (updated 2025-02-04)

**Core value:** Agencies can spin up client projects with data isolation, billing, and role-based access
**Current focus:** Phase 2 In Progress — Staff Assignment Built

## Current Status

| Phase | Status | Progress |
|-------|--------|----------|
| 1 | ✓ Complete | 100% |
| 2 | In Progress | 2/6 plans |
| 3 | Pending | 0% |

**Overall:** 16/25 requirements complete (64%)

## Phase Status

### Phase 1: WorkOS Integration ✓
- **Status:** Complete (2026-02-09)
- **Requirements:** ORG-03 ✓, ORG-04 ✓
- **Verification:** 12/12 must-haves passed
- **Plans:** 01-01 ✓, 01-02 ✓, 01-03 ✓

### Phase 2: Team Management
- **Status:** In progress (3 of 6 plans complete)
- **Requirements:** TEAM-01 to TEAM-06, ASSIGN-02 ✓, ASSIGN-03 ✓, ASSIGN-04 ✓
- **Plans:** 02-01 ✓ (schema + invitation backend), 02-02 ✓ (staff assignment), 02-03 ✓ (webhook + user management)
- **Blockers:** None

### Phase 3: Billing
- **Status:** Not started
- **Requirements:** BILL-01 to BILL-06
- **Blockers:** Depends on Phase 2

## Recent Activity

- 2026-02-09: Plan 02-03 complete — WorkOS webhook handler (invitation.accepted) + user management backend (remove/restore/list)
- 2026-02-09: Plan 02-02 complete — Staff assignment mutations/queries + customer detail assignment UI
- 2026-02-09: Plan 02-01 complete — pendingInvitations schema, invitation actions (send/revoke/resend), soft-delete support
- 2026-02-09: Phase 1 verified — 12/12 must-haves passed
- 2026-02-09: Plan 01-03 complete — User verified settings page end-to-end
- 2026-02-06: Plan 01-03 at checkpoint — Settings page wired, awaiting verification
- 2026-02-06: Plan 01-02 complete — Onboarding form wired to WorkOS action

## Accumulated Context

### Decisions

| Decision | Phase | Rationale | Impact |
|----------|-------|-----------|--------|
| Manual HMAC webhook verification | 02-03 | Convex HTTP actions can't use "use node" | Web Crypto API for signature verification, pattern for all webhooks |
| Auto-unassign staff on removal | 02-03 | Prevent orphaned assignments | Staff assignments deleted when user removed, not restored on restore |
| Computed status field in user queries | 02-03 | Frontend needs active/removed distinction | listOrgMembers returns status based on deletedAt field |
| Self-removal prevention | 02-03 | Prevent admin lockout | removeUser throws error if targeting self |
| Admin-only assignment UI | 02-02 | Only admins should manage staff assignments per security model | Assignment card hidden from staff and client roles |
| Inline assignment UI on customer detail | 02-02 | Assignments are customer-scoped, most intuitive on customer page | No separate assignment management page needed |
| Prevent duplicate assignments at mutation level | 02-02 | Ensures data integrity, simpler than frontend checks | ConvexError thrown if duplicate assignment attempted |
| Separate internal.ts for queries/mutations in Convex | 02-01 | "use node" files can only contain actions | Pattern for all future WorkOS API integrations |
| Usage caps include pending invitations | 02-01 | Prevent race condition exceeding plan limits | All invitation enforcement checks active + pending counts |
| Client invitations require customerId | 02-01 | Data isolation requires customer assignment | Enforced in sendInvitation action |
| Resend = revoke + send (no native resend) | 02-01 | WorkOS SDK pattern | Standard for invitation lifecycle management |

### Pending Todos
1. Replace agency copy with generic workspace terminology (area: ui)
2. Configure WorkOS webhook endpoint for invitation.accepted events (area: workos-setup) - REQUIRED for invitation acceptance to work end-to-end

## Next Action

Continue Phase 2: Team Management — Plan 02-04 or later plans (team UI, staff-scoped data queries)

---
*State tracking initialized: 2025-02-04*
