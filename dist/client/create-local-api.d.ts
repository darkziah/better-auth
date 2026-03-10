import type { BetterAuthOptions } from "better-auth/minimal";
import type { SchemaDefinition } from "convex/server";
/**
 * Create a local adapter API that operates directly against the root Convex
 * schema. Returns internal query/mutation function definitions that can be
 * exported from a Convex module file.
 *
 * This is the low-level API. For same-schema mode integration with
 * `createClient()`, prefer {@link createLocalAdapter} which wraps this
 * into the shape expected by the client.
 *
 * @example
 * ```ts
 * // convex/localAdapter.ts
 * import { createLocalApi } from "@convex-dev/better-auth";
 * import schema from "./schema";
 * export const { create, findOne, findMany, updateOne, updateMany, deleteOne, deleteMany }
 *   = createLocalApi(schema, () => ({ plugins: [organization()] }));
 * ```
 */
export declare const createLocalApi: <Schema extends SchemaDefinition<any, any>>(schema: Schema, createAuthOptions: (ctx: any) => BetterAuthOptions) => {
    create: import("convex/server").RegisteredMutation<"internal", {
        select?: string[] | undefined;
        onCreateHandle?: string | undefined;
        input: {
            model: string;
            data: {
                [x: string]: any;
                [x: number]: any;
                [x: symbol]: any;
            };
        };
    }, Promise<any>>;
    findOne: import("convex/server").RegisteredQuery<"internal", {
        join?: any;
        select?: string[] | undefined;
        where?: {
            operator?: "lt" | "lte" | "gt" | "gte" | "eq" | "in" | "not_in" | "ne" | "contains" | "starts_with" | "ends_with" | undefined;
            connector?: "AND" | "OR" | undefined;
            value: string | number | boolean | string[] | number[] | null;
            field: string;
        }[] | undefined;
        model: string;
    }, Promise<import("convex/server").GenericDocument | null>>;
    findMany: import("convex/server").RegisteredQuery<"internal", {
        join?: any;
        where?: {
            operator?: "lt" | "lte" | "gt" | "gte" | "eq" | "in" | "not_in" | "ne" | "contains" | "starts_with" | "ends_with" | undefined;
            connector?: "AND" | "OR" | undefined;
            value: string | number | boolean | string[] | number[] | null;
            field: string;
        }[] | undefined;
        sortBy?: {
            field: string;
            direction: "asc" | "desc";
        } | undefined;
        limit?: number | undefined;
        offset?: number | undefined;
        model: string;
        paginationOpts: {
            id?: number;
            endCursor?: string | null;
            maximumRowsRead?: number;
            maximumBytesRead?: number;
            numItems: number;
            cursor: string | null;
        };
    }, Promise<import("convex/server").PaginationResult<import("convex/server").GenericDocument>>>;
    updateOne: import("convex/server").RegisteredMutation<"internal", {
        onUpdateHandle?: string | undefined;
        input: {
            where?: {
                operator?: "lt" | "lte" | "gt" | "gte" | "eq" | "in" | "not_in" | "ne" | "contains" | "starts_with" | "ends_with" | undefined;
                connector?: "AND" | "OR" | undefined;
                value: string | number | boolean | string[] | number[] | null;
                field: string;
            }[] | undefined;
            model: string;
            update: {
                [x: string]: unknown;
                [x: number]: unknown;
                [x: symbol]: unknown;
            };
        };
    }, Promise<any>>;
    updateMany: import("convex/server").RegisteredMutation<"internal", {
        onUpdateHandle?: string | undefined;
        input: {
            where?: {
                operator?: "lt" | "lte" | "gt" | "gte" | "eq" | "in" | "not_in" | "ne" | "contains" | "starts_with" | "ends_with" | undefined;
                connector?: "AND" | "OR" | undefined;
                value: string | number | boolean | string[] | number[] | null;
                field: string;
            }[] | undefined;
            model: string;
            update: {
                [x: string]: unknown;
                [x: number]: unknown;
                [x: symbol]: unknown;
            };
        };
        paginationOpts: {
            id?: number;
            endCursor?: string | null;
            maximumRowsRead?: number;
            maximumBytesRead?: number;
            numItems: number;
            cursor: string | null;
        };
    }, Promise<{
        count: number;
        ids: import("convex/values").Value[];
        isDone: boolean;
        continueCursor: import("convex/server").Cursor;
        splitCursor?: import("convex/server").Cursor | null;
        pageStatus?: "SplitRecommended" | "SplitRequired" | null;
    }>>;
    deleteOne: import("convex/server").RegisteredMutation<"internal", {
        onDeleteHandle?: string | undefined;
        input: {
            where?: {
                operator?: "lt" | "lte" | "gt" | "gte" | "eq" | "in" | "not_in" | "ne" | "contains" | "starts_with" | "ends_with" | undefined;
                connector?: "AND" | "OR" | undefined;
                value: string | number | boolean | string[] | number[] | null;
                field: string;
            }[] | undefined;
            model: string;
        };
    }, Promise<import("convex/server").GenericDocument | undefined>>;
    deleteMany: import("convex/server").RegisteredMutation<"internal", {
        onDeleteHandle?: string | undefined;
        input: {
            where?: {
                operator?: "lt" | "lte" | "gt" | "gte" | "eq" | "in" | "not_in" | "ne" | "contains" | "starts_with" | "ends_with" | undefined;
                connector?: "AND" | "OR" | undefined;
                value: string | number | boolean | string[] | number[] | null;
                field: string;
            }[] | undefined;
            model: string;
        };
        paginationOpts: {
            id?: number;
            endCursor?: string | null;
            maximumRowsRead?: number;
            maximumBytesRead?: number;
            numItems: number;
            cursor: string | null;
        };
    }, Promise<{
        count: number;
        ids: import("convex/values").Value[];
        isDone: boolean;
        continueCursor: import("convex/server").Cursor;
        splitCursor?: import("convex/server").Cursor | null;
        pageStatus?: "SplitRecommended" | "SplitRequired" | null;
    }>>;
};
/**
 * Create adapter functions for **same-schema mode** — where auth tables
 * (including organization plugin tables) live in the root Convex schema
 * instead of being scoped to a component.
 *
 * Returns an `adapter` object whose shape matches `SlimComponentApi["adapter"]`
 * from `create-client.ts`. Export these from a Convex module file, then pass
 * the module's API to `createClient()` instead of the component API.
 *
 * @example
 * ```ts
 * // convex/localAdapter.ts — export the adapter functions
 * import { createLocalAdapter } from "@convex-dev/better-auth/schema";
 * import { organization } from "@convex-dev/better-auth/schema";
 * import schema from "./schema";
 *
 * export const { adapter } = createLocalAdapter(schema, () => ({
 *   plugins: [organization({ teams: { enabled: true } })],
 * }));
 * // This creates: adapter.create, adapter.findOne, adapter.findMany, etc.
 * ```
 *
 * ```ts
 * // convex/auth.ts — wire the adapter into createClient
 * import { createClient } from "@convex-dev/better-auth";
 * import { api } from "./_generated/api";
 *
 * // Pass the local adapter instead of `components.betterAuth`
 * const authComponent = createClient(
 *   { adapter: api.localAdapter.adapter },
 *   { local: { schema } }
 * );
 * ```
 *
 * @param schema - Your root `convex/schema.ts` (must include auth + org tables
 *   via `getConvexAuthTables`).
 * @param createAuthOptions - Factory returning Better Auth options. Must include
 *   the same plugins used in `getConvexAuthTables` in your schema.
 */
export declare const createLocalAdapter: <Schema extends SchemaDefinition<any, any>>(schema: Schema, createAuthOptions: (ctx: any) => BetterAuthOptions) => {
    adapter: {
        create: import("convex/server").RegisteredMutation<"internal", {
            select?: string[] | undefined;
            onCreateHandle?: string | undefined;
            input: {
                model: string;
                data: {
                    [x: string]: any;
                    [x: number]: any;
                    [x: symbol]: any;
                };
            };
        }, Promise<any>>;
        findOne: import("convex/server").RegisteredQuery<"internal", {
            join?: any;
            select?: string[] | undefined;
            where?: {
                operator?: "lt" | "lte" | "gt" | "gte" | "eq" | "in" | "not_in" | "ne" | "contains" | "starts_with" | "ends_with" | undefined;
                connector?: "AND" | "OR" | undefined;
                value: string | number | boolean | string[] | number[] | null;
                field: string;
            }[] | undefined;
            model: string;
        }, Promise<import("convex/server").GenericDocument | null>>;
        findMany: import("convex/server").RegisteredQuery<"internal", {
            join?: any;
            where?: {
                operator?: "lt" | "lte" | "gt" | "gte" | "eq" | "in" | "not_in" | "ne" | "contains" | "starts_with" | "ends_with" | undefined;
                connector?: "AND" | "OR" | undefined;
                value: string | number | boolean | string[] | number[] | null;
                field: string;
            }[] | undefined;
            sortBy?: {
                field: string;
                direction: "asc" | "desc";
            } | undefined;
            limit?: number | undefined;
            offset?: number | undefined;
            model: string;
            paginationOpts: {
                id?: number;
                endCursor?: string | null;
                maximumRowsRead?: number;
                maximumBytesRead?: number;
                numItems: number;
                cursor: string | null;
            };
        }, Promise<import("convex/server").PaginationResult<import("convex/server").GenericDocument>>>;
        updateOne: import("convex/server").RegisteredMutation<"internal", {
            onUpdateHandle?: string | undefined;
            input: {
                where?: {
                    operator?: "lt" | "lte" | "gt" | "gte" | "eq" | "in" | "not_in" | "ne" | "contains" | "starts_with" | "ends_with" | undefined;
                    connector?: "AND" | "OR" | undefined;
                    value: string | number | boolean | string[] | number[] | null;
                    field: string;
                }[] | undefined;
                model: string;
                update: {
                    [x: string]: unknown;
                    [x: number]: unknown;
                    [x: symbol]: unknown;
                };
            };
        }, Promise<any>>;
        updateMany: import("convex/server").RegisteredMutation<"internal", {
            onUpdateHandle?: string | undefined;
            input: {
                where?: {
                    operator?: "lt" | "lte" | "gt" | "gte" | "eq" | "in" | "not_in" | "ne" | "contains" | "starts_with" | "ends_with" | undefined;
                    connector?: "AND" | "OR" | undefined;
                    value: string | number | boolean | string[] | number[] | null;
                    field: string;
                }[] | undefined;
                model: string;
                update: {
                    [x: string]: unknown;
                    [x: number]: unknown;
                    [x: symbol]: unknown;
                };
            };
            paginationOpts: {
                id?: number;
                endCursor?: string | null;
                maximumRowsRead?: number;
                maximumBytesRead?: number;
                numItems: number;
                cursor: string | null;
            };
        }, Promise<{
            count: number;
            ids: import("convex/values").Value[];
            isDone: boolean;
            continueCursor: import("convex/server").Cursor;
            splitCursor?: import("convex/server").Cursor | null;
            pageStatus?: "SplitRecommended" | "SplitRequired" | null;
        }>>;
        deleteOne: import("convex/server").RegisteredMutation<"internal", {
            onDeleteHandle?: string | undefined;
            input: {
                where?: {
                    operator?: "lt" | "lte" | "gt" | "gte" | "eq" | "in" | "not_in" | "ne" | "contains" | "starts_with" | "ends_with" | undefined;
                    connector?: "AND" | "OR" | undefined;
                    value: string | number | boolean | string[] | number[] | null;
                    field: string;
                }[] | undefined;
                model: string;
            };
        }, Promise<import("convex/server").GenericDocument | undefined>>;
        deleteMany: import("convex/server").RegisteredMutation<"internal", {
            onDeleteHandle?: string | undefined;
            input: {
                where?: {
                    operator?: "lt" | "lte" | "gt" | "gte" | "eq" | "in" | "not_in" | "ne" | "contains" | "starts_with" | "ends_with" | undefined;
                    connector?: "AND" | "OR" | undefined;
                    value: string | number | boolean | string[] | number[] | null;
                    field: string;
                }[] | undefined;
                model: string;
            };
            paginationOpts: {
                id?: number;
                endCursor?: string | null;
                maximumRowsRead?: number;
                maximumBytesRead?: number;
                numItems: number;
                cursor: string | null;
            };
        }, Promise<{
            count: number;
            ids: import("convex/values").Value[];
            isDone: boolean;
            continueCursor: import("convex/server").Cursor;
            splitCursor?: import("convex/server").Cursor | null;
            pageStatus?: "SplitRecommended" | "SplitRequired" | null;
        }>>;
    };
};
//# sourceMappingURL=create-local-api.d.ts.map