/**
 * Schema Shape Stability Tests
 *
 * WHAT THIS PROTECTS:
 * These tests verify that `getConvexAuthTables()` returns the expected tables
 * and field shapes when the organization plugin is enabled. They catch:
 * - Tables disappearing
 * - Fields being renamed
 * - Field types changing (string → number, etc.)
 * - Org fields no longer merging into root schema
 * - Session extensions (activeOrganizationId, activeTeamId) being lost
 * - Optional/required semantics changing
 *
 * REGRESSION GUARD: true — these protect the public API contract.
 */

import { describe, it, expect } from "vitest";
import {
  getOrgTables,
  getOrgTablesNoTeams,
  getFieldManifest,
  CORE_TABLE_NAMES,
  ORG_TABLE_NAMES,
  TEAM_TABLE_NAMES,
  ALL_ORG_TABLE_NAMES,
} from "./same-schema-test-utils.js";

describe("Schema Shape Stability", () => {
  // ─── Table presence ──────────────────────────────────────────────

  describe("table presence with org + teams", () => {
    const tables = getOrgTables();

    it("includes all core auth tables", () => {
      for (const name of CORE_TABLE_NAMES) {
        expect(tables[name], `missing core table: ${name}`).toBeDefined();
      }
    });

    it("includes all organization tables", () => {
      for (const name of ORG_TABLE_NAMES) {
        expect(tables[name], `missing org table: ${name}`).toBeDefined();
      }
    });

    it("includes team and teamMember tables", () => {
      for (const name of TEAM_TABLE_NAMES) {
        expect(tables[name], `missing team table: ${name}`).toBeDefined();
      }
    });

    it("does not include 'id' field in any table", () => {
      for (const tableName of Object.keys(tables)) {
        const fields = tables[tableName].validator.fields;
        expect(
          fields.id,
          `table '${tableName}' should not have an 'id' field`,
        ).toBeUndefined();
      }
    });
  });

  describe("table presence without teams", () => {
    const tables = getOrgTablesNoTeams();

    it("includes org tables but NOT team tables", () => {
      for (const name of ORG_TABLE_NAMES) {
        expect(tables[name], `missing org table: ${name}`).toBeDefined();
      }
      for (const name of TEAM_TABLE_NAMES) {
        expect(
          tables[name],
          `team table '${name}' should NOT be present when teams disabled`,
        ).toBeUndefined();
      }
    });
  });

  // ─── Organization table fields ───────────────────────────────────

  describe("organization table field definitions", () => {
    const tables = getOrgTables();

    it("has expected organization fields", () => {
      const fields = getFieldManifest(tables.organization);
      expect(fields.name).toEqual({ type: "string", optional: false });
      expect(fields.slug).toEqual({ type: "string", optional: false });
      expect(fields.logo).toEqual({ type: "string", optional: true });
      expect(fields.createdAt).toEqual({ type: "number", optional: false });
      expect(fields.metadata).toEqual({ type: "string", optional: true });
    });

    it("has expected member fields", () => {
      const fields = getFieldManifest(tables.member);
      expect(fields.organizationId).toEqual({
        type: "string",
        optional: false,
      });
      expect(fields.userId).toEqual({ type: "string", optional: false });
      expect(fields.role).toEqual({ type: "string", optional: false });
      expect(fields.createdAt).toEqual({ type: "number", optional: false });
    });

    it("has expected invitation fields", () => {
      const fields = getFieldManifest(tables.invitation);
      expect(fields.organizationId).toEqual({
        type: "string",
        optional: false,
      });
      expect(fields.email).toEqual({ type: "string", optional: false });
      expect(fields.role).toEqual({ type: "string", optional: true });
      expect(fields.status).toEqual({ type: "string", optional: false });
      expect(fields.expiresAt).toEqual({ type: "number", optional: false });
      expect(fields.inviterId).toEqual({ type: "string", optional: false });
    });
  });

  // ─── Team table fields ───────────────────────────────────────────

  describe("team table field definitions", () => {
    const tables = getOrgTables();

    it("has expected team fields", () => {
      const fields = getFieldManifest(tables.team);
      expect(fields.name).toEqual({ type: "string", optional: false });
      expect(fields.organizationId).toEqual({
        type: "string",
        optional: false,
      });
      expect(fields.createdAt).toEqual({ type: "number", optional: false });
    });

    it("has expected teamMember fields", () => {
      const fields = getFieldManifest(tables.teamMember);
      expect(fields.teamId).toEqual({ type: "string", optional: false });
      expect(fields.userId).toEqual({ type: "string", optional: false });
    });
  });

  // ─── Session extensions ──────────────────────────────────────────

  describe("session org/team extension fields", () => {
    it("session has activeOrganizationId when org enabled", () => {
      const tables = getOrgTablesNoTeams();
      const fields = getFieldManifest(tables.session);
      expect(fields.activeOrganizationId).toEqual({
        type: "string",
        optional: true,
      });
    });

    it("session has activeTeamId when teams enabled", () => {
      const tables = getOrgTables();
      const fields = getFieldManifest(tables.session);
      expect(fields.activeTeamId).toEqual({
        type: "string",
        optional: true,
      });
    });

    it("session retains core fields alongside org extensions", () => {
      const tables = getOrgTables();
      const fields = getFieldManifest(tables.session);
      expect(fields.token).toEqual({ type: "string", optional: false });
      expect(fields.userId).toEqual({ type: "string", optional: false });
      expect(fields.expiresAt).toEqual({ type: "number", optional: false });
    });
  });

  // ─── Foreign key type safety ─────────────────────────────────────

  describe("foreign key fields remain strings", () => {
    const tables = getOrgTables();
    const fkFields = [
      ["member", "organizationId"],
      ["member", "userId"],
      ["invitation", "organizationId"],
      ["invitation", "inviterId"],
      ["team", "organizationId"],
      ["teamMember", "teamId"],
      ["teamMember", "userId"],
    ] as const;

    for (const [table, field] of fkFields) {
      it(`${table}.${field} is a string field`, () => {
        const fields = getFieldManifest(tables[table]);
        expect(
          fields[field]?.type,
          `${table}.${field} should be 'string'`,
        ).toBe("string");
      });
    }
  });
});
