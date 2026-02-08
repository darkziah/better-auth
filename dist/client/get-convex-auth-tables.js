import { defineTable } from "convex/server";
import { v } from "convex/values";
import { indexFields } from "./create-schema.js";
/**
 * Inlined from @better-auth/core/src/db/get-tables.ts to avoid importing
 * the heavy "better-auth/db" barrel (which pulls in adapters, migrations, etc.)
 * that breaks Convex's restricted schema evaluator.
 *
 * Source: @better-auth/core v1.2.8
 * This function is pure — zero runtime dependencies.
 */
export const getAuthTables = (options) => {
    const pluginSchema = (options.plugins ?? []).reduce((acc, plugin) => {
        const schema = plugin.schema;
        if (!schema)
            return acc;
        for (const [key, value] of Object.entries(schema)) {
            acc[key] = {
                fields: {
                    ...acc[key]?.fields,
                    ...value.fields,
                },
                modelName: value.modelName || key,
            };
        }
        return acc;
    }, {});
    const shouldAddRateLimitTable = options.rateLimit?.storage === "database";
    const rateLimitTable = {
        rateLimit: {
            modelName: options.rateLimit?.modelName || "rateLimit",
            fields: {
                key: {
                    type: "string",
                    fieldName: options.rateLimit?.fields?.key || "key",
                },
                count: {
                    type: "number",
                    fieldName: options.rateLimit?.fields?.count || "count",
                },
                lastRequest: {
                    type: "number",
                    bigint: true,
                    fieldName: options.rateLimit?.fields?.lastRequest || "lastRequest",
                },
            },
        },
    };
    const { user, session, account, verification, ...pluginTables } = pluginSchema;
    const sessionTable = {
        session: {
            modelName: options.session?.modelName || "session",
            fields: {
                expiresAt: {
                    type: "date",
                    required: true,
                    fieldName: options.session?.fields?.expiresAt || "expiresAt",
                },
                token: {
                    type: "string",
                    required: true,
                    fieldName: options.session?.fields?.token || "token",
                    unique: true,
                },
                createdAt: {
                    type: "date",
                    required: true,
                    fieldName: options.session?.fields?.createdAt || "createdAt",
                    defaultValue: () => new Date(),
                },
                updatedAt: {
                    type: "date",
                    required: true,
                    fieldName: options.session?.fields?.updatedAt || "updatedAt",
                    onUpdate: () => new Date(),
                },
                ipAddress: {
                    type: "string",
                    required: false,
                    fieldName: options.session?.fields?.ipAddress || "ipAddress",
                },
                userAgent: {
                    type: "string",
                    required: false,
                    fieldName: options.session?.fields?.userAgent || "userAgent",
                },
                userId: {
                    type: "string",
                    fieldName: options.session?.fields?.userId || "userId",
                    references: {
                        model: options.user?.modelName || "user",
                        field: "id",
                        onDelete: "cascade",
                    },
                    required: true,
                    index: true,
                },
                ...session?.fields,
                ...options.session?.additionalFields,
            },
            order: 2,
        },
    };
    return {
        user: {
            modelName: options.user?.modelName || "user",
            fields: {
                name: {
                    type: "string",
                    required: true,
                    fieldName: options.user?.fields?.name || "name",
                    sortable: true,
                },
                email: {
                    type: "string",
                    unique: true,
                    required: true,
                    fieldName: options.user?.fields?.email || "email",
                    sortable: true,
                },
                emailVerified: {
                    type: "boolean",
                    defaultValue: false,
                    required: true,
                    fieldName: options.user?.fields?.emailVerified || "emailVerified",
                    input: false,
                },
                image: {
                    type: "string",
                    required: false,
                    fieldName: options.user?.fields?.image || "image",
                },
                createdAt: {
                    type: "date",
                    defaultValue: () => new Date(),
                    required: true,
                    fieldName: options.user?.fields?.createdAt || "createdAt",
                },
                updatedAt: {
                    type: "date",
                    defaultValue: () => new Date(),
                    onUpdate: () => new Date(),
                    required: true,
                    fieldName: options.user?.fields?.updatedAt || "updatedAt",
                },
                ...user?.fields,
                ...options.user?.additionalFields,
            },
            order: 1,
        },
        ...(!options.secondaryStorage || options.session?.storeSessionInDatabase
            ? sessionTable
            : {}),
        account: {
            modelName: options.account?.modelName || "account",
            fields: {
                accountId: {
                    type: "string",
                    required: true,
                    fieldName: options.account?.fields?.accountId || "accountId",
                },
                providerId: {
                    type: "string",
                    required: true,
                    fieldName: options.account?.fields?.providerId || "providerId",
                },
                userId: {
                    type: "string",
                    references: {
                        model: options.user?.modelName || "user",
                        field: "id",
                        onDelete: "cascade",
                    },
                    required: true,
                    fieldName: options.account?.fields?.userId || "userId",
                    index: true,
                },
                accessToken: {
                    type: "string",
                    required: false,
                    fieldName: options.account?.fields?.accessToken || "accessToken",
                },
                refreshToken: {
                    type: "string",
                    required: false,
                    fieldName: options.account?.fields?.refreshToken || "refreshToken",
                },
                idToken: {
                    type: "string",
                    required: false,
                    fieldName: options.account?.fields?.idToken || "idToken",
                },
                accessTokenExpiresAt: {
                    type: "date",
                    required: false,
                    fieldName: options.account?.fields?.accessTokenExpiresAt ||
                        "accessTokenExpiresAt",
                },
                refreshTokenExpiresAt: {
                    type: "date",
                    required: false,
                    fieldName: options.account?.fields?.refreshTokenExpiresAt ||
                        "refreshTokenExpiresAt",
                },
                scope: {
                    type: "string",
                    required: false,
                    fieldName: options.account?.fields?.scope || "scope",
                },
                password: {
                    type: "string",
                    required: false,
                    fieldName: options.account?.fields?.password || "password",
                },
                createdAt: {
                    type: "date",
                    required: true,
                    fieldName: options.account?.fields?.createdAt || "createdAt",
                    defaultValue: () => new Date(),
                },
                updatedAt: {
                    type: "date",
                    required: true,
                    fieldName: options.account?.fields?.updatedAt || "updatedAt",
                    onUpdate: () => new Date(),
                },
                ...account?.fields,
                ...options.account?.additionalFields,
            },
            order: 3,
        },
        verification: {
            modelName: options.verification?.modelName || "verification",
            fields: {
                identifier: {
                    type: "string",
                    required: true,
                    fieldName: options.verification?.fields?.identifier || "identifier",
                    index: true,
                },
                value: {
                    type: "string",
                    required: true,
                    fieldName: options.verification?.fields?.value || "value",
                },
                expiresAt: {
                    type: "date",
                    required: true,
                    fieldName: options.verification?.fields?.expiresAt || "expiresAt",
                },
                createdAt: {
                    type: "date",
                    required: true,
                    defaultValue: () => new Date(),
                    fieldName: options.verification?.fields?.createdAt || "createdAt",
                },
                updatedAt: {
                    type: "date",
                    required: true,
                    defaultValue: () => new Date(),
                    onUpdate: () => new Date(),
                    fieldName: options.verification?.fields?.updatedAt || "updatedAt",
                },
                ...verification?.fields,
                ...options.verification?.additionalFields,
            },
            order: 4,
        },
        ...pluginTables,
        ...(shouldAddRateLimitTable ? rateLimitTable : {}),
    };
};
// Return map of unique, sortable, and reference fields
const specialFields = (tables) => Object.fromEntries(Object.entries(tables)
    .map(([key, table]) => {
    const fields = Object.fromEntries(Object.entries(table.fields)
        .map(([fieldKey, field]) => [
        field.fieldName ?? fieldKey,
        {
            ...(field.sortable ? { sortable: true } : {}),
            ...(field.unique ? { unique: true } : {}),
            ...(field.references ? { references: field.references } : {}),
        },
    ])
        .filter(([_key, value]) => typeof value === "object" ? Object.keys(value).length > 0 : true));
    return [key, fields];
})
    .filter(([_key, value]) => typeof value === "object" ? Object.keys(value).length > 0 : true));
const mergedIndexFields = (tables) => Object.fromEntries(Object.entries(tables).map(([key, table]) => {
    const manualIndexes = indexFields[key]?.map((index) => {
        return typeof index === "string"
            ? (table.fields[index]?.fieldName ?? index)
            : index.map((i) => table.fields[i]?.fieldName ?? i);
    }) || [];
    const specialFieldIndexes = Object.keys(specialFields(tables)[key] ||
        {}).filter((index) => !manualIndexes.some((m) => Array.isArray(m) ? m[0] === index : m === index));
    return [key, manualIndexes.concat(specialFieldIndexes)];
}));
function getValidator(field) {
    const type = field.type;
    const typeMap = {
        string: () => v.string(),
        boolean: () => v.boolean(),
        number: () => v.number(),
        date: () => v.number(),
        json: () => v.string(),
        "number[]": () => v.array(v.number()),
        "string[]": () => v.array(v.string()),
    };
    return typeMap[type]();
}
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
export function getConvexAuthTables(options) {
    const tables = getAuthTables(options);
    const allIndexFields = mergedIndexFields(tables);
    const result = {};
    for (const tableKey in tables) {
        const table = tables[tableKey];
        const modelName = table.modelName;
        const fields = Object.fromEntries(Object.entries(table.fields).filter(([key]) => key !== "id"));
        const validatorFields = {};
        for (const fieldKey in fields) {
            const attr = fields[fieldKey];
            const fieldName = attr.fieldName ?? fieldKey;
            const fieldValidator = getValidator(attr);
            validatorFields[fieldName] = attr.required
                ? fieldValidator
                : v.optional(v.union(v.null(), fieldValidator));
        }
        let tableDef = defineTable(validatorFields);
        const tableIndexes = allIndexFields[tableKey] || [];
        for (const index of tableIndexes) {
            const indexArray = Array.isArray(index)
                ? index.sort()
                : [index];
            const indexName = indexArray.join("_");
            tableDef = tableDef.index(indexName, indexArray);
        }
        result[modelName] = tableDef;
    }
    return result;
}
//# sourceMappingURL=get-convex-auth-tables.js.map