# Convex React Integration Reference

## Setup

### Install
```bash
npm install convex
```

### Provider Setup

```tsx
// src/main.tsx or src/index.tsx
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ConvexProvider client={convex}>
    <App />
  </ConvexProvider>
);
```

### Environment Variable
```
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

## useQuery

Subscribes to a query and re-renders when data changes.

```tsx
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function UserList() {
  const users = useQuery(api.users.list);

  // undefined = loading
  if (users === undefined) return <div>Loading...</div>;

  // null = no data (if query can return null)
  if (users === null) return <div>Not found</div>;

  return (
    <ul>
      {users.map(user => <li key={user._id}>{user.name}</li>)}
    </ul>
  );
}
```

### With Arguments

```tsx
const user = useQuery(api.users.get, { userId: "abc123" });
```

### Conditional Query

```tsx
// Skip query entirely when userId is undefined
const user = useQuery(
  api.users.get,
  userId ? { userId } : "skip"
);
```

## useMutation

Returns a function to call mutations.

```tsx
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function CreateUserForm() {
  const createUser = useMutation(api.users.create);
  const [name, setName] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const userId = await createUser({ name });
      console.log("Created:", userId);
    } catch (error) {
      console.error("Failed:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={e => setName(e.target.value)} />
      <button type="submit">Create</button>
    </form>
  );
}
```

### Optimistic Updates

```tsx
const updateTask = useMutation(api.tasks.update).withOptimisticUpdate(
  (localStore, args) => {
    const currentTasks = localStore.getQuery(api.tasks.list, {});
    if (currentTasks !== undefined) {
      const updatedTasks = currentTasks.map(task =>
        task._id === args.taskId ? { ...task, ...args } : task
      );
      localStore.setQuery(api.tasks.list, {}, updatedTasks);
    }
  }
);
```

## useAction

Call actions (for external API calls).

```tsx
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";

function PaymentButton({ orderId }: { orderId: Id<"orders"> }) {
  const processPayment = useAction(api.payments.process);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await processPayment({ orderId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? "Processing..." : "Pay Now"}
    </button>
  );
}
```

## useConvex

Access the Convex client directly for imperative operations.

```tsx
import { useConvex } from "convex/react";

function SearchComponent() {
  const convex = useConvex();
  const [results, setResults] = useState([]);

  const search = async (query: string) => {
    // One-off query (doesn't subscribe)
    const data = await convex.query(api.search.run, { query });
    setResults(data);
  };

  return (
    <div>
      <input onChange={e => search(e.target.value)} />
      {results.map(r => <div key={r._id}>{r.title}</div>)}
    </div>
  );
}
```

## Pagination

```tsx
import { usePaginatedQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function MessageList({ channelId }: { channelId: Id<"channels"> }) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.messages.list,
    { channelId },
    { initialNumItems: 25 }
  );

  return (
    <div>
      {results.map(msg => <Message key={msg._id} message={msg} />)}

      {status === "CanLoadMore" && (
        <button onClick={() => loadMore(25)}>Load More</button>
      )}

      {status === "LoadingMore" && <div>Loading...</div>}
    </div>
  );
}
```

Pagination statuses: `"LoadingFirstPage"` | `"CanLoadMore"` | `"LoadingMore"` | `"Exhausted"`

## Authentication

### With Clerk

```tsx
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

function App() {
  return (
    <ClerkProvider publishableKey={CLERK_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <MainApp />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
```

### Check Auth in Components

```tsx
import { useConvexAuth } from "convex/react";

function ProtectedContent() {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;

  return <div>Protected content here</div>;
}
```

### Get User in Backend

```typescript
// In query/mutation handler
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error("Unauthenticated");

const userId = identity.subject;  // Unique user ID
const email = identity.email;     // If available
```

## File Uploads

```tsx
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function FileUpload() {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFile = useMutation(api.files.save);

  const handleUpload = async (file: File) => {
    // Get upload URL
    const uploadUrl = await generateUploadUrl();

    // Upload file
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await response.json();

    // Save reference
    await saveFile({ storageId, filename: file.name });
  };

  return (
    <input
      type="file"
      onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])}
    />
  );
}
```

## Error Handling

```tsx
function DataComponent() {
  const data = useQuery(api.data.get, { id });

  // Handle query errors with ErrorBoundary
  return (
    <ErrorBoundary fallback={<div>Error loading data</div>}>
      {data === undefined ? <Loading /> : <Display data={data} />}
    </ErrorBoundary>
  );
}

// Mutation errors
const doSomething = useMutation(api.actions.do);
try {
  await doSomething({ input });
} catch (error) {
  if (error instanceof ConvexError) {
    // Typed error from backend
    console.error(error.data);
  }
}
```

## TypeScript Types

```tsx
import { Doc, Id } from "../convex/_generated/dataModel";

// Document type
type User = Doc<"users">;

// ID type
type UserId = Id<"users">;

// Function arguments/returns are auto-typed
const user = useQuery(api.users.get, { userId });
// user is: Doc<"users"> | null | undefined
```
