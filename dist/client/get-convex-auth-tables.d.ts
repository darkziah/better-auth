import type { BetterAuthDBSchema } from "better-auth/db";
import type { BetterAuthOptions } from "better-auth/minimal";
/**
 * Inlined from @better-auth/core/src/db/get-tables.ts to avoid importing
 * the heavy "better-auth/db" barrel (which pulls in adapters, migrations, etc.)
 * that breaks Convex's restricted schema evaluator.
 *
 * Source: @better-auth/core v1.2.8
 * This function is pure — zero runtime dependencies.
 */
export declare const getAuthTables: (options: BetterAuthOptions) => BetterAuthDBSchema;
/**
 * Dynamically generate Convex table definitions from BetterAuthOptions.
 * Unlike the static `authTables`, this function resolves all plugin schemas
 * (e.g. organization, admin) at runtime and returns ready-to-use
 * `defineTable()` objects that can be spread into `defineSchema()`.
 *
 * @example
 * ```ts
 * import { getConvexAuthTables } from "@convex-dev/better-auth";
 * import { defineSchema } from "convex/server";
 * import { organization } from "better-auth/plugins/organization";
 *
 * export default defineSchema({
 *   ...getConvexAuthTables({ plugins: [organization()] }),
 * });
 * ```
 */
export declare function getConvexAuthTables(options: BetterAuthOptions): Record<string, any>;
//# sourceMappingURL=get-convex-auth-tables.d.ts.map