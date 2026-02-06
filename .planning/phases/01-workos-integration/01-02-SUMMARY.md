---
phase: 01-workos-integration
plan: 02
name: "Wire onboarding form to WorkOS action"
status: complete
subsystem: frontend-auth
tags: [workos, onboarding, form, ui]

requires:
  - plans: ["01-01"]
    reason: "Uses WorkOS action created in previous plan"

provides:
  - capability: "Real org creation via WorkOS during onboarding"
  - capability: "Billing email collection at signup"
  - capability: "Error handling with retry UI"

affects:
  - plan: "01-03"
    impact: "Settings page will display org data created here"

tech-stack:
  added: []
  patterns:
    - "TanStack Router + Convex action pattern"
    - "Form validation with email format check"
    - "Error retry UI pattern"

key-files:
  created: []
  modified:
    - path: "src/routes/onboarding.tsx"
      purpose: "Onboarding form with WorkOS integration"
      contains: ["billingEmail", "useAction", "api.workos.createOrg"]

decisions:
  - what: "Pre-populate billing email from user email"
    why: "Better UX - most agencies use same email for both"
    context: "Using user?.email with optional chaining for safety"

  - what: "Add retry button in error alert"
    why: "WorkOS API calls may fail due to network/auth issues"
    context: "Button re-triggers form submission without page refresh"

duration: "1.5 minutes"
completed: 2026-02-06
---

# Phase 01 Plan 02: Wire onboarding form to WorkOS action Summary

**One-liner:** Onboarding form now creates real WorkOS orgs with billing email, replacing mock ID generation

## What Was Built

Integrated the onboarding form with the WorkOS organization creation action from Plan 01-01:

1. **Billing Email Collection**: Added billing email field to onboarding form, pre-populated from user's email
2. **WorkOS Action Integration**: Replaced mock org ID generation with real WorkOS API call via Convex action
3. **Error Handling with Retry**: Added retry button in error alert for failed submissions
4. **Form Validation**: Enhanced validation to require both org name and valid email format

## Implementation Details

### Task 1: Add billing email field to onboarding

**Files Modified:**
- `src/routes/onboarding.tsx` - Added billing email state and input field

**Key Changes:**
- Added `billingEmail` state initialized with `user?.email || ''` (optional chaining for safety)
- Added billing email input field with `type="email"` and required attribute
- Added helper text: "Invoices and billing notifications will be sent here"
- Enhanced form validation to check both `orgName.trim()` and `billingEmail.trim()`
- Added basic email format validation (must contain @)

**Commit:** fe480a9

### Task 2: Wire form to WorkOS action with retry

**Files Modified:**
- `src/routes/onboarding.tsx` - Replaced mutation with action, removed mock ID

**Key Changes:**
- Changed import from `useMutation` to `useAction`
- Replaced `createOrgInConvex` mutation with `api.workos.createOrg.createOrganization` action
- Removed mock WorkOS org ID generation code entirely
- Updated `handleCreateOrg` to call action with `name` and `billingEmail` parameters
- Added retry button in error Alert with `onClick={handleCreateOrg}` and disabled state during loading
- Maintained success state with 1.5s delay before redirect to dashboard

**Commit:** b2be465

### Technical Patterns Established

1. **TanStack Router + Convex Action Pattern**
   - Form submission calls Convex action (not mutation)
   - Action handles WorkOS API communication
   - UI shows loading/success/error states

2. **Form Validation Strategy**
   - Pre-submission: Check required fields and email format
   - Post-submission: Display WorkOS API errors with retry option
   - Button disabled during loading and when fields invalid

3. **Error Recovery UX**
   - Errors displayed in Alert component
   - Retry button appears in error state
   - Button disabled while operation in progress

## Verification Results

All verification checks passed:

- ✓ `grep billingEmail src/routes/onboarding.tsx` shows state and usage
- ✓ `grep user?.email src/routes/onboarding.tsx` confirms optional chaining
- ✓ `grep type="email" src/routes/onboarding.tsx` shows proper input type
- ✓ `grep useAction src/routes/onboarding.tsx` shows import and usage
- ✓ `grep mockWorkosOrgId src/routes/onboarding.tsx` returns empty (removed)
- ✓ `grep createOrganization src/routes/onboarding.tsx` shows action call
- ✓ `grep "Try Again" src/routes/onboarding.tsx` shows retry button
- ✓ `npx tsc --noEmit` passes with no errors

## Success Criteria

All criteria met:

- ✓ Onboarding form has org name AND billing email fields
- ✓ Billing email pre-populated from `user?.email` with optional chaining
- ✓ Form submission calls WorkOS action (not mutation with mock ID)
- ✓ Error display includes clear retry option
- ✓ Success redirects to dashboard
- ✓ No TypeScript errors

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Task | Commit  | Message                                              |
| ---- | ------- | ---------------------------------------------------- |
| 1    | fe480a9 | feat(01-02): add billing email field to onboarding form |
| 2    | b2be465 | feat(01-02): wire onboarding form to WorkOS action with retry |

## Next Phase Readiness

**Ready for Plan 01-03:** Settings page implementation

**What's available:**
- Working onboarding flow that creates real WorkOS orgs
- Org data stored in Convex with billing email
- User can complete signup and reach dashboard

**What Plan 01-03 needs:**
- Display org name and billing email in settings
- Allow editing of org name and billing email
- Call WorkOS API to update org data

**No blockers or concerns.**

## Notes

- The optional chaining `user?.email` ensures safe access even if user object or email is undefined
- The retry button re-triggers the form submission handler without page refresh
- The 1.5s success delay before redirect gives users visual confirmation of success
- TypeScript validation passed without errors, confirming type safety
