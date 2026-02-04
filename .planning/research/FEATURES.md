# Features Research: Multi-Tenant Agency SaaS Starter

## Table Stakes (Must Have)

These features are expected. Users will leave without them.

### Authentication & Authorization
| Feature | Complexity | Notes |
|---------|------------|-------|
| Email/password login | Low | WorkOS handles |
| OAuth providers (Google, GitHub) | Low | WorkOS config |
| Email verification | Low | WorkOS handles |
| Password reset | Low | WorkOS handles |
| Session persistence | Low | WorkOS + Convex JWT |
| Protected routes | Low | Already implemented |

### Organization Management
| Feature | Complexity | Notes |
|---------|------------|-------|
| Create organization post-signup | Medium | WorkOS API + Convex sync |
| Organization settings page | Low | Basic CRUD |
| Invite users to org | Medium | WorkOS invitations |
| Remove users from org | Low | WorkOS API |
| View org members | Low | WorkOS + Convex query |

### Role-Based Access
| Feature | Complexity | Notes |
|---------|------------|-------|
| Admin/Staff/Client roles | Medium | WorkOS roles + Convex scoping |
| Role assignment UI | Low | Admin-only |
| Data scoping by role | High | Critical for security |
| UI guards by role | Medium | Conditional rendering |

### Billing
| Feature | Complexity | Notes |
|---------|------------|-------|
| View current plan | Low | Read from Convex |
| Upgrade via checkout | Medium | Lemon Squeezy redirect |
| Cancel subscription | Low | Lemon Squeezy portal |
| Usage cap display | Low | Read from org record |
| Cap enforcement | Medium | Check before create |

### Customer Management (Agency-Specific)
| Feature | Complexity | Notes |
|---------|------------|-------|
| Create customer record | Low | Basic CRUD |
| Edit customer details | Low | Basic CRUD |
| Delete customer | Low | Cascade considerations |
| List customers (scoped) | Medium | Role-based filtering |
| Assign staff to customer | Medium | StaffCustomerAssignment |

## Differentiators (Competitive Advantage)

These make the starter stand out.

| Feature | Complexity | Value | Notes |
|---------|------------|-------|-------|
| Client portal | Medium | High | Clients log in, see their data |
| Staff assignment UI | Medium | High | Drag-drop or multi-select |
| Onboarding wizard | Medium | Medium | Guided first-time setup |
| Activity feed | Medium | Medium | Who did what when |
| Email notifications | Medium | Medium | Resend + React Email |
| Dark mode | Low | Low | Tailwind + shadcn |
| Mobile-responsive | Low | High | CSS only |

## Anti-Features (Do NOT Build in v1)

Deliberately excluded to ship faster.

| Feature | Why Exclude |
|---------|-------------|
| Custom roles | Hardcoded Admin/Staff/Client simpler, covers 90% |
| Per-customer billing | Org-level billing only, avoids complexity |
| Multiple orgs per user | Single org membership, revisit in v2 |
| Real-time chat | High complexity, not core to agency workflow |
| File uploads | Storage costs, defer to extension |
| AI features | Hype-driven, not core value |
| Mobile app | Web-first, responsive is enough |
| Audit logs | Nice-to-have, defer to v2 |
| Two-factor auth | WorkOS handles if needed |
| SSO/SAML | WorkOS enterprise feature, not v1 |

## Agency-Specific Considerations

Unlike generic SaaS starters, agency tools need:

1. **Customer != User distinction** — The "customer" is a company the agency works for, not an end-user
2. **Staff assignment** — Not all staff see all customers
3. **Client portal access** — External users with limited views
4. **Project boundaries** — Data for Customer A must never leak to Customer B
5. **Usage caps by tier** — Agencies grow, need upgrade path

## Feature Dependencies

```
Authentication (exists)
    └── Organization creation
        ├── Customer CRUD
        │   └── Staff assignment
        │   └── Client invites
        ├── Billing integration
        │   └── Usage cap enforcement
        └── Role-based data scoping
            └── UI guards
```

Build order should follow dependencies.
