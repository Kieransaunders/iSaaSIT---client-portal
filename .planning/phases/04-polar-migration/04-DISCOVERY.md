# Discovery: Polar Migration

## Goal

Replace Lemon Squeezy billing with Polar while preserving the existing Convex + TanStack Start + WorkOS architecture, and make setup easy for future developers.

## Key Findings

- Use the Convex Polar component (`@convex-dev/polar`) for subscription state and webhooks.
- Register Polar webhooks via `polar.registerRoutes(http)` at `/polar/events` in `convex/http.ts`.
- Map product keys to Polar product IDs in `convex/polar.ts` to keep plans stable.
- Prefer Polar component APIs (`generateCheckoutLink`, `generateCustomerPortalUrl`, `getCurrentSubscription`) over custom REST calls.
- Replace Lemon Squeezy env vars with `POLAR_ORGANIZATION_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_SERVER` in Convex, plus local app hints.

## Migration Notes

- Remove `@lemonsqueezy/lemonsqueezy.js` and delete `convex/lemonsqueezy/*`.
- Update billing queries/actions to call Polar APIs and use product-key-based limits.
- Update docs, README, env examples, and deployment notes to reflect Polar setup steps.

## References

- https://www.convex.dev/components/polar
- https://polar.sh/docs
