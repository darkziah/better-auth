/**
 * Index Regression Tests
 *
 * WHAT THIS PROTECTS:
 * These tests verify that the generated Convex table definitions include
 * all indexes required by organization plugin workflows. They catch:
 * - Missing indexes on org tables
 * - Missing composite indexes for efficient lookups
 * - indexFields configuration in create-schema.ts drifting from expectations
 * - Index names changing unexpectedly
 *
 * REGRESSION GUARD: true — missing indexes cause runtime query failures.
 */

import { describe, it, expect } from "vitest";
import {
  getOrgTables,
  getIndexNames,
  normalizeTableDef,
  getConfiguredIndexFields,
} from "./same-schema-test-utils.js";

describe("Index Regression Tests", () => {
  const tables = getOrgTables();

  // ─── Required single-field indexes ───────────────────────────────

  describe("required single-field indexes", () => {
    const requiredIndexes: Record<string, string[]> = {
      organization: ["slug"],
      member: ["organizationId", "userId"],
      invitation: ["organizationId", "email"],
      team: ["organizationId"],
      teamMember: ["teamId", "userId"],
    };

    for (const [tableName, expectedIndexes] of Object.entries(
      requiredIndexes,
    )) {
      for (const indexField of expectedIndexes) {
        it(`${tableName} has index on '${indexField}'`, () => {
          const normalized = normalizeTableDef(tables[tableName]);
          const indexNames = normalized.indexes.map((i) => i.name);
          // The index name could be the field name alone or a composite
          // containing this field
          const hasIndex = indexNames.some(
            (name) => name === indexField || name.includes(indexField),
          );
          expect(
            hasIndex,
            `${tableName} is missing an index that includes '${indexField}'. ` +
            `Available indexes: [${indexNames.join(", ")}]`,
          ).toBe(true);
        });
      }
    }
  });

  // ─── Required composite indexes ──────────────────────────────────

  describe("required composite indexes", () => {
    const requiredComposites: Record<string, string[][]> = {
      member: [["organizationId", "userId"]],
      invitation: [["email", "organizationId"]],
      teamMember: [["teamId", "userId"]],
    };

    for (const [tableName, composites] of Object.entries(
      requiredComposites,
    )) {
      for (const fields of composites) {
        const expectedName = fields.sort().join("_");

        it(`${tableName} has composite index '${expectedName}'`, () => {
          const indexNames = getIndexNames(tables[tableName]);
          expect(
            indexNames,
            `${tableName} is missing composite index '${expectedName}'. ` +
            `Available indexes: [${indexNames.join(", ")}]`,
          ).toContain(expectedName);
        });
      }
    }
  });

  // ─── indexFields configuration ───────────────────────────────────

  describe("indexFields configuration in create-schema.ts", () => {
    const configuredIndexes = getConfiguredIndexFields();

    it("has member composite index configured", () => {
      expect(configuredIndexes.member).toBeDefined();
      expect(configuredIndexes.member).toContainEqual([
        "organizationId",
        "userId",
      ]);
    });

    it("has invitation composite index configured", () => {
      expect(configuredIndexes.invitation).toBeDefined();
      expect(configuredIndexes.invitation).toContainEqual([
        "email",
        "organizationId",
      ]);
    });

    it("has teamMember composite index configured", () => {
      expect(configuredIndexes.teamMember).toBeDefined();
      expect(configuredIndexes.teamMember).toContainEqual([
        "teamId",
        "userId",
      ]);
    });
  });

  // ─── Index stability snapshot ────────────────────────────────────

  describe("full index manifest snapshot", () => {
    it("organization indexes", () => {
      expect(getIndexNames(tables.organization)).toMatchInlineSnapshot(`
				[
				  "name",
				  "slug",
				]
			`);
    });

    it("member indexes", () => {
      expect(getIndexNames(tables.member)).toMatchInlineSnapshot(`
        [
          "organizationId_userId",
          "role",
          "userId",
        ]
      `);
    });

    it("invitation indexes", () => {
      expect(getIndexNames(tables.invitation)).toMatchInlineSnapshot(`
        [
          "email_organizationId",
          "inviterId",
          "organizationId",
          "role",
          "status",
          "teamId",
        ]
      `);
    });

    it("team indexes", () => {
      expect(getIndexNames(tables.team)).toMatchInlineSnapshot(`
				[
				  "organizationId",
				]
			`);
    });

    it("teamMember indexes", () => {
      expect(getIndexNames(tables.teamMember)).toMatchInlineSnapshot(`
        [
          "teamId_userId",
          "userId",
        ]
      `);
    });
  });
});
