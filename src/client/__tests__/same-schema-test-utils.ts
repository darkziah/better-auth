/**
 * Shared test utilities for same-schema mode regression tests.
 *
 * These helpers normalize Convex table definitions into stable,
 * JSON-serializable shapes that can be used for contract assertions
 * and snapshot comparisons.
 */

import { getConvexAuthTables, getAuthTables } from "../get-convex-auth-tables.js";
import { organization as orgShim } from "../plugin-schemas.js";
import { organization as orgReal } from "better-auth/plugins/organization";
import { indexFields } from "../create-schema.js";

// ─── Table name constants ────────────────────────────────────────────

export const CORE_TABLE_NAMES = [
  "user",
  "session",
  "account",
  "verification",
] as const;

export const ORG_TABLE_NAMES = [
  "organization",
  "member",
  "invitation",
] as const;

export const TEAM_TABLE_NAMES = ["team", "teamMember"] as const;

export const ALL_ORG_TABLE_NAMES = [
  ...ORG_TABLE_NAMES,
  ...TEAM_TABLE_NAMES,
] as const;

// ─── Convenience getters ─────────────────────────────────────────────

/** Get Convex table defs with org + teams enabled. */
export function getOrgTables() {
  return getConvexAuthTables({
    plugins: [orgReal({ teams: { enabled: true } })],
  });
}

/** Get Convex table defs with org enabled, teams disabled. */
export function getOrgTablesNoTeams() {
  return getConvexAuthTables({
    plugins: [orgReal()],
  });
}

/** Get raw Better Auth schema (pre-Convex) with org + teams. */
export function getRawOrgSchema() {
  return getAuthTables({
    plugins: [orgReal({ teams: { enabled: true } })],
  });
}

/** Get raw Better Auth schema using the lightweight shim. */
export function getShimOrgSchema() {
  return getAuthTables({
    plugins: [orgShim({ teams: { enabled: true } })] as any,
  });
}

// ─── Schema normalization ────────────────────────────────────────────

interface NormalizedField {
  type: string;
  optional: boolean;
}

interface NormalizedIndex {
  name: string;
  fields: string[];
}

interface NormalizedTable {
  fields: Record<string, NormalizedField>;
  indexes: NormalizedIndex[];
}

export type SchemaManifest = Record<string, NormalizedTable>;

/**
 * Extract a stable, JSON-serializable representation of a Convex table
 * definition for contract assertions. Strips away validator objects,
 * functions, and other unstable internals.
 */
export function normalizeTableDef(tableDef: any): NormalizedTable {
  const fields: Record<string, NormalizedField> = {};

  // Extract fields from the validator
  const validatorFields = tableDef.validator?.fields ?? {};
  for (const [fieldName, validator] of Object.entries(validatorFields)) {
    fields[fieldName] = normalizeValidator(validator);
  }

  // Extract indexes — Convex stores them in a " indexes" method
  const indexes: NormalizedIndex[] = [];
  let rawIndexes: any[] = [];
  if (typeof tableDef[" indexes"] === "function") {
    rawIndexes = tableDef[" indexes"]();
  } else if (Array.isArray(tableDef.indexes)) {
    rawIndexes = tableDef.indexes;
  }
  for (const idx of rawIndexes) {
    indexes.push({
      name: idx.indexDescriptor,
      fields: [...idx.fields].sort(),
    });
  }

  // Sort indexes by name for determinism
  indexes.sort((a, b) => a.name.localeCompare(b.name));

  return { fields, indexes };
}

/**
 * Recursively extract the type name from a Convex validator.
 *
 * Convex v4 validator structure:
 * - v.string() → { kind: "string", isOptional: "required" }
 * - v.optional(v.string()) → { kind: "string", isOptional: "optional" }
 * - v.optional(v.union(v.null(), v.string())) → {
 *     kind: "union", isOptional: "optional",
 *     members: [{ kind: "null" }, { kind: "string" }]
 *   }
 *
 * Note: v.optional() flattens — kind/members appear directly on the
 * outer object alongside isOptional, NOT nested under a `.type` property.
 */
function normalizeValidator(validator: any): NormalizedField {
  if (!validator) return { type: "unknown", optional: false };

  const isOptional = validator.isOptional === "optional";
  const kind = validator.kind;

  if (kind === "union") {
    // Union types — typically v.union(v.null(), v.string())
    // Extract the non-null member type
    const members = validator.members ?? [];
    const nonNullMember = members.find((m: any) => m.kind !== "null");
    if (nonNullMember) {
      const inner = normalizeValidator(nonNullMember);
      return { type: inner.type, optional: isOptional };
    }
    return { type: "null", optional: isOptional };
  }

  if (kind === "array") {
    const elementType = normalizeValidator(validator.element);
    return { type: `${elementType.type}[]`, optional: isOptional };
  }

  // Leaf types
  const typeMap: Record<string, string> = {
    string: "string",
    float64: "number",
    int64: "number",
    boolean: "boolean",
    null: "null",
    id: "id",
  };

  return {
    type: typeMap[kind] ?? kind ?? "unknown",
    optional: isOptional,
  };
}

/**
 * Create a full normalized manifest from getConvexAuthTables() output.
 * The manifest is sorted, deterministic, and JSON-serializable.
 */
export function getSchemaManifest(
  tables: Record<string, any>,
): SchemaManifest {
  const manifest: SchemaManifest = {};
  const sortedKeys = Object.keys(tables).sort();
  for (const key of sortedKeys) {
    manifest[key] = normalizeTableDef(tables[key]);
  }
  return manifest;
}

/**
 * Extract just field names and types from a table def, sorted.
 * Useful for quick comparisons and contract tests.
 */
export function getFieldManifest(
  tableDef: any,
): Record<string, { type: string; optional: boolean }> {
  const normalized = normalizeTableDef(tableDef);
  const sorted: Record<string, { type: string; optional: boolean }> = {};
  for (const key of Object.keys(normalized.fields).sort()) {
    sorted[key] = normalized.fields[key];
  }
  return sorted;
}

/**
 * Extract just index names from a table def, sorted.
 */
export function getIndexNames(tableDef: any): string[] {
  const normalized = normalizeTableDef(tableDef);
  return normalized.indexes.map((i) => i.name).sort();
}

/**
 * Get the index fields configuration from create-schema.ts
 */
export function getConfiguredIndexFields() {
  return indexFields;
}
