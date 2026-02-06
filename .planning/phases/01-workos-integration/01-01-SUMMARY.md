# Plan 01-01: WorkOS SDK setup + org creation action

**Phase:** 01-workos-integration
**Status:** Complete
**Completed:** 2026-02-05

## What Was Built

WorkOS Node SDK integration with Convex action for real organization creation:

1. **WorkOS SDK Installation**: @workos-inc/node@8.1.0 installed and available for server-side actions
2. **Schema Update**: Added `billingEmail` field to orgs table for storing billing contact
3. **Org Creation Action**: `convex/workos/createOrg.ts` - Calls WorkOS API to create organizations
4. **Data Storage Mutation**: `convex/workos/storeOrg.ts` - Stores org data in Convex after WorkOS creation

## Implementation Details

### Files Created
- `convex/workos/createOrg.ts` - Main action with WorkOS API integration
- `convex/workos/storeOrg.ts` - Internal mutation for Convex storage

### Files Modified
- `package.json` - Added @workos-inc/node dependency
- `convex/schema.ts` - Added billingEmail field to orgs table

### Key Features
- Creates organization in WorkOS with billing email metadata
- Creates admin organization membership for current user
- Stores org data in Convex with free tier defaults (3 customers, 2 staff, 10 clients)
- Error handling with retry-friendly messages
- Uses "use node" directive for Node.js runtime access

## Commits

| Task | Commit | Files |
|------|--------|-------|
| Task 1: Install SDK and update schema | 35c3b08 | package.json, package-lock.json, convex/schema.ts |
| Task 2: Create WorkOS action | 5a679cb | convex/workos/createOrg.ts, convex/workos/storeOrg.ts |

## Verification

✓ @workos-inc/node@8.1.0 installed
✓ billingEmail field exists in orgs schema
✓ createOrganization action exports correctly
✓ storeOrg internal mutation exports correctly
✓ npx convex dev --once passes without errors
✓ Action includes error handling with retry messages

## Next Steps

This foundation enables:
- Plan 01-02: Wire onboarding form to call this action
- Plan 01-03: Settings page to display and update org data

## Notes

- Requires WORKOS_API_KEY environment variable in Convex
- WorkOS API calls wrapped in try/catch for graceful error handling
- Billing email stored in both WorkOS metadata and Convex for sync
