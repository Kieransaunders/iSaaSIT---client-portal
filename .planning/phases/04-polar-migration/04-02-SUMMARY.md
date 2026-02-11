---
phase: 04-polar-migration
plan: 02
subsystem: payments
tags: [polar, convex, billing, docs, react]

# Dependency graph
requires:
  - phase: 04-01
    provides: Polar backend integration and webhook wiring
provides:
  - Polar billing UI and documentation aligned with Polar setup
  - Checkout flow mapped to configured Polar product IDs
affects: [billing, docs, setup, frontend]

# Tech tracking
tech-stack:
  added: ['@convex-dev/polar@^0.7.3']
  patterns: ['Map product keys to Polar product IDs via configured products query']

key-files:
  created: []
  modified:
    - src/routes/_authenticated/billing.tsx
    - src/routes/_authenticated/tools.tsx
    - src/components/billing/UpgradeButton.tsx
    - src/config/billing.ts
    - convex/polar.ts
    - convex/billing/queries.ts
    - README.md
    - docs/src/content/docs/features/billing.mdx
    - DEPLOYMENT.md
    - .env.local.example
    - package.json
    - package-lock.json

key-decisions:
  - 'Use Polar configured products to resolve product IDs client-side for checkout'
  - 'Prefer org.trialEndsAt when computing trial status'

patterns-established:
  - 'Billing checkout uses Polar generateCheckoutLink with product IDs'

# Metrics
duration: 10min
completed: 2026-02-11
---

# Phase 04 Plan 02: Polar Migration Summary

**Polar billing UI and docs aligned with new provider, with checkout now driven by configured product IDs.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-11T10:11:05Z
- **Completed:** 2026-02-11T10:21:25Z
- **Tasks:** 2
- **Files modified:** 33

## Accomplishments

- Updated billing UI and tools page to use Polar APIs and product keys
- Replaced Lemon Squeezy references across README, docs, and planning metadata
- Stabilized Polar integration with current package version and codegen updates

## Task Commits

Each task was committed atomically:

1. **Task 1: Update billing UI and tools checks for Polar** - `8826831` (feat)
2. **Task 2: Replace Lemon Squeezy references across docs and planning metadata** - `f281ec0` (docs)

**Plan metadata:** `e3366bb` (fix: stabilize Polar integration)

## Files Created/Modified

- `src/routes/_authenticated/billing.tsx` - Polar subscription display and checkout UI
- `src/components/billing/UpgradeButton.tsx` - Checkout initiation using configured product IDs
- `src/config/billing.ts` - Polar plan configuration and product keys
- `convex/polar.ts` - Polar client wiring and current subscription query
- `convex/billing/queries.ts` - Trial and subscription status logic
- `README.md` - Polar setup guidance
- `docs/src/content/docs/features/billing.mdx` - Polar billing documentation
- `DEPLOYMENT.md` - Polar webhook deployment steps
- `.env.local.example` - Polar env var examples
- `package.json` - Polar dependency version update

## Decisions Made

- Use Polar configured products to resolve product IDs for checkout, keeping plan config keyed by productKey.
- Prefer org.trialEndsAt for trial calculations, falling back to subscription period end.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated Polar dependency to a published version**

- **Found during:** Task 1 (lint verification)
- **Issue:** `@convex-dev/polar@^0.1.0` not found in registry
- **Fix:** Bumped to `@convex-dev/polar@^0.7.3` and reinstalled dependencies
- **Files modified:** package.json, package-lock.json
- **Verification:** `npm run lint` (still fails due to pre-existing repo issues)
- **Committed in:** e3366bb

**2. [Rule 3 - Blocking] Resolved Polar codegen type errors**

- **Found during:** Task 1 (Convex codegen)
- **Issue:** Missing current subscription query and incompatible trial field
- **Fix:** Added `getCurrentSubscription` query and aligned trial calculation with org metadata
- **Files modified:** convex/polar.ts, convex/billing/queries.ts, convex/\_generated/api.d.ts
- **Verification:** `npx convex codegen`
- **Committed in:** e3366bb

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Required to complete lint/codegen verification. No scope creep.

## Issues Encountered

- `npm run lint` fails due to existing repo-wide ESLint configuration issues unrelated to this plan (e.g., linting `.claude` scripts and generated docs types).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- UI and docs are aligned with Polar; backend types are updated.
- Lint baseline should be addressed separately to restore `npm run lint` pass status.

---

_Phase: 04-polar-migration_
_Completed: 2026-02-11_

## Self-Check: PASSED
