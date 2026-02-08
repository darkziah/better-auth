import { describe, it, expect } from "vitest";
import { getConvexAuthTables } from "./get-convex-auth-tables.js";
import { organization } from "better-auth/plugins/organization";
import { admin } from "better-auth/plugins/admin";

describe("getConvexAuthTables", () => {
  it("should return base tables when no plugins are provided", () => {
    const tables = getConvexAuthTables({});
    expect(tables.user).toBeDefined();
    expect(tables.session).toBeDefined();
    expect(tables.account).toBeDefined();
    expect(tables.verification).toBeDefined();

    const userFields = tables.user.validator.fields;
    expect(userFields.email).toBeDefined();
    expect(userFields.name).toBeDefined();
    expect(userFields.id).toBeUndefined();
  });

  it("should return organization tables when organization plugin is enabled", () => {
    const tables = getConvexAuthTables({
      plugins: [organization({ teams: { enabled: true } })],
    });
    expect(tables.organization).toBeDefined();
    expect(tables.member).toBeDefined();
    expect(tables.invitation).toBeDefined();
    expect(tables.team).toBeDefined();
    expect(tables.teamMember).toBeDefined();
  });

  it("should include admin extensions when admin plugin is enabled", () => {
    const tables = getConvexAuthTables({
      plugins: [admin()],
    });
    const userFields = tables.user.validator.fields;
    expect(userFields.role).toBeDefined();
    expect(userFields.banned).toBeDefined();
    expect(userFields.banReason).toBeDefined();
    expect(userFields.banExpires).toBeDefined();
  });

  it("should merge tables from multiple plugins", () => {
    const tables = getConvexAuthTables({
      plugins: [organization({ teams: { enabled: true } }), admin()],
    });
    expect(tables.user).toBeDefined();
    expect(tables.organization).toBeDefined();
    expect(tables.user.validator.fields.role).toBeDefined();
  });

  it("should include session extensions from both plugins", () => {
    const tables = getConvexAuthTables({
      plugins: [organization({ teams: { enabled: true } }), admin()],
    });
    const sessionFields = tables.session.validator.fields;
    expect(sessionFields.activeOrganizationId).toBeDefined();
    expect(sessionFields.activeTeamId).toBeDefined();
    expect(sessionFields.impersonatedBy).toBeDefined();
  });

  it("should have indexes on tables", () => {
    const tables = getConvexAuthTables({
      plugins: [organization()],
    });
    expect(tables.organization.indexes).toBeDefined();
  });

  it("should not include 'id' field in any table validator", () => {
    const tables = getConvexAuthTables({
      plugins: [organization({ teams: { enabled: true } }), admin()],
    });
    for (const tableName in tables) {
      const fields = tables[tableName].validator.fields;
      expect(fields.id).toBeUndefined();
    }
  });
});
