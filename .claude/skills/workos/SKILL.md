---
name: workos
description: WorkOS authentication and user management platform. Use when implementing AuthKit, SSO, OAuth, directory sync, RBAC, user authentication, organization management, admin portal, audit logs, webhooks, MFA, magic auth, or when the user mentions WorkOS, SAML, SCIM, enterprise features, or session management.
---

# WorkOS Integration Skill

WorkOS provides developer-friendly APIs for enterprise features including AuthKit (authentication), Single Sign-On, Directory Sync, User Management, Admin Portal, Audit Logs, RBAC, and more.

## When to Use This Skill

- Implementing authentication flows (AuthKit, OAuth, SAML SSO)
- Setting up organization and user management
- Integrating directory sync (SCIM) for user provisioning
- Handling WorkOS webhooks and events
- Managing admin portal access
- Implementing RBAC (Role-Based Access Control)
- Working with WorkOS SDK or API
- Adding audit logs, MFA, or feature flags

## Installation & Setup

### Install SDK

```bash
# Node.js
npm install @workos-inc/node

# Or for TanStack Start
npm install @workos-inc/authkit-tanstack-start
```

### Environment Variables

```bash
# Required
WORKOS_API_KEY=sk_live_...
WORKOS_CLIENT_ID=client_...

# Optional
WORKOS_REDIRECT_URI=https://yourapp.com/auth/callback
WORKOS_WEBHOOK_SECRET=wh_secret_...
```

### Basic Setup

```typescript
import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const clientId = process.env.WORKOS_CLIENT_ID;
```

## Common Integration Patterns

### 1. AuthKit - Complete Authentication Solution

AuthKit is WorkOS's recommended authentication solution with hosted UI and flexible auth methods.

**Generate authorization URL:**

```typescript
const authUrl = workos.userManagement.getAuthorizationUrl({
  provider: 'authkit',
  clientId,
  redirectUri: 'https://yourapp.com/callback',
  state: 'optional-state',
});
```

**Handle callback:**

```typescript
const { user, organizationId, accessToken, refreshToken } =
  await workos.userManagement.authenticateWithCode({
    clientId,
    code: req.query.code,
  });
```

### 2. Organization Management (Multi-tenant SaaS)

**Create organization:**

```typescript
const org = await workos.organizations.createOrganization({
  name: 'Acme Corp',
  domainData: [{ domain: 'acme.com' }],
});
```

**List organizations:**

```typescript
const { data: orgs } = await workos.organizations.listOrganizations();
```

**Associate user with organization:**

```typescript
const membership = await workos.userManagement.createOrganizationMembership({
  userId: 'user_123',
  organizationId: 'org_123',
  roleSlug: 'member',
});
```

### 3. Single Sign-On (SSO)

**Create SSO connection:**

```typescript
const connection = await workos.sso.createConnection({
  source: 'draft',
  organizationId: 'org_123',
  idpType: 'SAML',
  name: 'Acme Corp SSO',
});
```

**Authenticate with SSO:**

```typescript
const authUrl = workos.userManagement.getAuthorizationUrl({
  provider: 'authkit',
  clientId,
  redirectUri: 'https://yourapp.com/callback',
  organizationId: 'org_123', // Routes to SSO if configured
});
```

### 4. Directory Sync (SCIM User Provisioning)

**List directory users:**

```typescript
const { data: users } = await workos.directorySync.listDirectoryUsers({
  directory: 'directory_123',
});
```

**Handle directory sync webhooks:**

```typescript
switch (webhook.event) {
  case 'directory.user_created':
    // Provision user in your app
    break;
  case 'directory.user_deleted':
    // Deprovision user
    break;
  case 'directory.group_created':
    // Sync group/team
    break;
}
```

### 5. Webhooks (Event Handling)

**Verify webhook signature:**

```typescript
const workos = new WorkOS(process.env.WORKOS_API_KEY);

try {
  const webhook = workos.webhooks.constructEvent({
    payload: req.body,
    signature: req.headers['workos-signature'],
    secret: process.env.WORKOS_WEBHOOK_SECRET,
  });

  // Process event
  console.log(webhook.event, webhook.data);
} catch (error) {
  return res.status(400).send('Invalid signature');
}
```

**Common webhook events:**
- `user.created`, `user.updated`, `user.deleted`
- `directory.user_created`, `directory.user_updated`, `directory.user_deleted`
- `directory.group_created`, `directory.group_updated`, `directory.group_deleted`
- `session.created`, `session.ended`
- `organization_membership.created`, `organization_membership.updated`

### 6. Admin Portal

**Generate admin portal link:**

```typescript
const { link } = await workos.portal.generateLink({
  organization: 'org_123',
  intent: 'sso', // or 'dsync', 'audit_logs'
  returnUrl: 'https://yourapp.com/settings',
});

res.redirect(link);
```

**Available intents:**
- `sso` - Manage SSO connections
- `dsync` - Manage directory sync
- `audit_logs` - View audit logs
- `log_streams` - Manage log streams

### 7. User Management

**Create user:**

```typescript
const user = await workos.userManagement.createUser({
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  emailVerified: false,
});
```

**Update user:**

```typescript
const updated = await workos.userManagement.updateUser({
  userId: 'user_123',
  firstName: 'Jane',
});
```

**List users:**

```typescript
const { data: users } = await workos.userManagement.listUsers({
  organizationId: 'org_123',
  limit: 10,
});
```

### 8. Session Management

**Refresh access token:**

```typescript
const { accessToken, refreshToken } = await workos.userManagement.refreshToken({
  clientId,
  refreshToken: storedRefreshToken,
});
```

**Revoke session:**

```typescript
await workos.userManagement.revokeSession({
  sessionId: 'session_123',
});
```

### 9. RBAC (Roles & Permissions)

**Create role:**

```typescript
const role = await workos.roles.createRole({
  name: 'Admin',
  description: 'Administrator role',
});
```

**Assign permission to role:**

```typescript
await workos.roles.addRolePermission({
  roleId: 'role_123',
  permissionId: 'permission_123',
});
```

**Create organization membership with role:**

```typescript
const membership = await workos.userManagement.createOrganizationMembership({
  userId: 'user_123',
  organizationId: 'org_123',
  roleSlug: 'admin',
});
```

### 10. Magic Auth (Passwordless)

**Send magic link:**

```typescript
await workos.userManagement.sendMagicAuthCode({
  email: 'user@example.com',
});
```

**Authenticate with code:**

```typescript
const { user, accessToken } = await workos.userManagement.authenticateWithMagicAuth({
  clientId,
  code: 'magic_code',
  email: 'user@example.com',
});
```

### 11. Multi-Factor Authentication (MFA)

**Enroll auth factor:**

```typescript
const factor = await workos.mfa.enrollFactor({
  type: 'totp',
  totpIssuer: 'YourApp',
  totpUser: 'user@example.com',
});
```

**Create challenge:**

```typescript
const challenge = await workos.mfa.createChallenge({
  authenticationFactorId: 'auth_factor_123',
});
```

**Verify challenge:**

```typescript
const { valid } = await workos.mfa.verifyChallenge({
  authenticationChallengeId: 'challenge_123',
  code: '123456',
});
```

## Framework-Specific Integration

### TanStack Start

```typescript
// app/routes/api/auth/callback.ts
import { createAPIFileRoute } from '@tanstack/start/api';
import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY!);

export const Route = createAPIFileRoute('/api/auth/callback')({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    const { user, accessToken } = await workos.userManagement.authenticateWithCode({
      clientId: process.env.WORKOS_CLIENT_ID!,
      code,
    });

    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/dashboard',
        'Set-Cookie': `session=${accessToken}; HttpOnly; Secure; SameSite=Lax`,
      },
    });
  },
});
```

### Next.js App Router

```typescript
// app/api/auth/callback/route.ts
import { WorkOS } from '@workos-inc/node';
import { NextResponse } from 'next/server';

const workos = new WorkOS(process.env.WORKOS_API_KEY!);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  const { user, accessToken } = await workos.userManagement.authenticateWithCode({
    clientId: process.env.WORKOS_CLIENT_ID!,
    code,
  });

  const response = NextResponse.redirect('/dashboard');
  response.cookies.set('session', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });

  return response;
}
```

## Best Practices

### 1. Security

- Store API keys securely in environment variables
- Use HTTPS for all redirect URIs
- Verify webhook signatures
- Implement CSRF protection with state parameter
- Use short-lived access tokens with refresh tokens

### 2. Session Management

- Store tokens in httpOnly, secure cookies
- Implement token refresh before expiration
- Handle token refresh failures gracefully
- Implement proper logout (revoke sessions)

### 3. Organization Architecture

- Associate users with organizations from signup
- Use domain verification for auto-assignment
- Implement organization switching UI
- Cache organization data

### 4. Webhooks

- Always verify signatures
- Use HTTPS endpoints
- Implement idempotency
- Process asynchronously
- Return 200 quickly

### 5. Error Handling

```typescript
try {
  const user = await workos.userManagement.getUser(userId);
} catch (error) {
  if (error.code === 'not_found') {
    // Handle not found
  } else if (error.code === 'unauthorized') {
    // Handle auth error
  } else {
    // Handle other errors
  }
}
```

## WorkOS Documentation Reference

For detailed information on specific features, refer to these documentation sections:

### Core Features
- **AuthKit**: Authentication platform with hosted UI
- **Single Sign-On**: SAML, OIDC, OAuth integrations
- **Directory Sync**: SCIM user provisioning
- **Organizations**: Multi-tenant management
- **Admin Portal**: Self-service configuration
- **Audit Logs**: Event logging and streaming
- **RBAC**: Roles and permissions
- **Webhooks/Events**: Real-time event notifications

### Authentication Methods
- Email + Password
- Magic Auth (passwordless)
- Social Login (Google, Microsoft, GitHub, etc.)
- SSO (SAML, OIDC)
- MFA (TOTP, SMS)
- Passkeys (WebAuthn)

### Widgets (Embeddable Components)
- User Profile Widget
- User Sessions Widget
- User Security Widget
- Organization Switcher
- SSO Connection Widget
- Domain Verification Widget

### Advanced Features
- Vault: Encrypted data storage with BYOK
- Pipes: Third-party account connections
- Radar: Bot and fraud protection
- Feature Flags: Rollout management
- FGA: Fine-grained authorization
- Domain Verification: Self-serve domain setup

### Integrations
Supports 100+ identity providers including:
- Okta, OneLogin, Azure AD (Entra ID)
- Google Workspace, Microsoft 365
- PingFederate, Auth0, JumpCloud
- SFTP, SCIM, Generic SAML/OIDC

## TypeScript Types

```typescript
import type {
  User,
  Organization,
  OrganizationMembership,
  Connection,
  Directory,
  DirectoryUser,
  DirectoryGroup,
  AuthenticationResponse,
} from '@workos-inc/node';
```

## Troubleshooting

### Authentication Issues
- **Invalid code**: Codes expire in 10 minutes
- **Redirect URI mismatch**: Must match exactly
- **Organization required**: Include organizationId for SSO

### Webhook Issues
- **Signature verification fails**: Check secret and use raw body
- **Events not arriving**: Verify endpoint is HTTPS and accessible

### Session Issues
- **Token expired**: Implement refresh token flow
- **Session not found**: User may have been deleted

## Common Workflows

### Workflow 1: New User Signup with Organization

```typescript
// 1. Create organization
const org = await workos.organizations.createOrganization({
  name: 'Acme Corp',
  domainData: [{ domain: 'acme.com' }],
});

// 2. Generate signup URL with organization
const authUrl = workos.userManagement.getAuthorizationUrl({
  provider: 'authkit',
  clientId,
  redirectUri: 'https://yourapp.com/callback',
  organizationId: org.id,
});

// 3. In callback, user is automatically associated with org
const { user, organizationId } = await workos.userManagement.authenticateWithCode({
  clientId,
  code,
});
```

### Workflow 2: Enterprise SSO Setup

```typescript
// 1. Create organization
const org = await workos.organizations.createOrganization({
  name: 'Enterprise Customer',
  domainData: [{ domain: 'enterprise.com' }],
});

// 2. Generate admin portal link for SSO setup
const { link } = await workos.portal.generateLink({
  organization: org.id,
  intent: 'sso',
  returnUrl: 'https://yourapp.com/settings',
});

// 3. Customer configures SSO in admin portal
// 4. Login automatically uses SSO
const authUrl = workos.userManagement.getAuthorizationUrl({
  provider: 'authkit',
  clientId,
  organizationId: org.id, // Uses SSO if configured
  redirectUri: 'https://yourapp.com/callback',
});
```

### Workflow 3: Directory Sync Implementation

```typescript
// 1. Setup webhook endpoint
app.post('/webhooks/workos', async (req, res) => {
  const webhook = workos.webhooks.constructEvent({
    payload: req.body,
    signature: req.headers['workos-signature'],
    secret: process.env.WORKOS_WEBHOOK_SECRET,
  });

  switch (webhook.event) {
    case 'directory.user_created':
      await createUserInApp(webhook.data);
      break;
    case 'directory.user_updated':
      await updateUserInApp(webhook.data);
      break;
    case 'directory.user_deleted':
      await deactivateUserInApp(webhook.data);
      break;
  }

  res.sendStatus(200);
});

// 2. Generate admin portal for directory setup
const { link } = await workos.portal.generateLink({
  organization: 'org_123',
  intent: 'dsync',
});
```

## Resources

- [WorkOS Documentation](https://workos.com/docs)
- [API Reference](https://workos.com/docs/reference)
- [Node.js SDK](https://workos.com/docs/sdks/node)
- [AuthKit TanStack Start SDK](https://workos.com/docs/sdks/authkit-tanstack-start)
- [WorkOS Dashboard](https://dashboard.workos.com)
- [Example Apps](https://github.com/workos/example-apps)

## SDK Availability

WorkOS provides official SDKs for:
- Node.js / TypeScript
- Python
- Ruby
- Go
- PHP
- Java
- .NET
- Elixir
- Laravel

## Testing

Use test mode API keys for development:
- Test keys start with `sk_test_`
- Test SSO connections available in dashboard
- Webhook testing with WorkOS CLI

## Notes

- WorkOS is designed for B2B SaaS applications
- Supports multi-tenancy out of the box
- Enterprise features (SSO, SCIM) available on paid plans
- AuthKit is the recommended modern authentication solution
- Dashboard provides real-time logs and debugging tools
