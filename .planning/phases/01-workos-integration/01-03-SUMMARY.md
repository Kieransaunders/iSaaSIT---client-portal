# Plan 01-03: Settings page with live org data

**Phase:** 01-workos-integration
**Status:** Complete
**Completed:** 2026-02-09

## What Was Built

Settings page wired to real organization data with WorkOS sync:

1. **WorkOS Update Action**: `convex/workos/updateOrg.ts` - Updates org name/billing email in WorkOS and syncs to Convex
2. **Internal Query**: `convex/orgs/get.ts` - Added `getMyOrgInternal` for server-side org lookup
3. **Sync Mutation**: `convex/orgs/update.ts` - Internal mutation to patch org data in Convex
4. **Settings Page**: `src/routes/_authenticated/settings.tsx` - Live org data display with edit capability

## Implementation Details

### Files Created
- `convex/workos/updateOrg.ts` - Action that updates WorkOS org and syncs to Convex
- `convex/orgs/update.ts` - Internal mutation for syncing org updates

### Files Modified
- `convex/orgs/get.ts` - Added getMyOrgInternal internal query
- `src/routes/_authenticated/settings.tsx` - Wired to useQuery/useAction for live data

### Key Features
- Settings page loads real org data via useQuery
- Org name and billing email editable with change detection
- Save button disabled when no changes detected
- Changes sync to both WorkOS API and Convex
- Success/error feedback after save
- Loading spinner while org data loads

## Commits

| Task | Commit | Files |
|------|--------|-------|
| Task 1: Create WorkOS update org action | 1b12590 | convex/workos/updateOrg.ts, convex/orgs/get.ts, convex/orgs/update.ts |
| Task 2: Wire settings page to live org data | 59ed0fe | src/routes/_authenticated/settings.tsx |
| Task 3: Human verification | — | User tested end-to-end flow |

## Verification

✓ updateOrganization action exports correctly
✓ getMyOrgInternal internal query added to convex/orgs/get.ts
✓ syncOrgUpdate internal mutation exports correctly
✓ Settings page uses useQuery for org data
✓ Settings page uses useAction for updates
✓ Billing email field present in settings
✓ Change detection (hasChanges) implemented
✓ Human verification: end-to-end flow approved

## Notes

- Requires WORKOS_API_KEY environment variable in Convex
- Settings page preserves Notifications and Security cards as placeholders for future phases
