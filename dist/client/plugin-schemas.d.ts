/**
 * Lightweight, schema-only plugin factories for use in Convex schema files.
 *
 * These return the same `{ id, schema }` shape as the real better-auth plugins
 * but without pulling in any heavy runtime code (endpoints, adapters, etc.)
 * that breaks Convex's restricted schema evaluator.
 *
 * Use these in your `convex/schema.ts` instead of importing from
 * `better-auth/plugins/*`.
 *
 * @example
 * ```ts
 * import { getConvexAuthTables, organization, admin } from "@convex-dev/better-auth/schema";
 * import { defineSchema } from "convex/server";
 *
 * export default defineSchema({
 *   ...getConvexAuthTables({
 *     plugins: [organization({ teams: { enabled: true } }), admin()],
 *   }),
 * });
 * ```
 */
interface SchemaField {
    type: "string" | "number" | "boolean" | "date";
    required?: boolean;
    sortable?: boolean;
    unique?: boolean;
    index?: boolean;
    input?: boolean;
    defaultValue?: unknown;
    references?: {
        model: string;
        field: string;
    };
    fieldName?: string;
}
interface PluginSchemaTable {
    fields: Record<string, SchemaField>;
    modelName?: string;
}
interface SchemaOnlyPlugin {
    id: string;
    schema: Record<string, PluginSchemaTable>;
}
/**
 * Schema-only version of `organization()` from `better-auth/plugins/organization`.
 *
 * Returns the same schema shapes the real plugin produces, without heavy
 * runtime dependencies.
 */
export declare function organization(options?: {
    teams?: {
        enabled?: boolean;
    };
    schema?: {
        organization?: {
            additionalFields?: Record<string, SchemaField>;
        };
        invitation?: {
            additionalFields?: Record<string, SchemaField>;
        };
    };
}): SchemaOnlyPlugin;
/**
 * Schema-only version of `admin()` from `better-auth/plugins/admin`.
 *
 * Returns the same schema shapes the real plugin produces, without heavy
 * runtime dependencies.
 */
export declare function admin(): SchemaOnlyPlugin;
export {};
//# sourceMappingURL=plugin-schemas.d.ts.map