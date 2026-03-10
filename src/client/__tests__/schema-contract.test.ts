/**
 * Snapshot Contract Tests for Schema Output
 *
 * WHAT THIS PROTECTS:
 * These tests create a normalized, deterministic manifest from
 * `getConvexAuthTables()` output and compare it against inline snapshots.
 * They make upstream schema changes immediately visible in PR diffs.
 *
 * WHY SNAPSHOTS ARE STABLE:
 * - We normalize away functions (defaultValue, onUpdate), ordering
 * - We strip Convex validator internals
 * - We capture only: table names, field names, types, optionality, indexes
 * - All maps sorted alphabetically for determinism
 *
 * WHEN TO UPDATE SNAPSHOTS:
 * - When Better Auth upstream intentionally changes the organization schema
 * - When you intentionally add new fields or tables to the same-schema output
 * - Run: `bunx vitest run src/client/__tests__/schema-contract.test.ts -u`
 *
 * REGRESSION GUARD: true — this is the primary contract test.
 */

import { describe, it, expect } from "vitest";
import {
  getOrgTables,
  getSchemaManifest,
  getFieldManifest,
  getIndexNames,
} from "./same-schema-test-utils.js";

describe("Schema Contract — Snapshot Tests", () => {
  const tables = getOrgTables();
  const manifest = getSchemaManifest(tables);

  it("organization table contract", () => {
    expect(getFieldManifest(tables.organization)).toMatchInlineSnapshot(`
			{
			  "createdAt": {
			    "optional": false,
			    "type": "number",
			  },
			  "logo": {
			    "optional": true,
			    "type": "string",
			  },
			  "metadata": {
			    "optional": true,
			    "type": "string",
			  },
			  "name": {
			    "optional": false,
			    "type": "string",
			  },
			  "slug": {
			    "optional": false,
			    "type": "string",
			  },
			}
		`);
  });

  it("member table contract", () => {
    expect(getFieldManifest(tables.member)).toMatchInlineSnapshot(`
			{
			  "createdAt": {
			    "optional": false,
			    "type": "number",
			  },
			  "organizationId": {
			    "optional": false,
			    "type": "string",
			  },
			  "role": {
			    "optional": false,
			    "type": "string",
			  },
			  "userId": {
			    "optional": false,
			    "type": "string",
			  },
			}
		`);
  });

  it("invitation table contract", () => {
    expect(getFieldManifest(tables.invitation)).toMatchInlineSnapshot(`
			{
			  "createdAt": {
			    "optional": false,
			    "type": "number",
			  },
			  "email": {
			    "optional": false,
			    "type": "string",
			  },
			  "expiresAt": {
			    "optional": false,
			    "type": "number",
			  },
			  "inviterId": {
			    "optional": false,
			    "type": "string",
			  },
			  "organizationId": {
			    "optional": false,
			    "type": "string",
			  },
			  "role": {
			    "optional": true,
			    "type": "string",
			  },
			  "status": {
			    "optional": false,
			    "type": "string",
			  },
			  "teamId": {
			    "optional": true,
			    "type": "string",
			  },
			}
		`);
  });

  it("team table contract", () => {
    expect(getFieldManifest(tables.team)).toMatchInlineSnapshot(`
			{
			  "createdAt": {
			    "optional": false,
			    "type": "number",
			  },
			  "name": {
			    "optional": false,
			    "type": "string",
			  },
			  "organizationId": {
			    "optional": false,
			    "type": "string",
			  },
			  "updatedAt": {
			    "optional": true,
			    "type": "number",
			  },
			}
		`);
  });

  it("teamMember table contract", () => {
    expect(getFieldManifest(tables.teamMember)).toMatchInlineSnapshot(`
			{
			  "createdAt": {
			    "optional": true,
			    "type": "number",
			  },
			  "teamId": {
			    "optional": false,
			    "type": "string",
			  },
			  "userId": {
			    "optional": false,
			    "type": "string",
			  },
			}
		`);
  });

  it("session extension fields contract (org + teams)", () => {
    const sessionFields = getFieldManifest(tables.session);
    // Only snapshot the org-specific extension fields
    const orgExtensions = {
      activeOrganizationId: sessionFields.activeOrganizationId,
      activeTeamId: sessionFields.activeTeamId,
    };
    expect(orgExtensions).toMatchInlineSnapshot(`
			{
			  "activeOrganizationId": {
			    "optional": true,
			    "type": "string",
			  },
			  "activeTeamId": {
			    "optional": true,
			    "type": "string",
			  },
			}
		`);
  });

  it("full table name manifest is stable", () => {
    expect(Object.keys(manifest).sort()).toMatchInlineSnapshot(`
			[
			  "account",
			  "invitation",
			  "member",
			  "organization",
			  "session",
			  "team",
			  "teamMember",
			  "user",
			  "verification",
			]
		`);
  });

  it("index names for org tables are stable", () => {
    const orgIndexes = {
      organization: getIndexNames(tables.organization),
      member: getIndexNames(tables.member),
      invitation: getIndexNames(tables.invitation),
      team: getIndexNames(tables.team),
      teamMember: getIndexNames(tables.teamMember),
    };
    expect(orgIndexes).toMatchInlineSnapshot(`
      {
        "invitation": [
          "email_organizationId",
          "inviterId",
          "organizationId",
          "role",
          "status",
          "teamId",
        ],
        "member": [
          "organizationId_userId",
          "role",
          "userId",
        ],
        "organization": [
          "name",
          "slug",
        ],
        "team": [
          "organizationId",
        ],
        "teamMember": [
          "teamId_userId",
          "userId",
        ],
      }
    `);
  });
});
