# Convex Skill for Claude Code

A Claude Code skill for building applications with [Convex](https://convex.dev) - reactive database, serverless functions, and real-time sync with TypeScript.

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/claude-skill-convex.git
cp -r claude-skill-convex ~/.claude/skills/convex
```

Or download and copy the folder manually to `~/.claude/skills/convex`.

## What's Included

```
convex/
├── SKILL.md              # Quick reference (loaded when skill triggers)
└── references/
    ├── functions.md      # Queries, mutations, actions, scheduling
    ├── database.md       # Schema, indexes, read/write operations
    └── react.md          # Hooks, pagination, auth, file uploads
```

## Triggers

The skill activates when working with:
- Files in a `convex/` directory
- Convex imports (`useQuery`, `useMutation`, `v.string()`, etc.)
- Questions about Convex patterns

## Key Patterns

```typescript
// Always use validators
export const getUser = query({
  args: { userId: v.id("users") },
  returns: v.union(v.null(), v.object({ ... })),
  handler: async (ctx, args) => { ... }
});

// Always use indexes, never filter()
.withIndex("by_email", (q) => q.eq("email", email))
```

## License

MIT
