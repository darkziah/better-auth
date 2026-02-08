import { getAuthTables } from "better-auth/db";
import type { BetterAuthDBSchema, DBFieldAttribute } from "better-auth/db";
import type { BetterAuthOptions } from "better-auth/minimal";
import { defineTable } from "convex/server";
import { v } from "convex/values";
import { indexFields } from "./create-schema.js";

// Return map of unique, sortable, and reference fields
const specialFields = (tables: BetterAuthDBSchema) =>
  Object.fromEntries(
    Object.entries(tables)
      .map(([key, table]) => {
        const fields = Object.fromEntries(
          Object.entries(table.fields)
            .map(([fieldKey, field]) => [
              field.fieldName ?? fieldKey,
              {
                ...(field.sortable ? { sortable: true } : {}),
                ...(field.unique ? { unique: true } : {}),
                ...(field.references ? { references: field.references } : {}),
              },
            ])
            .filter(([_key, value]) =>
              typeof value === "object" ? Object.keys(value).length > 0 : true
            )
        );
        return [key, fields];
      })
      .filter(([_key, value]) =>
        typeof value === "object" ? Object.keys(value).length > 0 : true
      )
  );

const mergedIndexFields = (tables: BetterAuthDBSchema) =>
  Object.fromEntries(
    Object.entries(tables).map(([key, table]) => {
      const manualIndexes =
        indexFields[key as keyof typeof indexFields]?.map((index) => {
          return typeof index === "string"
            ? (table.fields[index]?.fieldName ?? index)
            : index.map((i) => table.fields[i]?.fieldName ?? i);
        }) || [];
      const specialFieldIndexes = Object.keys(
        specialFields(tables)[key as keyof ReturnType<typeof specialFields>] ||
          {}
      ).filter(
        (index) =>
          !manualIndexes.some((m) =>
            Array.isArray(m) ? m[0] === index : m === index
          )
      );
      return [key, manualIndexes.concat(specialFieldIndexes)];
    })
  );

function getValidator(field: DBFieldAttribute) {
  const type = field.type as
    | "string"
    | "number"
    | "boolean"
    | "date"
    | "json"
    | `${"string" | "number"}[]`;

  const typeMap = {
    string: () => v.string(),
    boolean: () => v.boolean(),
    number: () => v.number(),
    date: () => v.number(),
    json: () => v.string(),
    "number[]": () => v.array(v.number()),
    "string[]": () => v.array(v.string()),
  } as const;

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
export function getConvexAuthTables(
  options: BetterAuthOptions
): Record<string, any> {
  const tables = getAuthTables(options);
  const allIndexFields = mergedIndexFields(tables);
  const result: Record<string, any> = {};

  for (const tableKey in tables) {
    const table = tables[tableKey]!;
    const modelName = table.modelName;

    const fields = Object.fromEntries(
      Object.entries(table.fields).filter(([key]) => key !== "id")
    );

    const validatorFields: Record<string, any> = {};
    for (const fieldKey in fields) {
      const attr = fields[fieldKey]! as DBFieldAttribute;
      const fieldName = attr.fieldName ?? fieldKey;
      const fieldValidator = getValidator(attr);
      validatorFields[fieldName] = attr.required
        ? fieldValidator
        : v.optional(v.union(v.null(), fieldValidator));
    }

    let tableDef = defineTable(validatorFields);
    const tableIndexes =
      allIndexFields[tableKey as keyof typeof allIndexFields] || [];
    for (const index of tableIndexes) {
      const indexArray = Array.isArray(index)
        ? (index as string[]).sort()
        : [index as string];
      const indexName = indexArray.join("_");
      tableDef = tableDef.index(indexName, indexArray as any);
    }

    result[modelName] = tableDef;
  }

  return result;
}
