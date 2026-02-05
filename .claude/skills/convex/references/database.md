# Convex Database Reference

## Schema Definition

Always in `convex/schema.ts`:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("user")),
    profile: v.optional(v.object({
      bio: v.string(),
      avatar: v.optional(v.id("_storage")),
    })),
    tags: v.array(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  messages: defineTable({
    authorId: v.id("users"),
    channelId: v.id("channels"),
    content: v.string(),
    metadata: v.optional(v.any()),
  })
    .index("by_channel", ["channelId"])
    .index("by_author_and_channel", ["authorId", "channelId"])
    .searchIndex("search_content", { searchField: "content" }),
});
```

## System Fields

Every document automatically has:
- `_id` - Unique document identifier (`Id<"tableName">`)
- `_creationTime` - Unix timestamp (milliseconds)

## Validators Reference

| Type | Validator | TypeScript Type |
|------|-----------|-----------------|
| String | `v.string()` | `string` |
| Number | `v.number()` | `number` |
| Boolean | `v.boolean()` | `boolean` |
| Null | `v.null()` | `null` |
| BigInt | `v.int64()` | `bigint` |
| Bytes | `v.bytes()` | `ArrayBuffer` |
| ID | `v.id("table")` | `Id<"table">` |
| Array | `v.array(v.string())` | `string[]` |
| Object | `v.object({ key: v.string() })` | `{ key: string }` |
| Record | `v.record(v.string(), v.number())` | `Record<string, number>` |
| Optional | `v.optional(v.string())` | `string \| undefined` |
| Union | `v.union(v.string(), v.number())` | `string \| number` |
| Literal | `v.literal("value")` | `"value"` |
| Any | `v.any()` | `any` |

### Discriminated Unions

```typescript
const messageContent = v.union(
  v.object({
    type: v.literal("text"),
    text: v.string(),
  }),
  v.object({
    type: v.literal("image"),
    storageId: v.id("_storage"),
    caption: v.optional(v.string()),
  }),
);
```

## Indexes

### Index Rules
1. Query fields **in definition order** - can't skip fields
2. Max 16 fields per index
3. Max 32 indexes per table
4. `_creationTime` is auto-appended as tie-breaker

### Index Patterns

```typescript
// Single field
.index("by_email", ["email"])

// Compound index
.index("by_status_and_date", ["status", "createdAt"])

// For staged backfill on large tables
.index("by_category", { fields: ["category"], staged: true })
```

### Querying with Indexes

```typescript
// Equality
.withIndex("by_email", (q) => q.eq("email", email))

// Range
.withIndex("by_date", (q) =>
  q.gte("date", startDate)
   .lt("date", endDate)
)

// Compound: equality then range
.withIndex("by_status_and_date", (q) =>
  q.eq("status", "active")
   .gte("date", since)
)
```

### Index Query Order

1. Zero or more `.eq()` conditions (in field order)
2. Optional `.gt()` or `.gte()`
3. Optional `.lt()` or `.lte()`

**Cannot skip fields** - for index `["a", "b", "c"]`:
- ✅ `q.eq("a", x).eq("b", y)`
- ❌ `q.eq("a", x).eq("c", z)` - skips "b"

## Reading Data

### Single Document
```typescript
const user = await ctx.db.get(userId);  // null if not found
```

### Query Builder

```typescript
// Basic query
const users = await ctx.db.query("users").collect();

// With index
const activeUsers = await ctx.db
  .query("users")
  .withIndex("by_status", (q) => q.eq("status", "active"))
  .collect();

// Ordering (default: ascending _creationTime)
const recent = await ctx.db
  .query("messages")
  .order("desc")
  .take(10);

// Pagination
const page = await ctx.db
  .query("items")
  .paginate(paginationOpts);
// Returns: { page: Doc[], isDone: boolean, continueCursor: string }
```

### Joins (Manual)

```typescript
// Load related documents
const messages = await ctx.db.query("messages").collect();
const authors = await Promise.all(
  messages.map(m => ctx.db.get(m.authorId))
);
```

## Writing Data

### Insert
```typescript
const id = await ctx.db.insert("users", {
  name: "Alice",
  email: "alice@example.com",
  role: "user",
  tags: [],
});
```

### Patch (Shallow Merge)
```typescript
// Updates only specified fields, keeps others
await ctx.db.patch(userId, {
  name: "Alice Smith",
  tags: ["admin"],  // replaces entire array
});

// Remove a field
await ctx.db.patch(userId, { profile: undefined });
```

### Replace (Full Replacement)
```typescript
// Replaces entire document (except _id, _creationTime)
await ctx.db.replace(userId, {
  name: "Alice Smith",
  email: "alice.smith@example.com",
  role: "admin",
  tags: ["admin"],
  // profile field removed if not included
});
```

### Delete
```typescript
await ctx.db.delete(userId);
```

## Full-Text Search

### Define Search Index

```typescript
defineTable({
  title: v.string(),
  content: v.string(),
  authorId: v.id("users"),
})
  .searchIndex("search_content", {
    searchField: "content",
    filterFields: ["authorId"],
  })
```

### Search Query

```typescript
const results = await ctx.db
  .query("articles")
  .withSearchIndex("search_content", (q) =>
    q.search("content", searchTerm)
     .eq("authorId", authorId)  // Optional filter
  )
  .take(20);
```

## Vector Search

### Define Vector Index

```typescript
defineTable({
  content: v.string(),
  embedding: v.array(v.number()),
})
  .vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1536,
  })
```

### Vector Query

```typescript
const results = await ctx.vectorSearch("documents", "by_embedding", {
  vector: queryEmbedding,
  limit: 10,
});
```

## File Storage

### Upload
```typescript
// Generate upload URL (in mutation)
const uploadUrl = await ctx.storage.generateUploadUrl();

// Client uploads to URL, gets storageId back
```

### Retrieve
```typescript
// Get serving URL
const url = await ctx.storage.getUrl(storageId);  // null if not found

// Get metadata
const file = await ctx.db
  .query("_storage")
  .filter((q) => q.eq(q.field("_id"), storageId))
  .unique();
```

### Delete
```typescript
await ctx.storage.delete(storageId);
```
