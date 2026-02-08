import type { BetterAuthOptions } from "better-auth/minimal";
import type { SchemaDefinition } from "convex/server";
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
            field: string;
            value: string | number | boolean | number[] | string[] | null;
        }[] | undefined;
        model: string;
    }, Promise<import("convex/server").GenericDocument | null>>;
    findMany: import("convex/server").RegisteredQuery<"internal", {
        join?: any;
        where?: {
            operator?: "lt" | "lte" | "gt" | "gte" | "eq" | "in" | "not_in" | "ne" | "contains" | "starts_with" | "ends_with" | undefined;
            connector?: "AND" | "OR" | undefined;
            field: string;
            value: string | number | boolean | number[] | string[] | null;
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
                field: string;
                value: string | number | boolean | number[] | string[] | null;
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
                field: string;
                value: string | number | boolean | number[] | string[] | null;
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
                field: string;
                value: string | number | boolean | number[] | string[] | null;
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
                field: string;
                value: string | number | boolean | number[] | string[] | null;
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
//# sourceMappingURL=create-local-api.d.ts.map