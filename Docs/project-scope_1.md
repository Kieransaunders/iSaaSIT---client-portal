# iSaasIT — Project Scope

**Repo:** `iconnectit/iSaasIT` (public fork of `get-convex/convex-saas`)

**Purpose:** Open-source SaaS starter for agencies/freelancers who need a repeatable client template with multi-tenancy and client portal capabilities.

---

## Vision

iSaasIT empowers agencies and freelancers to bootstrap SaaS products with minimal setup by providing:

- Robust authentication
- Multi-tenant foundation with client portal support
- Billing and subscription handling with usage caps
- Role-based data scoping
- Type-safe data and API layers

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend Framework | React |
| Routing & SSR | TanStack Start |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Backend | Convex (serverless) |
| Authentication | Better Auth (via `@convex-dev/better-auth`) |
| Billing | Lemon Squeezy |
| Email | Resend + React Email |
| Dev Tooling | TypeScript, ESLint, Prettier, Vitest |

### Changes from Base Template (convex-saas)

| Layer | convex-saas | iSaasIT |
|-------|-------------|---------|
| Auth | Convex Auth | Better Auth |
| Billing | Stripe | Lemon Squeezy |
| Routing | TanStack Router (Vite SPA) | TanStack Start (SSR) |
| Tenancy | Single user | Org → Customer → User |

---

## Data Model

### Entities

```
Org
├── id
├── name
├── subscriptionId (Lemon Squeezy)
├── subscriptionStatus
├── planId
├── maxCustomers (cap from plan)
├── maxStaff (cap from plan)
├── maxClients (cap from plan)
├── createdAt
└── updatedAt

Customer
├── id
├── orgId (FK → Org)
├── name
├── createdAt
└── updatedAt

User
├── id (from Better Auth)
├── orgId (FK → Org)
├── role (Admin | Staff | Client)
├── customerId (FK → Customer, required if role = Client)
├── createdAt
└── updatedAt

StaffCustomerAssignment
├── id
├── staffUserId (FK → User where role = Staff)
├── customerId (FK → Customer)
├── createdAt
└── updatedAt
```

### Role Definitions

| Role | Sees | Can Do |
|------|------|--------|
| Admin | All org data | Billing, invites, full access |
| Staff | Data for assigned Customers only | Standard access within scope |
| Client | Own Customer's data only | Limited access within scope |

### Data Scoping Rules

- **Admin:** `WHERE orgId = user.orgId`
- **Staff:** `WHERE orgId = user.orgId AND customerId IN (assigned customers)`
- **Client:** `WHERE orgId = user.orgId AND customerId = user.customerId`

---

## Billing Model

### Structure

- **Freemium:** Limited free tier, paid plans unlock more
- **Billing level:** Org (not individual users)
- **Provider:** Lemon Squeezy

### Usage Caps

Caps are defined in Lemon Squeezy plan metadata and synced to the Org record on subscription webhook events.

| Cap | Scope |
|-----|-------|
| `maxCustomers` | Total Customer records in Org |
| `maxStaff` | Total Staff users in Org |
| `maxClients` | Total Client users in Org |

### Subscription Flow

1. User signs up (Better Auth)
2. User creates Org (becomes Admin)
3. Org starts on free tier (default caps applied)
4. User can upgrade via Lemon Squeezy checkout
5. Webhook fires → Convex mutation updates Org with new plan + caps
6. Feature enforcement checks Org caps before creating Customers/Staff/Clients

---

## User Flows

### Signup & Org Creation

1. User signs up via Better Auth (email/password or OAuth)
2. User lands on "Create your organisation" screen
3. User enters org name, creates Org
4. User becomes Admin of that Org
5. Free tier caps applied to Org
6. User can now invite Staff/Clients, create Customers

### Staff Onboarding

1. Admin invites Staff user (email invite)
2. Staff signs up / accepts invite
3. Staff user created with role = Staff
4. Admin assigns Staff to specific Customers
5. Staff can only see assigned Customer data

### Client Onboarding

1. Admin or Staff creates Client user under a Customer
2. Client receives invite email
3. Client signs up / accepts invite
4. Client user created with role = Client, linked to Customer
5. Client can only see their own Customer's data

---

## Migration Plan

Incremental migration from `convex-saas` base:

### Phase 1: Auth Swap
- Remove Convex Auth
- Integrate Better Auth via `@convex-dev/better-auth`
- Verify login/logout/session management works

### Phase 2: Routing Upgrade
- Migrate from TanStack Router (Vite SPA) to TanStack Start
- Add SSR support
- Verify auth works with SSR

### Phase 3: Multi-Tenancy
- Add Org, Customer, StaffCustomerAssignment tables
- Update User model with role and customerId
- Add Org creation flow post-signup
- Add Customer CRUD
- Add Staff/Client invite flows

### Phase 4: Billing Swap
- Remove Stripe integration
- Add Lemon Squeezy integration
- Implement webhook handler for subscription events
- Store plan caps on Org record
- Add upgrade/checkout flow

### Phase 5: Role-Based Scoping
- Implement data scoping helpers in Convex
- Apply scoping to all queries based on user role
- Add UI guards for role-based feature access
- Test Admin/Staff/Client access patterns

---

## Out of Scope (v1)

- AI integrations (can be added later as extension)
- Mobile app (React Native / Expo)
- Custom role definitions (hardcoded Admin/Staff/Client only)
- Per-Customer billing (Org-level only)
- Multiple Orgs per user (single Org membership in v1)

---

## Open Questions

- [ ] Email templates — use existing Resend setup or customise?
- [ ] Admin dashboard — keep existing or rebuild?
- [ ] Onboarding flow — wizard style or minimal?
- [ ] Deployment target — Vercel? Netlify? Document both?

---

## Repository

**GitHub:** `iconnectit/iSaasIT`

**License:** MIT (matching upstream)

**Base:** Fork of `get-convex/convex-saas`
