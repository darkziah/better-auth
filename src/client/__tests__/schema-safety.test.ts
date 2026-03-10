/**
 * Schema-Generation Safety Tests
 *
 * WHAT THIS PROTECTS:
 * These tests guard against CLI/schema-generation regressions. They catch:
 * - Plugin shim (plugin-schemas.ts) drifting from upstream Better Auth
 * - Schema generation overwriting same-schema fields
 * - Session extensions being lost during schema generation
 * - createSchema() accidentally targeting the wrong directory
 *
 * HOW IT WORKS:
 * We cross-validate the lightweight shim output against the real
 * better-auth/plugins/organization output. If upstream changes the
 * org schema shape, the shim diverges and these tests fail.
 *
 * REGRESSION GUARD: true — catches shim drift from upstream.
 */

import { describe, it, expect } from "vitest";
import { getAuthTables } from "../get-convex-auth-tables.js";
import { organization as orgShim } from "../plugin-schemas.js";
import { organization as orgReal } from "better-auth/plugins/organization";
import {
  ALL_ORG_TABLE_NAMES,
  getFieldManifest,
  getOrgTables,
  getShimOrgSchema,
  getRawOrgSchema,
} from "./same-schema-test-utils.js";

describe("Schema-Generation Safety", () => {
  // ─── Shim vs Real Plugin Cross-Validation ────────────────────────

  describe("shim vs real plugin field-level parity", () => {
    const shimSchema = getShimOrgSchema();
    const realSchema = getRawOrgSchema();

    for (const tableName of ALL_ORG_TABLE_NAMES) {
      it(`'${tableName}' has same field names in shim and real plugin`, () => {
        const shimFields = Object.keys(
          shimSchema[tableName]?.fields ?? {},
        ).sort();
        const realFields = Object.keys(
          realSchema[tableName]?.fields ?? {},
        ).sort();

        expect(
          shimFields,
          `Shim field mismatch on '${tableName}'.\n` +
          `Shim has: [${shimFields.join(", ")}]\n` +
          `Real has: [${realFields.join(", ")}]\n` +
          `If this fails after a Better Auth upgrade, update plugin-schemas.ts ` +
          `to match the new upstream schema.`,
        ).toEqual(realFields);
      });
    }

    it("session extensions match between shim and real plugin", () => {
      const shimSessionFields = Object.keys(
        shimSchema.session?.fields ?? {},
      ).sort();
      const realSessionFields = Object.keys(
        realSchema.session?.fields ?? {},
      ).sort();

      expect(
        shimSessionFields,
        `Session extension field mismatch.\n` +
        `Shim has: [${shimSessionFields.join(", ")}]\n` +
        `Real has: [${realSessionFields.join(", ")}]\n` +
        `If this fails after a Better Auth upgrade, update ` +
        `the session section in plugin-schemas.ts.`,
      ).toEqual(realSessionFields);
    });
  });

  // ─── Field type parity ───────────────────────────────────────────

  describe("shim vs real plugin field-type parity", () => {
    const shimSchema = getShimOrgSchema();
    const realSchema = getRawOrgSchema();

    for (const tableName of ALL_ORG_TABLE_NAMES) {
      it(`'${tableName}' fields have matching types in shim and real`, () => {
        const shimFields = shimSchema[tableName]?.fields ?? {};
        const realFields = realSchema[tableName]?.fields ?? {};

        for (const [fieldName, realField] of Object.entries(realFields)) {
          const shimField = shimFields[fieldName];
          expect(
            shimField,
            `Shim is missing field '${tableName}.${fieldName}'`,
          ).toBeDefined();

          if (shimField) {
            expect(
              shimField.type,
              `Type mismatch on ${tableName}.${fieldName}: ` +
              `shim='${shimField.type}' real='${(realField as any).type}'`,
            ).toBe((realField as any).type);

            expect(
              shimField.required,
              `Required mismatch on ${tableName}.${fieldName}: ` +
              `shim=${shimField.required} real=${(realField as any).required}`,
            ).toBe((realField as any).required);
          }
        }
      });
    }
  });

  // ─── Convex table output parity ──────────────────────────────────

  describe("Convex table output parity", () => {
    it("shim produces same Convex field manifests as real plugin", () => {
      const shimTables = {
        plugins: [orgShim({ teams: { enabled: true } }) as any],
      };
      const realTables = {
        plugins: [orgReal({ teams: { enabled: true } })],
      };

      const shimOutput = getAuthTables(shimTables);
      const realOutput = getAuthTables(realTables);

      for (const tableName of ALL_ORG_TABLE_NAMES) {
        const shimFieldNames = Object.keys(
          shimOutput[tableName]?.fields ?? {},
        ).sort();
        const realFieldNames = Object.keys(
          realOutput[tableName]?.fields ?? {},
        ).sort();

        expect(
          shimFieldNames,
          `Convex output field mismatch on '${tableName}'`,
        ).toEqual(realFieldNames);
      }
    });
  });

  // ─── createSchema safety guard ───────────────────────────────────

  describe("createSchema directory safety", () => {
    it("rejects generation to 'convex' directory", async () => {
      const { createSchema } = await import("../create-schema.js");
      const authTables = getAuthTables({
        plugins: [orgReal({ teams: { enabled: true } })],
      });

      await expect(
        createSchema({ tables: authTables, file: "/path/to/convex" }),
      ).rejects.toThrow(
        "Better Auth schema must be generated in the Better Auth component directory",
      );
    });
  });
});
