# Database Migrations Guide

Working with schema changes in Convex.

## Table of Contents

- [Convex Migration System](#convex-migration-system)
- [Adding New Tables](#adding-new-tables)
- [Modifying Existing Tables](#modifying-existing-tables)
- [One-Off Data Migrations](#one-off-data-migrations)
- [Schema Versioning](#schema-versioning)

---

## Convex Migration System

Convex handles migrations differently than traditional SQL databases:

1. **Schema changes are automatic** - No manual SQL migrations needed
2. **Data migrations are code** - Write TypeScript functions
3. **Zero-downtime deployments** - Convex handles rolling updates

### Basic Flow

```bash
# 1. Edit convex/schema.ts

# 2. Deploy (Convex prompts for confirmation)
npx convex dev

# 3. Handle data migration if needed (see below)
```

---

## Adding New Tables

### Simple Addition

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  // ... existing tables
  
  // New table
  projects: defineTable({
    customerId: v.id("customers"),
    name: v.string(),
    status: v.union(v.literal("active"), v.literal("completed")),
    startDate: v.number(),
    endDate: v.optional(v.number()),
  })
    .index("by_customer", ["customerId"])
    .index("by_customer_status", ["customerId", "status"]),
})
```

Then run:
```bash
npx convex dev
```

Convex will ask:
```
? The schema was modified. Push changes to your deployment? (Y/n)
```

Type `Y` to apply.

---

## Modifying Existing Tables

### Adding Fields (Backward Compatible)

```typescript
// convex/schema.ts - BEFORE
customers: defineTable({
  orgId: v.id("orgs"),
  name: v.string(),
})

// convex/schema.ts - AFTER
customers: defineTable({
  orgId: v.id("orgs"),
  name: v.string(),
  email: v.optional(v.string()),  // ✅ New optional field
  phone: v.optional(v.string()),  // ✅ New optional field
})
```

This is safe - existing documents just won't have the new fields.

---

### Making Optional Fields Required

**⚠️ Breaking Change** - Requires data migration.

```typescript
// convex/schema.ts - BEFORE
customers: defineTable({
  orgId: v.id("orgs"),
  name: v.string(),
  status: v.optional(v.string()),  // Optional
})

// convex/schema.ts - AFTER
customers: defineTable({
  orgId: v.id("orgs"),
  name: v.string(),
  status: v.string(),  // ⚠️ Now required!
})
```

**Steps**:

1. **Create migration script**:
```typescript
// convex/migrations.ts
import { internalMutation } from "./_generated/server"
import { v } from "convex/values"

export const backfillCustomerStatus = internalMutation({
  args: {},
  handler: async (ctx) => {
    const customers = await ctx.db.query("customers").collect()
    
    for (const customer of customers) {
      if (!customer.status) {
        await ctx.db.patch(customer._id, {
          status: "active"  // Default value
        })
      }
    }
    
    return { migrated: customers.length }
  }
})
```

2. **Run migration**:
```bash
npx convex dev  # Deploy schema
npx convex run migrations:backfillCustomerStatus  # Run migration
```

3. **Update schema** to make field required:
```typescript
status: v.string(),  // Now safe to require
```

4. **Deploy again**:
```bash
npx convex dev
```

---

### Renaming Fields

Convex doesn't support field renaming directly. You must:

1. Add new field
2. Migrate data
3. Remove old field

```typescript
// Step 1: Add new field
customers: defineTable({
  orgId: v.id("orgs"),
  name: v.string(),
  fullName: v.optional(v.string()),  // New field
})

// Step 2: Migrate
export const migrateNameToFullName = internalMutation({
  args: {},
  handler: async (ctx) => {
    const customers = await ctx.db.query("customers").collect()
    
    for (const customer of customers) {
      if (!customer.fullName && customer.name) {
        await ctx.db.patch(customer._id, {
          fullName: customer.name
        })
      }
    }
  }
})

// Step 3: After migration, remove old field
customers: defineTable({
  orgId: v.id("orgs"),
  // name: v.string(),  // Removed
  fullName: v.string(),  // Now required
})
```

---

### Removing Fields

Simply remove from schema:

```typescript
// BEFORE
customers: defineTable({
  orgId: v.id("orgs"),
  name: v.string(),
  legacyField: v.string(),  // To be removed
})

// AFTER
customers: defineTable({
  orgId: v.id("orgs"),
  name: v.string(),
  // legacyField removed
})
```

Existing documents keep the field data, but it's no longer accessible in queries.

To clean up old data:
```typescript
export const cleanupLegacyField = internalMutation({
  args: {},
  handler: async (ctx) => {
    const customers = await ctx.db.query("customers").collect()
    
    for (const customer of customers) {
      if ('legacyField' in customer) {
        // Can't actually delete fields, but can set to null
        await ctx.db.patch(customer._id, {
          legacyField: undefined
        })
      }
    }
  }
})
```

---

## One-Off Data Migrations

### Running Migrations

```bash
# Run once
npx convex run migrations:backfillCustomerStatus

# Check output
npx convex run migrations:backfillCustomerStatus --json
```

### Migration Best Practices

1. **Make idempotent** - Can run multiple times safely:
```typescript
export const backfillData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("items")
      .withIndex("by_needs_migration", q => q.eq("migrated", false))
      .take(100)  // Batch size
    
    for (const item of items) {
      await ctx.db.patch(item._id, {
        newField: calculateFromOld(item.oldField),
        migrated: true
      })
    }
    
    return { processed: items.length }
  }
})
```

2. **Use pagination for large datasets**:
```typescript
export const migrateLargeDataset = internalMutation({
  args: { cursor: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const PAGE_SIZE = 100
    
    const result = await ctx.db
      .query("largeTable")
      .paginate({
        numItems: PAGE_SIZE,
        cursor: args.cursor || null
      })
    
    for (const doc of result.page) {
      await ctx.db.patch(doc._id, { /* updates */ })
    }
    
    // Schedule next batch if not done
    if (!result.isDone) {
      await ctx.scheduler.runAfter(0, internal.migrations.migrateLargeDataset, {
        cursor: result.continueCursor
      })
    }
    
    return { 
      processed: result.page.length,
      isDone: result.isDone 
    }
  }
})
```

3. **Log progress**:
```typescript
export const migrationWithLogging = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting migration...")
    
    const items = await ctx.db.query("items").collect()
    let processed = 0
    
    for (const item of items) {
      await ctx.db.patch(item._id, { /* updates */ })
      processed++
      
      if (processed % 100 === 0) {
        console.log(`Processed ${processed}/${items.length}`)
      }
    }
    
    console.log("Migration complete!")
    return { total: items.length, processed }
  }
})
```

---

## Schema Versioning

### Tracking Schema Versions

Add a metadata table to track migrations:

```typescript
// convex/schema.ts
export default defineSchema({
  // ... other tables
  
  _migrationLog: defineTable({
    name: v.string(),
    runAt: v.number(),
    result: v.any(),
  }).index("by_name", ["name"]),
})
```

```typescript
// convex/migrations.ts
import { internalMutation } from "./_generated/server"
import { v } from "convex/values"

async function logMigration(
  ctx: MutationCtx,
  name: string,
  result: any
) {
  await ctx.db.insert("_migrationLog", {
    name,
    runAt: Date.now(),
    result
  })
}

export const runMigration = internalMutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    // Check if already run
    const existing = await ctx.db
      .query("_migrationLog")
      .withIndex("by_name", q => q.eq("name", args.name))
      .unique()
    
    if (existing) {
      console.log(`Migration ${args.name} already run at ${existing.runAt}`)
      return { skipped: true }
    }
    
    // Run migration based on name
    let result
    switch (args.name) {
      case "v1_addCustomerStatus":
        result = await migrateV1(ctx)
        break
      case "v2_addProjectTable":
        result = await migrateV2(ctx)
        break
      default:
        throw new Error(`Unknown migration: ${args.name}`)
    }
    
    await logMigration(ctx, args.name, result)
    return { skipped: false, result }
  }
})
```

Run migrations:
```bash
npx convex run migrations:runMigration --json '{"name": "v1_addCustomerStatus"}'
npx convex run migrations:runMigration --json '{"name": "v2_addProjectTable"}'
```

---

## Rollbacks

### Convex Doesn't Support Rollbacks

Once data is migrated forward, there's no automatic rollback. Strategies:

1. **Backup before migrating**:
```typescript
export const backupBeforeMigration = internalMutation({
  args: {},
  handler: async (ctx) => {
    const customers = await ctx.db.query("customers").collect()
    
    for (const customer of customers) {
      await ctx.db.insert("_backup_customers_v1", {
        originalId: customer._id,
        data: customer,
        backedUpAt: Date.now()
      })
    }
    
    return { backedUp: customers.length }
  }
})
```

2. **Write forward-compatible code**:
```typescript
// Read both old and new fields during transition
const displayName = customer.fullName || customer.name || "Unknown"
```

---

## Testing Migrations

### Test on Development First

```bash
# Ensure you're on dev deployment
npx convex dev

# Run migration
npx convex run migrations:backfillCustomerStatus

# Verify in dashboard
npx convex dashboard
```

### Test with Subset

```typescript
export const testMigration = internalMutation({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10  // Default small batch
    
    const customers = await ctx.db
      .query("customers")
      .take(limit)
    
    console.log(`Testing migration on ${customers.length} records`)
    
    for (const customer of customers) {
      console.log(`Would update: ${customer._id}`)
      // Don't actually update during test
    }
    
    return { wouldProcess: customers.length }
  }
})
```

```bash
# Dry run
npx convex run migrations:testMigration --json '{"limit": 5}'

# Real run
npx convex run migrations:backfillCustomerStatus
```

---

## Common Migration Patterns

### Backfill with Default

```typescript
export const backfillWithDefault = internalMutation({
  args: {
    table: v.string(),
    field: v.string(),
    defaultValue: v.any()
  },
  handler: async (ctx, args) => {
    // This is pseudo-code - Convex doesn't allow dynamic table names
    // Use specific queries instead
  }
})
```

### Split Field

```typescript
// Split "name" into "firstName" and "lastName"
export const splitNameField = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect()
    
    for (const user of users) {
      const parts = user.name?.split(" ") || ["", ""]
      await ctx.db.patch(user._id, {
        firstName: parts[0],
        lastName: parts.slice(1).join(" ") || ""
      })
    }
  }
})
```

### Aggregate and Move

```typescript
// Move data from subcollection to parent
export const denormalizeData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const customers = await ctx.db.query("customers").collect()
    
    for (const customer of customers) {
      const count = await ctx.db
        .query("projects")
        .withIndex("by_customer", q => q.eq("customerId", customer._id))
        .collect()
        .then(projects => projects.length)
      
      await ctx.db.patch(customer._id, {
        projectCount: count  // Denormalized
      })
    }
  }
})
```

---

## Migration Checklist

Before running a migration:

- [ ] Test on development deployment first
- [ ] Back up data if critical
- [ ] Make migration idempotent
- [ ] Use pagination for large datasets
- [ ] Add logging
- [ ] Test rollback plan (if possible)
- [ ] Run during low-traffic period
- [ ] Monitor Convex dashboard during migration
- [ ] Verify results after completion
