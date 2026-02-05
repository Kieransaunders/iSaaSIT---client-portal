# Contributing to iSaaSIT

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm
- Git

### Setup

```bash
# Fork the repository
# Clone your fork
git clone https://github.com/YOUR_USERNAME/iSaaSIT.git
cd iSaaSIT

# Install dependencies
npm install

# Run setup wizard
npm run setup
```

---

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Making Changes

1. Create a branch:
   ```bash
   git checkout -b feature/my-feature
   ```

2. Make your changes

3. Test locally:
   ```bash
   npm run dev
   ```

4. Lint and format:
   ```bash
   npm run lint
   npm run format
   ```

5. Commit with clear message:
   ```bash
   git commit -m "feat: add customer invitation flow"
   ```

### Commit Message Format

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance

Examples:
```
feat(auth): add password reset flow
fix(billing): correct usage cap calculation
docs(readme): update setup instructions
```

---

## Code Style

### TypeScript

- Enable strict mode
- Use explicit types for function arguments
- Avoid `any` when possible

```typescript
// ✅ Good
function getCustomer(id: Id<"customers">): Promise<Doc<"customers"> | null>

// ❌ Avoid
function getCustomer(id: any): Promise<any>
```

### Convex Functions

Follow the patterns in `.cursor/rules/02-convex-patterns.mdc`:

```typescript
// ✅ Good
export const myQuery = query({
  args: { id: v.id("customers") },
  returns: v.union(v.object({ ... }), v.null()),
  handler: async (ctx, args) => {
    // Implementation
  }
})
```

### React Components

```typescript
// ✅ Good
interface CustomerCardProps {
  customer: Doc<"customers">
  onEdit?: (id: Id<"customers">) => void
}

export function CustomerCard({ customer, onEdit }: CustomerCardProps) {
  return <div>...</div>
}
```

### File Organization

```
convex/
├── schema.ts              # Database schema
├── lib/                   # Shared utilities
│   ├── auth.ts
│   └── billing.ts
├── features/              # Feature-organized
│   ├── customers.ts
│   └── users.ts
└── http.ts               # HTTP routes

src/
├── routes/               # TanStack routes
├── components/           # React components
│   ├── ui/              # Reusable UI
│   └── features/        # Feature components
└── hooks/               # Custom hooks
```

---

## Pull Request Process

### Before Submitting

- [ ] Code works locally
- [ ] No TypeScript errors (`npm run lint`)
- [ ] Code formatted (`npm run format`)
- [ ] No console errors in browser
- [ ] PR description explains changes

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Screenshots (if UI changes)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated (if needed)
```

### Review Process

1. Maintainer reviews PR
2. Address feedback
3. Once approved, maintainer merges

---

## Reporting Issues

### Bug Reports

Include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment (browser, OS)
- Screenshots if applicable

Template:
```markdown
**Description**
Brief bug description

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g., macOS 14]
- Browser: [e.g., Chrome 120]
- Node: [e.g., 20.10.0]
```

### Feature Requests

Include:
- Use case description
- Proposed solution
- Alternatives considered

---

## Documentation

### Code Documentation

Use JSDoc for complex functions:

```typescript
/**
 * Assigns a staff member to a customer
 * @param staffUserId - ID of staff user to assign
 * @param customerId - ID of customer to assign to
 * @returns The created assignment ID
 * @throws Error if staff doesn't have access to customer
 */
export const assignStaffToCustomer = mutation({
  args: {
    staffUserId: v.id("users"),
    customerId: v.id("customers")
  },
  handler: async (ctx, args) => {
    // Implementation
  }
})
```

### Documentation Files

When adding features, update relevant docs:
- `AGENTS.md` - If changing patterns AI coders need to know
- `.cursor/rules/*.mdc` - If adding new patterns
- `README.md` - If changing setup/installation

---

## Testing

While iSaaSIT doesn't have automated tests yet, manual testing is required:

### Testing Checklist

For auth changes:
- [ ] Sign in works
- [ ] Sign out works
- [ ] Protected routes work
- [ ] Token refresh works

For multi-tenancy changes:
- [ ] Data isolation works
- [ ] Role-based access works
- [ ] Cross-org access blocked

For UI changes:
- [ ] Works on desktop
- [ ] Works on mobile
- [ ] No console errors
- [ ] Loading states work

---

## Questions?

- Open an issue for questions
- Check existing issues/PRs
- Read `AGENTS.md` for project context

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
