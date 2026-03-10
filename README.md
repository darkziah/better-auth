# Convex + Better Auth

<!-- START: Include on https://convex.dev/components -->

Use [Better Auth](https://better-auth.com) with
[Convex](https://www.convex.dev).

**Full documentation and guides:
[labs.convex.dev/better-auth](https://labs.convex.dev/better-auth)**

### Framework Agnostic

**Support for popular frameworks.**

Supports popular frameworks, including React, Vue, Svelte, Astro, Solid,
Next.js, Nuxt, Tanstack Start, Hono, and more.

### Authentication

**Email & Password Authentication.**

Built-in support for email and password authentication, with session and account
management features.

### Social Sign-on

**Support multiple OAuth providers.**

Allow users to sign in with their accounts, including GitHub, Google, Discord,
Twitter, and more.

### Two Factor

**Multi Factor Authentication.**

Secure your users accounts with two factor authentication with a few lines of
code.

<!-- END: Include on https://convex.dev/components -->

---

## What's New

This fork adds first-class support for **same-schema mode** — where auth and organization tables live in your root Convex schema instead of being scoped to a component. Key additions:

- **Better Auth organization plugin** works end-to-end in same-schema mode
- **`createLocalAdapter()`** — new recommended adapter bridge that wraps `createLocalApi()` into the shape expected by `createClient()`
- **`createLocalApi()`** — lower-level root-schema CRUD API (still available for advanced use cases)
- **Root schema integration** via `getConvexAuthTables(...)` — dynamically generates Convex table definitions from Better Auth options
- **Schema-only plugin shims** — lightweight `organization()` and `admin()` factories for use in `convex/schema.ts` without pulling in heavy runtime code
- **Organization teams support** — `team` and `teamMember` tables via `teams: { enabled: true }`
- **Composite indexes** for efficient org-related lookups (`member`, `invitation`, `teamMember`)
- **Session extension fields** — `activeOrganizationId` and `activeTeamId` on sessions when using the organization plugin

---

## Quick Start

### Choose your mode

| | **Component Mode** (default) | **Same-Schema Mode** |
|---|---|---|
| **When to use** | You want the simplest setup and don't need org tables accessible from root Convex functions | You use the Better Auth organization plugin and need direct `ctx.db` access to org tables from your own Convex functions |
| **Where auth tables live** | Inside the Convex component schema | In your root `convex/schema.ts` |
| **Organization support** | Limited — component adapter cannot see root-level org tables | Full — org tables are first-class citizens in your root schema |
| **Setup complexity** | Minimal | Requires local adapter wiring |

> **Use component mode if** you only need basic auth (email/password, social, 2FA) and don't need organization tables.
>
> **Use same-schema mode if** you need the organization plugin and want to query org data directly in your Convex functions.

---

## How to Use

### A. Component Mode (Default)

Component mode is the simpler path. Auth tables (`user`, `session`, `account`, `verification`, etc.) live inside the component's own schema. Your app interacts with auth data through the component API.

**When to use:** You only need core authentication features and don't need organization tables in your root schema.

**Setup:** Follow the official documentation at [labs.convex.dev/better-auth](https://labs.convex.dev/better-auth). The key steps are:

1. Install the package and configure `convex.config.ts` to include the component
2. Generate or use the component schema (`src/component/schema.ts`)
3. Set up `convex/auth.ts` with `createClient(components.betterAuth)`
4. Register HTTP routes in `convex/http.ts`

```ts
// convex/auth.ts — Component mode
import { createClient } from "@convex-dev/better-auth";
import { components } from "./_generated/api";

const authComponent = createClient(components.betterAuth);

export const { getAuthUser } = authComponent.clientApi();
```

---

### B. Same-Schema Mode

Same-schema mode places all auth and organization tables in your root `convex/schema.ts`. This is the correct approach when using the Better Auth organization plugin, because it allows your own Convex functions to directly query tables like `member`, `organization`, and `invitation` via `ctx.db`.

**When to use:**
- You are using the Better Auth organization plugin
- You need to read/write org data from your own Convex mutations/queries
- You want all tables in one unified schema for simpler backups and migrations

**Integration path:** Use `createLocalAdapter()` (recommended) to produce adapter functions compatible with `createClient()`.

#### Step-by-step setup

##### 1. Define your schema — `convex/schema.ts`

Use the schema-only plugin shims (`organization`, `admin`) and `getConvexAuthTables` to generate table definitions:

```ts
// convex/schema.ts
import {
  getConvexAuthTables,
  organization,
  admin,
} from "@convex-dev/better-auth/schema";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const authTables = getConvexAuthTables({
  plugins: [
    organization({
      teams: { enabled: true },
      schema: {
        organization: {
          additionalFields: {
            subscription: { type: "string", defaultValue: "free" },
          },
        },
      },
    }),
    admin(),
  ],
});

export default defineSchema({
  ...authTables,
  // Your application tables
  projects: defineTable({
    name: v.string(),
    organizationId: v.string(),
  }),
});
```

##### 2. Create the local adapter — `convex/localAdapter.ts`

```ts
// convex/localAdapter.ts
import { createLocalAdapter } from "@convex-dev/better-auth/schema";
import { organization } from "better-auth/plugins/organization";
import { admin } from "better-auth/plugins/admin";
import schema from "./schema";

// Plugin list MUST match what you used in getConvexAuthTables in schema.ts
export const { adapter } = createLocalAdapter(schema, () => ({
  plugins: [
    organization({ teams: { enabled: true } }),
    admin(),
  ],
}));
```

> [!IMPORTANT]
> In `localAdapter.ts` you import the **real** plugins from `better-auth/plugins/*` (not the schema-only shims). The plugin list here must match the plugins used in `schema.ts` so that model names and fields align.

##### 3. Wire the client — `convex/auth.ts`

Pass the local adapter's API reference to `createClient()` instead of `components.betterAuth`:

```ts
// convex/auth.ts
import { createClient } from "@convex-dev/better-auth";
import { api } from "./_generated/api";
import schema from "./schema";
import type { DataModel } from "./_generated/dataModel";

const authComponent = createClient<DataModel, typeof schema>(
  // Point to the local adapter instead of the component
  { adapter: api.localAdapter.adapter },
  { local: { schema } },
);

export const { getAuthUser } = authComponent.clientApi();

// Export createAuth for use in http.ts
export const createAuth = (ctx: any) =>
  betterAuth({
    database: authComponent.adapter(ctx),
    // ... your Better Auth options
  });
```

##### 4. Register HTTP routes — `convex/http.ts`

```ts
// convex/http.ts
import { httpRouter } from "convex/server";
import { createAuth } from "./auth";
import { createClient } from "@convex-dev/better-auth";
import { api } from "./_generated/api";
import schema from "./schema";

const authComponent = createClient(
  { adapter: api.localAdapter.adapter },
  { local: { schema } },
);

const http = httpRouter();
authComponent.registerRoutes(http, createAuth, { cors: true });
export default http;
```

---

## Same-Schema Mode

### What it means

In **same-schema mode**, all Better Auth tables — including organization plugin tables like `organization`, `member`, `invitation`, `team`, and `teamMember` — are defined in your root `convex/schema.ts` rather than being isolated inside a Convex component.

### Why use it

The default component mode isolates auth tables inside the component's schema. This works well for basic auth, but creates a problem with the organization plugin: your root Convex functions cannot directly access component-internal tables. If you need to query org members, check invitations, or look up teams from your own mutations/queries, you need those tables in your root schema.

### How it differs from component mode

| Aspect | Component Mode | Same-Schema Mode |
|---|---|---|
| Table location | Component-internal schema | Root `convex/schema.ts` |
| Adapter | `components.betterAuth` (component API) | `api.localAdapter.adapter` (local adapter) |
| Direct `ctx.db` access | Auth tables only via component API | Full access to all auth + org tables |
| Organization plugin | Not fully supported | Fully supported end-to-end |
| Schema definition | Auto-generated `src/component/schema.ts` | `getConvexAuthTables(...)` in root schema |

---

## Supported Organization Plugin Features

The following organization plugin features are supported in **same-schema mode**:

### Tables

| Table | Description | `modelName` support | `additionalFields` support |
|---|---|---|---|
| `organization` | Organization records | ✅ | ✅ |
| `member` | Org membership (links users to orgs) | ✅ | ✅ |
| `invitation` | Org invitations | ✅ | ✅ |
| `team` | Teams within organizations | ❌ | ❌ |
| `teamMember` | Team membership | ❌ | ❌ |

### Session extensions

When the organization plugin is active:
- `activeOrganizationId` is added to sessions
- `activeTeamId` is added to sessions when `teams: { enabled: true }`

### Schema-only plugin shim capabilities

The `organization()` shim from `@convex-dev/better-auth/schema` provides:

- ✅ Full table field definitions matching the real `better-auth/plugins/organization` plugin
- ✅ Teams support via `teams: { enabled: true }`
- ✅ `modelName` for `organization`, `member`, and `invitation`
- ✅ `additionalFields` for `organization`, `member`, and `invitation`
- ❌ `modelName` for `team` and `teamMember` (not supported)
- ❌ Runtime hooks (`onOrganizationCreated`, etc.)
- ❌ Access control / RBAC configuration
- ❌ `organizationRole` table (custom roles must be implemented at the app layer)

---

## Indexes

Composite indexes are included for org-related tables to support efficient lookups used by Better Auth's organization API (e.g., finding a member by org + user, looking up invitations by email + org).

| Table | Index fields | Purpose |
|---|---|---|
| `member` | `["organizationId", "userId"]` | Find a member by org and user |
| `invitation` | `["email", "organizationId"]` | Find invitation by email and org |
| `teamMember` | `["teamId", "userId"]` | Find team membership by team and user |

These are automatically included when you use `getConvexAuthTables()` with the organization plugin. Without these indexes, org-heavy operations would require full table scans.

Core auth tables also include indexes for fields like `token`, `userId`, `email`, `accountId`, etc. See `src/client/create-schema.ts` for the complete list.

---

## Limitations

Be aware of these current limitations:

### Same-schema mode

- Organization tables (`organization`, `member`, `invitation`, `team`, `teamMember`) are intentionally **not** defined in the component schema (`src/component/schema.ts`) when using same-schema mode. Do not regenerate org tables into the component schema.
- `createLocalAdapter()` and `createLocalApi()` are the only supported ways to access root-schema auth tables from the Better Auth adapter. Do not mix component and same-schema adapter paths for org operations.

### Schema-only plugin shims

- The shims (`organization()`, `admin()` from `@convex-dev/better-auth/schema`) are **schema-only** — they produce table definitions but do not include runtime behavior from the real Better Auth plugins.
- No runtime hooks (e.g., `onOrganizationCreated`, `onMemberAdded`).
- No access-control / RBAC configuration. Custom roles must be implemented at the application layer.
- No `organizationRole` table in this implementation.
- `modelName` on `team` and `teamMember` is not supported. Use default table names.

### General

- `better-auth` peer dependency version `1.4.9` is required.
- Convex `>= 1.25.0` is required.

---

## Generated vs Manual Files

Understanding which files are generated and which are safe to edit:

| File | Type | Notes |
|---|---|---|
| `src/component/schema.ts` | **Auto-generated** | Component-scoped schema. Regenerated via `npx @better-auth/cli generate`. In same-schema mode, org tables are intentionally excluded from this file. Do not manually add org tables here. |
| `convex/schema.ts` (your app) | **Manual** | Your root schema. In same-schema mode, use `getConvexAuthTables(...)` to define auth + org tables here. Safe to edit. |
| `convex/localAdapter.ts` (your app) | **Manual** | Your local adapter definition. Created and maintained by you. |
| `convex/auth.ts` (your app) | **Manual** | Your auth client setup. Created and maintained by you. |
| `src/component/_generated/*` | **Auto-generated** | Convex component codegen. Do not edit. |

> [!WARNING]
> Do not regenerate org tables into the component schema when using same-schema mode. The component schema and root schema must not define the same tables, or you will get duplicate table errors.

---

## Migration / Adoption Notes

### For new projects

Choose your mode based on the [Quick Start](#quick-start) comparison table above. If you need the organization plugin, start with same-schema mode.

### For existing projects switching to same-schema mode

1. **Add auth + org tables to your root schema** using `getConvexAuthTables(...)` with the org plugin options
2. **Create `convex/localAdapter.ts`** using `createLocalAdapter()`
3. **Update `convex/auth.ts`** to pass `api.localAdapter.adapter` to `createClient()` instead of `components.betterAuth`
4. **Rerun codegen** (`npx convex dev` or `npx convex deploy`) after schema changes
5. **Validate org operations** — test creating organizations, inviting members, and team management after migration

> [!IMPORTANT]
> Same-schema mode and component mode are mutually exclusive for org tables. After switching, ensure your component schema does not include org table definitions.

---

## Exports / API Reference

### `@convex-dev/better-auth` (main entry)

| Export | Description |
|---|---|
| `createClient` | Backend API for the Better Auth component. Accepts either a component API or a local adapter API. |
| `createApi` | Create the component adapter API (for component mode). |
| `createLocalApi` | Low-level local adapter API for same-schema mode. Returns individual internal query/mutation functions. |
| `createLocalAdapter` | **Recommended** adapter bridge for same-schema mode. Wraps `createLocalApi()` into the `{ adapter: { create, findOne, ... } }` shape expected by `createClient()`. |
| `convexAdapter` | Convex database adapter factory for Better Auth options. |

### `@convex-dev/better-auth/schema`

| Export | Description |
|---|---|
| `getConvexAuthTables` | Dynamically generates Convex `defineTable()` definitions from Better Auth options. Spread into `defineSchema()`. |
| `organization` | Schema-only organization plugin shim. Use in `convex/schema.ts` to define org tables without importing the real plugin runtime. |
| `admin` | Schema-only admin plugin shim. Adds `role`, `banned`, `banReason`, `banExpires` to the user table and `impersonatedBy` to sessions. |
| `authTables` | Static component-scoped table definitions (re-exported from `src/component/schema.ts`). |
| `createLocalAdapter` | Also available from this entry point for convenience. |

---

## License

Apache-2.0
