/**
 * Component vs Same-Schema Boundary Tests
 *
 * WHAT THIS PROTECTS:
 * These tests prove that same-schema mode and component mode are intentionally
 * different. They catch:
 * - Component schema accidentally exposing org tables (would create duplicates)
 * - Same-schema output missing org tables (regression to component-only)
 * - Duplicate table declarations across both modes
 * - Session extensions silently falling back to component-scoped definitions
 * - Plugin shim producing different tables than what getConvexAuthTables expects
 *
 * REGRESSION GUARD: true — catches accidental mode collapse.
 */

import { describe, it, expect } from "vitest";
import { tables as componentTables } from "../../component/schema.js";
import { getConvexAuthTables } from "../get-convex-auth-tables.js";
import { organization as orgShim } from "../plugin-schemas.js";
import { organization as orgReal } from "better-auth/plugins/organization";
import {
  ORG_TABLE_NAMES,
  TEAM_TABLE_NAMES,
  ALL_ORG_TABLE_NAMES,
  getFieldManifest,
  getOrgTables,
} from "./same-schema-test-utils.js";

describe("Component vs Same-Schema Boundary", () => {
  const sameSchemaOutput = getOrgTables();
  const componentTableNames = Object.keys(componentTables);

  // ─── Component schema must NOT have org tables ───────────────────

  describe("component schema exclusions", () => {
    for (const orgTable of ALL_ORG_TABLE_NAMES) {
      it(`component schema does NOT include '${orgTable}'`, () => {
        expect(
          componentTableNames,
          `Component schema should NOT contain '${orgTable}'. ` +
          `Org tables belong in root schema via getConvexAuthTables().`,
        ).not.toContain(orgTable);
      });
    }
  });

  // ─── Same-schema output must HAVE org tables ─────────────────────

  describe("same-schema output inclusions", () => {
    for (const orgTable of ALL_ORG_TABLE_NAMES) {
      it(`same-schema output DOES include '${orgTable}'`, () => {
        expect(
          sameSchemaOutput[orgTable],
          `Same-schema output is missing '${orgTable}'. ` +
          `Organization tables must be present in getConvexAuthTables() output.`,
        ).toBeDefined();
      });
    }
  });

  // ─── No duplicate tables ─────────────────────────────────────────

  describe("no duplicate declarations", () => {
    it("no org table appears in both component and same-schema output", () => {
      const sameSchemaNames = Object.keys(sameSchemaOutput);
      const duplicates = sameSchemaNames.filter((name) =>
        ALL_ORG_TABLE_NAMES.includes(name as any) &&
        componentTableNames.includes(name)
      );
      expect(
        duplicates,
        `These org tables appear in BOTH component and same-schema output: ${duplicates.join(", ")}. ` +
        `This would cause duplicate table definitions.`,
      ).toEqual([]);
    });
  });

  // ─── Session extension boundary ──────────────────────────────────

  describe("session extension boundary", () => {
    it("component session does NOT have activeOrganizationId", () => {
      const componentSessionFields = componentTables.session.validator.fields;
      expect(
        componentSessionFields,
        "Component session should NOT have org extension fields",
      ).not.toHaveProperty("activeOrganizationId");
    });

    it("component session does NOT have activeTeamId", () => {
      const componentSessionFields = componentTables.session.validator.fields;
      expect(
        componentSessionFields,
        "Component session should NOT have team extension fields",
      ).not.toHaveProperty("activeTeamId");
    });

    it("same-schema session DOES have activeOrganizationId", () => {
      const fields = getFieldManifest(sameSchemaOutput.session);
      expect(fields.activeOrganizationId).toBeDefined();
    });

    it("same-schema session DOES have activeTeamId", () => {
      const fields = getFieldManifest(sameSchemaOutput.session);
      expect(fields.activeTeamId).toBeDefined();
    });
  });

  // ─── Plugin shim consistency ─────────────────────────────────────

  describe("plugin shim produces expected tables", () => {
    it("shim organization() produces same table keys as real plugin", () => {
      const shimOutput = getConvexAuthTables({
        plugins: [orgShim({ teams: { enabled: true } }) as any],
      });
      const realOutput = getConvexAuthTables({
        plugins: [orgReal({ teams: { enabled: true } })],
      });

      const shimOrgKeys = Object.keys(shimOutput)
        .filter((k) => ALL_ORG_TABLE_NAMES.includes(k as any))
        .sort();
      const realOrgKeys = Object.keys(realOutput)
        .filter((k) => ALL_ORG_TABLE_NAMES.includes(k as any))
        .sort();

      expect(shimOrgKeys).toEqual(realOrgKeys);
    });

    it("shim organization() produces same field names per org table", () => {
      const shimOutput = getConvexAuthTables({
        plugins: [orgShim({ teams: { enabled: true } }) as any],
      });
      const realOutput = getConvexAuthTables({
        plugins: [orgReal({ teams: { enabled: true } })],
      });

      for (const tableName of ALL_ORG_TABLE_NAMES) {
        const shimFields = Object.keys(
          shimOutput[tableName]?.validator?.fields ?? {},
        ).sort();
        const realFields = Object.keys(
          realOutput[tableName]?.validator?.fields ?? {},
        ).sort();

        expect(
          shimFields,
          `Field mismatch on '${tableName}': shim has [${shimFields}] but real has [${realFields}]`,
        ).toEqual(realFields);
      }
    });
  });
});
