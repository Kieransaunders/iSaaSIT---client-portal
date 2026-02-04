# Requirements: iSaaSIT

**Defined:** 2025-02-04
**Core Value:** Agencies can spin up client projects with data isolation, billing, and role-based access out of the box

## v1 Requirements

### Authentication (Complete)

- [x] **AUTH-01**: User can sign in via WorkOS AuthKit
- [x] **AUTH-02**: Authenticated routes protected via loader
- [x] **AUTH-03**: Session persists across page refresh

### Organization (Partial)

- [x] **ORG-01**: User redirected to onboarding if no org
- [x] **ORG-02**: User can create org via onboarding form
- [ ] **ORG-03**: Org creation calls WorkOS API (not mock ID)
- [ ] **ORG-04**: User can view org settings

### Customer Management (Complete)

- [x] **CUST-01**: Admin can create customers
- [x] **CUST-02**: Admin can edit customers
- [x] **CUST-03**: Admin can delete customers
- [x] **CUST-04**: Customers list filtered by search
- [x] **CUST-05**: Usage cap enforced on customer creation

### Data Scoping (Complete)

- [x] **SCOPE-01**: Admin sees all org customers
- [x] **SCOPE-02**: Staff sees only assigned customers
- [x] **SCOPE-03**: Client sees only their customer
- [x] **SCOPE-04**: Access denied if user tries to access other customer

### Team Management (Not Started)

- [ ] **TEAM-01**: Admin can invite staff users
- [ ] **TEAM-02**: Admin can invite client users linked to customer
- [ ] **TEAM-03**: Staff/Client receives email invite
- [ ] **TEAM-04**: Invited user completes signup via WorkOS
- [ ] **TEAM-05**: Admin can view list of org members
- [ ] **TEAM-06**: Admin can remove users from org

### Staff Assignment (Partial)

- [x] **ASSIGN-01**: Staff auto-assigned to customers they create
- [ ] **ASSIGN-02**: Admin can assign staff to customers
- [ ] **ASSIGN-03**: Admin can unassign staff from customers
- [ ] **ASSIGN-04**: Staff assignment UI in customer detail

### Billing (Not Started)

- [ ] **BILL-01**: Org has subscription status synced from Lemon Squeezy
- [ ] **BILL-02**: Admin can upgrade via Lemon Squeezy checkout
- [ ] **BILL-03**: Webhook handler processes subscription events
- [ ] **BILL-04**: Plan caps update on subscription change
- [ ] **BILL-05**: Usage cap enforced on staff/client creation
- [ ] **BILL-06**: Billing page shows real usage from Convex

## v2 Requirements

### Notifications
- **NOTIF-01**: Email on new team invite
- **NOTIF-02**: Email on approaching usage limit
- **NOTIF-03**: In-app notification center

### Enhanced Billing
- **BILL-07**: Admin can cancel subscription
- **BILL-08**: Admin can change plans
- **BILL-09**: Usage history/analytics

### Client Portal
- **PORTAL-01**: Client-specific dashboard
- **PORTAL-02**: Client can update own profile
- **PORTAL-03**: Limited navigation for clients

## Out of Scope

| Feature | Reason |
|---------|--------|
| Custom roles | Hardcoded Admin/Staff/Client sufficient for v1 |
| Multiple orgs per user | Simplifies data model, revisit in v2 |
| Per-customer billing | Org-level billing only |
| Audit logs | Nice-to-have, defer to v2 |
| File uploads | Storage costs, add as extension |
| AI features | Not core value |
| Mobile app | Web responsive is sufficient |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | - | Complete |
| AUTH-02 | - | Complete |
| AUTH-03 | - | Complete |
| ORG-01 | - | Complete |
| ORG-02 | - | Complete |
| ORG-03 | 1 | Pending |
| ORG-04 | 1 | Pending |
| CUST-01 | - | Complete |
| CUST-02 | - | Complete |
| CUST-03 | - | Complete |
| CUST-04 | - | Complete |
| CUST-05 | - | Complete |
| SCOPE-01 | - | Complete |
| SCOPE-02 | - | Complete |
| SCOPE-03 | - | Complete |
| SCOPE-04 | - | Complete |
| TEAM-01 | 2 | Pending |
| TEAM-02 | 2 | Pending |
| TEAM-03 | 2 | Pending |
| TEAM-04 | 2 | Pending |
| TEAM-05 | 2 | Pending |
| TEAM-06 | 2 | Pending |
| ASSIGN-01 | - | Complete |
| ASSIGN-02 | 2 | Pending |
| ASSIGN-03 | 2 | Pending |
| ASSIGN-04 | 2 | Pending |
| BILL-01 | 3 | Pending |
| BILL-02 | 3 | Pending |
| BILL-03 | 3 | Pending |
| BILL-04 | 3 | Pending |
| BILL-05 | 3 | Pending |
| BILL-06 | 3 | Pending |

**Coverage:**
- v1 requirements: 25 total
- Complete: 14 (56%)
- Pending: 11 (44%)

---
*Requirements defined: 2025-02-04*
*Last updated: 2025-02-04 after codebase review*
