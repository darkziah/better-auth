export declare const create: import("convex/server").RegisteredMutation<"public", {
    select?: string[] | undefined;
    onCreateHandle?: string | undefined;
    input: {
        data: {
            [x: string]: any;
            [x: number]: any;
            [x: symbol]: any;
        };
        model: string;
    };
}, Promise<any>>, findOne: import("convex/server").RegisteredQuery<"public", {
    join?: any;
    select?: string[] | undefined;
    where?: {
        operator?: "in" | "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | "not_in" | "contains" | "starts_with" | "ends_with" | undefined;
        connector?: "AND" | "OR" | undefined;
        field: string;
        value: string | number | boolean | number[] | string[] | null;
    }[] | undefined;
    model: string;
}, Promise<import("convex/server").GenericDocument | null>>, findMany: import("convex/server").RegisteredQuery<"public", {
    join?: any;
    limit?: number | undefined;
    where?: {
        operator?: "in" | "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | "not_in" | "contains" | "starts_with" | "ends_with" | undefined;
        connector?: "AND" | "OR" | undefined;
        field: string;
        value: string | number | boolean | number[] | string[] | null;
    }[] | undefined;
    sortBy?: {
        field: string;
        direction: "asc" | "desc";
    } | undefined;
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
}, Promise<import("convex/server").PaginationResult<import("convex/server").GenericDocument>>>, updateOne: import("convex/server").RegisteredMutation<"public", {
    onUpdateHandle?: string | undefined;
    input: {
        where?: {
            operator?: "in" | "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | "not_in" | "contains" | "starts_with" | "ends_with" | undefined;
            connector?: "AND" | "OR" | undefined;
            field: string;
            value: string | number | boolean | number[] | string[] | null;
        }[] | undefined;
        update: {
            [x: string]: unknown;
            [x: number]: unknown;
            [x: symbol]: unknown;
        };
        model: import("./_generated/dataModel.js").TableNames;
    };
}, Promise<any>>, updateMany: import("convex/server").RegisteredMutation<"public", {
    onUpdateHandle?: string | undefined;
    input: {
        where?: {
            operator?: "in" | "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | "not_in" | "contains" | "starts_with" | "ends_with" | undefined;
            connector?: "AND" | "OR" | undefined;
            field: string;
            value: string | number | boolean | number[] | string[] | null;
        }[] | undefined;
        update: {
            [x: string]: unknown;
            [x: number]: unknown;
            [x: symbol]: unknown;
        };
        model: import("./_generated/dataModel.js").TableNames;
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
}>>, deleteOne: import("convex/server").RegisteredMutation<"public", {
    onDeleteHandle?: string | undefined;
    input: {
        where?: {
            operator?: "in" | "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | "not_in" | "contains" | "starts_with" | "ends_with" | undefined;
            connector?: "AND" | "OR" | undefined;
            field: string;
            value: string | number | boolean | number[] | string[] | null;
        }[] | undefined;
        model: import("./_generated/dataModel.js").TableNames;
    };
}, Promise<import("convex/server").GenericDocument | undefined>>, deleteMany: import("convex/server").RegisteredMutation<"public", {
    onDeleteHandle?: string | undefined;
    input: {
        where?: {
            operator?: "in" | "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | "not_in" | "contains" | "starts_with" | "ends_with" | undefined;
            connector?: "AND" | "OR" | undefined;
            field: string;
            value: string | number | boolean | number[] | string[] | null;
        }[] | undefined;
        model: import("./_generated/dataModel.js").TableNames;
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
//# sourceMappingURL=adapter.d.ts.map