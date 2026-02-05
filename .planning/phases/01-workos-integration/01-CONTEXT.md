# Phase 1: WorkOS Integration - Context

**Gathered:** 2025-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace mock org ID with real WorkOS API integration. Users create organizations during signup with WorkOS API calls, view org settings, and update org information. Data syncs between Convex and WorkOS.

</domain>

<decisions>
## Implementation Decisions

### Org creation timing
- Org creation happens **during initial signup** (combined flow)
- User completes account creation → immediately creates their first org → enters dashboard
- Not a separate post-login step

### Information collected
- **Org name** (required)
- **Billing email** (required)
- Logo and other metadata can be added later in settings
- Minimal friction during signup while capturing essential billing info

### Error handling
- **Fail with retry option** when WorkOS API fails
- Show clear error message to user
- Provide retry button (don't proceed to dashboard with failed org creation)
- No fallback to mock IDs or background sync queuing

### Claude's Discretion
- UX pattern (multi-step wizard vs single form vs post-signup modal)
- Loading state design during WorkOS API call
- Exact error message wording and styling
- Field validation patterns (email format, org name constraints)

</decisions>

<specifics>
## Specific Ideas

- **Target use case:** Starter repo for SaaS developer agencies
- **WorkOS tier:** Should work with free WorkOS account (document any tier requirements)
- **Authentication:** Login functionality needs to work (though auth implementation is separate from org creation scope)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-workos-integration*
*Context gathered: 2025-02-05*
