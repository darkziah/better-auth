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
type DBPrimitive = string | number | boolean | Date | null | undefined | string[] | number[] | (Record<string, unknown> | unknown[]);
interface SchemaField {
    type: "string" | "number" | "boolean" | "date";
    required?: boolean;
    returned?: boolean;
    input?: boolean;
    defaultValue?: DBPrimitive | (() => DBPrimitive);
    onUpdate?: () => DBPrimitive;
    transform?: {
        input?: (value: any) => any;
        output?: (value: any) => any;
    };
    references?: {
        model: string;
        field: string;
        onDelete?: "no action" | "restrict" | "cascade" | "set null" | "set default";
    };
    unique?: boolean;
    bigint?: boolean;
    validator?: {
        input?: any;
        output?: any;
    };
    fieldName?: string;
    sortable?: boolean;
    index?: boolean;
}
interface PluginSchemaTable {
    fields: Record<string, SchemaField>;
    disableMigration?: boolean;
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