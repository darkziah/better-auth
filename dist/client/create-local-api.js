import { internalMutationGeneric, internalQueryGeneric, paginationOptsValidator, } from "convex/server";
import { v } from "convex/values";
import { asyncMap } from "convex-helpers";
import { partial } from "convex-helpers/validators";
import { adapterWhereValidator, checkUniqueFields, hasUniqueFields, listOne, paginate, selectFields, } from "./adapter-utils.js";
import { getAuthTables } from "./get-convex-auth-tables.js";
const whereValidator = (schema, tableName) => v.object({
    field: v.union(...Object.keys(schema.tables[tableName].validator.fields).map((field) => v.literal(field)), v.literal("_id")),
    operator: v.optional(v.union(v.literal("lt"), v.literal("lte"), v.literal("gt"), v.literal("gte"), v.literal("eq"), v.literal("in"), v.literal("not_in"), v.literal("ne"), v.literal("contains"), v.literal("starts_with"), v.literal("ends_with"))),
    value: v.union(v.string(), v.number(), v.boolean(), v.array(v.string()), v.array(v.number()), v.null()),
    connector: v.optional(v.union(v.literal("AND"), v.literal("OR"))),
});
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
export const createLocalApi = (schema, createAuthOptions) => {
    const betterAuthSchema = getAuthTables(createAuthOptions({}));
    return {
        create: internalMutationGeneric({
            args: {
                input: v.union(...Object.entries(schema.tables).map(([model, table]) => v.object({
                    model: v.literal(model),
                    data: v.object(table.validator.fields),
                }))),
                select: v.optional(v.array(v.string())),
                onCreateHandle: v.optional(v.string()),
            },
            handler: async (ctx, args) => {
                await checkUniqueFields(ctx, schema, betterAuthSchema, args.input.model, args.input.data);
                const id = await ctx.db.insert(args.input.model, args.input.data);
                const doc = await ctx.db.get(id);
                if (!doc) {
                    throw new Error(`Failed to create ${args.input.model}`);
                }
                const result = selectFields(doc, args.select);
                if (args.onCreateHandle) {
                    await ctx.runMutation(args.onCreateHandle, {
                        model: args.input.model,
                        doc,
                    });
                }
                return result;
            },
        }),
        findOne: internalQueryGeneric({
            args: {
                model: v.union(...Object.keys(schema.tables).map((model) => v.literal(model))),
                where: v.optional(v.array(adapterWhereValidator)),
                select: v.optional(v.array(v.string())),
                join: v.optional(v.any()),
            },
            handler: async (ctx, args) => {
                return await listOne(ctx, schema, betterAuthSchema, args);
            },
        }),
        findMany: internalQueryGeneric({
            args: {
                model: v.union(...Object.keys(schema.tables).map((model) => v.literal(model))),
                where: v.optional(v.array(adapterWhereValidator)),
                limit: v.optional(v.number()),
                sortBy: v.optional(v.object({
                    direction: v.union(v.literal("asc"), v.literal("desc")),
                    field: v.string(),
                })),
                offset: v.optional(v.number()),
                join: v.optional(v.any()),
                paginationOpts: paginationOptsValidator,
            },
            handler: async (ctx, args) => {
                return await paginate(ctx, schema, betterAuthSchema, args);
            },
        }),
        updateOne: internalMutationGeneric({
            args: {
                input: v.union(...Object.entries(schema.tables).map(([name, table]) => {
                    const tableName = name;
                    const fields = partial(table.validator.fields);
                    return v.object({
                        model: v.literal(tableName),
                        update: v.object(fields),
                        where: v.optional(v.array(whereValidator(schema, tableName))),
                    });
                })),
                onUpdateHandle: v.optional(v.string()),
            },
            handler: async (ctx, args) => {
                const doc = await listOne(ctx, schema, betterAuthSchema, args.input);
                if (!doc) {
                    throw new Error(`Failed to update ${args.input.model}`);
                }
                await checkUniqueFields(ctx, schema, betterAuthSchema, args.input.model, args.input.update, doc);
                await ctx.db.patch(doc._id, args.input.update);
                const updatedDoc = await ctx.db.get(doc._id);
                if (!updatedDoc) {
                    throw new Error(`Failed to update ${args.input.model}`);
                }
                if (args.onUpdateHandle) {
                    await ctx.runMutation(args.onUpdateHandle, {
                        model: args.input.model,
                        newDoc: updatedDoc,
                        oldDoc: doc,
                    });
                }
                return updatedDoc;
            },
        }),
        updateMany: internalMutationGeneric({
            args: {
                input: v.union(...Object.entries(schema.tables).map(([name, table]) => {
                    const tableName = name;
                    const fields = partial(table.validator.fields);
                    return v.object({
                        model: v.literal(tableName),
                        update: v.object(fields),
                        where: v.optional(v.array(whereValidator(schema, tableName))),
                    });
                })),
                paginationOpts: paginationOptsValidator,
                onUpdateHandle: v.optional(v.string()),
            },
            handler: async (ctx, args) => {
                const { page, ...result } = await paginate(ctx, schema, betterAuthSchema, {
                    ...args.input,
                    paginationOpts: args.paginationOpts,
                });
                if (args.input.update) {
                    if (hasUniqueFields(betterAuthSchema, args.input.model, args.input.update ?? {}) &&
                        page.length > 1) {
                        throw new Error(`Attempted to set unique fields in multiple documents in ${args.input.model} with the same value. Fields: ${Object.keys(args.input.update ?? {}).join(", ")}`);
                    }
                    await asyncMap(page, async (doc) => {
                        await checkUniqueFields(ctx, schema, betterAuthSchema, args.input.model, args.input.update ?? {}, doc);
                        await ctx.db.patch(doc._id, args.input.update);
                        if (args.onUpdateHandle) {
                            await ctx.runMutation(args.onUpdateHandle, {
                                model: args.input.model,
                                newDoc: await ctx.db.get(doc._id),
                                oldDoc: doc,
                            });
                        }
                    });
                }
                return {
                    ...result,
                    count: page.length,
                    ids: page.map((doc) => doc._id),
                };
            },
        }),
        deleteOne: internalMutationGeneric({
            args: {
                input: v.union(...Object.keys(schema.tables).map((name) => {
                    const tableName = name;
                    return v.object({
                        model: v.literal(tableName),
                        where: v.optional(v.array(whereValidator(schema, tableName))),
                    });
                })),
                onDeleteHandle: v.optional(v.string()),
            },
            handler: async (ctx, args) => {
                const doc = await listOne(ctx, schema, betterAuthSchema, args.input);
                if (!doc) {
                    return;
                }
                await ctx.db.delete(doc._id);
                if (args.onDeleteHandle) {
                    await ctx.runMutation(args.onDeleteHandle, { model: args.input.model, doc });
                }
                return doc;
            },
        }),
        deleteMany: internalMutationGeneric({
            args: {
                input: v.union(...Object.keys(schema.tables).map((name) => {
                    const tableName = name;
                    return v.object({
                        model: v.literal(tableName),
                        where: v.optional(v.array(whereValidator(schema, tableName))),
                    });
                })),
                paginationOpts: paginationOptsValidator,
                onDeleteHandle: v.optional(v.string()),
            },
            handler: async (ctx, args) => {
                const { page, ...result } = await paginate(ctx, schema, betterAuthSchema, {
                    ...args.input,
                    paginationOpts: args.paginationOpts,
                });
                await asyncMap(page, async (doc) => {
                    if (args.onDeleteHandle) {
                        await ctx.runMutation(args.onDeleteHandle, {
                            model: args.input.model,
                            doc,
                        });
                    }
                    await ctx.db.delete(doc._id);
                });
                return {
                    ...result,
                    count: page.length,
                    ids: page.map((doc) => doc._id),
                };
            },
        }),
    };
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
export const createLocalAdapter = (schema, createAuthOptions) => {
    const api = createLocalApi(schema, createAuthOptions);
    return {
        adapter: {
            create: api.create,
            findOne: api.findOne,
            findMany: api.findMany,
            updateOne: api.updateOne,
            updateMany: api.updateMany,
            deleteOne: api.deleteOne,
            deleteMany: api.deleteMany,
        },
    };
};
//# sourceMappingURL=create-local-api.js.map