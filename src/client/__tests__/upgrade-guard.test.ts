/**
 * Upgrade Guard Tests
 *
 * WHAT THIS PROTECTS:
 * These tests are specifically designed to fail when Better Auth is upgraded
 * and the upstream organization plugin schema changes. They catch:
 * - New required org fields added upstream that our shim doesn't know about
 * - Team table schema changes
 * - Session extension field changes
 * - Plugin model name changes that break our adapter routing
 *
 * ════════════════════════════════════════════════════════════════════════
 * ██  WHEN UPGRADING BETTER AUTH  ██
 * ════════════════════════════════════════════════════════════════════════
 *
 * When these tests fail after bumping the `better-auth` dependency:
 *
 * 1. INSPECT the failing test to see which contract changed.
 *
 * 2. CHECK upstream changelog / migration guide for the Better Auth version
 *    you're upgrading to.
 *
 * 3. DECIDE:
 *    - If the change is ADDITIVE (new optional field): Update the manifest
 *      constants below AND update plugin-schemas.ts to include the new field.
 *    - If the change is BREAKING (field removed, renamed, type changed):
 *      Investigate whether our same-schema adapter code needs updating.
 *      Check create-local-api.ts, adapter.ts, and any code that references
 *      org model names directly.
 *    - If a MODEL NAME changed: Update the model name constants below
 *      AND update plugin-schemas.ts AND verify adapter routing still works.
 *
 * 4. UPDATE snapshots: `bunx vitest run src/client/__tests__/ -u`
 *
 * 5. VERIFY the full test suite passes: `bun run test`
 *
 * 6. MANUALLY TEST org operations if schema changes were significant:
 *    - Create organization
 *    - Invite member
 *    - Accept invitation
 *    - Create team (if teams enabled)
 *    - Switch active organization/team on session
 *
 * ════════════════════════════════════════════════════════════════════════
 *
 * REGRESSION GUARD: true — primary upgrade safety net.
 */

import { describe, it, expect } from "vitest";
import { getAuthTables } from "../get-convex-auth-tables.js";
import { organization as orgReal } from "better-auth/plugins/organization";

// ═══════════════════════════════════════════════════════════════════════
// EXPECTED CONTRACT MANIFESTS
// Update these when intentionally accepting upstream changes.
// ═══════════════════════════════════════════════════════════════════════

/**
 * Expected field names for each org table.
 * If upstream adds/removes fields, update this manifest.
 */
const EXPECTED_ORG_FIELDS: Record<string, string[]> = {
  organization: ["name", "slug", "logo", "createdAt", "metadata"],
  member: ["organizationId", "userId", "role", "createdAt"],
  invitation: [
    "organizationId",
    "email",
    "role",
    "teamId",
    "status",
    "expiresAt",
    "createdAt",
    "inviterId",
  ],
};

const EXPECTED_TEAM_FIELDS: Record<string, string[]> = {
  team: ["name", "organizationId", "createdAt", "updatedAt"],
  teamMember: ["teamId", "userId", "createdAt"],
};

const EXPECTED_SESSION_EXTENSIONS = [
  "activeOrganizationId",
  "activeTeamId",
];

const EXPECTED_ORG_MODEL_NAMES = [
  "organization",
  "member",
  "invitation",
  "team",
  "teamMember",
];

// ═══════════════════════════════════════════════════════════════════════

describe("Upgrade Guard Tests", () => {
  const authTables = getAuthTables({
    plugins: [orgReal({ teams: { enabled: true } })],
  });

  // ─── Required org field manifests ─────────────────────────────────

  describe("organization table fields contract", () => {
    for (const [tableName, expectedFields] of Object.entries(
      EXPECTED_ORG_FIELDS,
    )) {
      it(`${tableName} has exactly the expected fields`, () => {
        const actualFields = Object.keys(
          authTables[tableName]?.fields ?? {},
        ).sort();
        const expected = [...expectedFields].sort();

        expect(
          actualFields,
          `Field contract changed for '${tableName}'.\n` +
          `Expected: [${expected.join(", ")}]\n` +
          `Actual:   [${actualFields.join(", ")}]\n\n` +
          `If this fails after upgrading Better Auth:\n` +
          `1. Check if the field change is intentional upstream\n` +
          `2. Update EXPECTED_ORG_FIELDS in this file\n` +
          `3. Update plugin-schemas.ts to match\n` +
          `4. Run: bunx vitest run src/client/__tests__/ -u`,
        ).toEqual(expected);
      });
    }
  });

  // ─── Team field manifests ────────────────────────────────────────

  describe("team table fields contract", () => {
    for (const [tableName, expectedFields] of Object.entries(
      EXPECTED_TEAM_FIELDS,
    )) {
      it(`${tableName} has exactly the expected fields`, () => {
        const actualFields = Object.keys(
          authTables[tableName]?.fields ?? {},
        ).sort();
        const expected = [...expectedFields].sort();

        expect(
          actualFields,
          `Team field contract changed for '${tableName}'.\n` +
          `Expected: [${expected.join(", ")}]\n` +
          `Actual:   [${actualFields.join(", ")}]\n\n` +
          `If this fails after upgrading Better Auth:\n` +
          `1. Check upstream team schema changes\n` +
          `2. Update EXPECTED_TEAM_FIELDS in this file\n` +
          `3. Update plugin-schemas.ts team/teamMember section\n` +
          `4. Run: bunx vitest run src/client/__tests__/ -u`,
        ).toEqual(expected);
      });
    }
  });

  // ─── Session extension manifest ──────────────────────────────────

  describe("session extension fields contract", () => {
    it("session has exactly the expected org/team extension fields", () => {
      const sessionFields = authTables.session?.fields ?? {};
      const orgExtensions = Object.keys(sessionFields).filter(
        (f) => f.startsWith("active"),
      );

      expect(
        orgExtensions.sort(),
        `Session extension fields changed.\n` +
        `Expected: [${EXPECTED_SESSION_EXTENSIONS.sort().join(", ")}]\n` +
        `Actual:   [${orgExtensions.sort().join(", ")}]\n\n` +
        `If this fails after upgrading Better Auth:\n` +
        `1. Check upstream session extension changes\n` +
        `2. Update EXPECTED_SESSION_EXTENSIONS in this file\n` +
        `3. Update the session section in plugin-schemas.ts\n` +
        `4. Run: bunx vitest run src/client/__tests__/ -u`,
      ).toEqual(EXPECTED_SESSION_EXTENSIONS.sort());
    });

    it("all session extension fields are optional", () => {
      const sessionFields = authTables.session?.fields ?? {};
      for (const extField of EXPECTED_SESSION_EXTENSIONS) {
        const field = sessionFields[extField];
        expect(
          field,
          `Session extension '${extField}' is missing`,
        ).toBeDefined();
        if (field) {
          expect(
            field.required,
            `Session extension '${extField}' should be optional (required=false)`,
          ).toBeFalsy();
        }
      }
    });
  });

  // ─── Model name stability ────────────────────────────────────────

  describe("plugin model name stability", () => {
    it("org plugin generates expected model names", () => {
      const modelNames = Object.entries(authTables)
        .filter(([key]) => EXPECTED_ORG_MODEL_NAMES.includes(key))
        .map(([, table]) => table.modelName)
        .sort();

      expect(
        modelNames,
        `Model names changed.\n` +
        `Expected: [${EXPECTED_ORG_MODEL_NAMES.sort().join(", ")}]\n` +
        `Actual:   [${modelNames.join(", ")}]\n\n` +
        `If this fails after upgrading Better Auth:\n` +
        `1. Check if model names were renamed upstream\n` +
        `2. Update EXPECTED_ORG_MODEL_NAMES in this file\n` +
        `3. Update plugin-schemas.ts modelName references\n` +
        `4. Verify adapter routing still works in create-local-api.ts`,
      ).toEqual(EXPECTED_ORG_MODEL_NAMES.sort());
    });
  });

  // ─── Field type stability ────────────────────────────────────────

  describe("critical field type stability", () => {
    const criticalFields: [string, string, string][] = [
      ["organization", "slug", "string"],
      ["organization", "name", "string"],
      ["member", "organizationId", "string"],
      ["member", "userId", "string"],
      ["member", "role", "string"],
      ["invitation", "email", "string"],
      ["invitation", "organizationId", "string"],
      ["invitation", "status", "string"],
      ["team", "organizationId", "string"],
      ["teamMember", "teamId", "string"],
      ["teamMember", "userId", "string"],
    ];

    for (const [tableName, fieldName, expectedType] of criticalFields) {
      it(`${tableName}.${fieldName} remains type '${expectedType}'`, () => {
        const field = authTables[tableName]?.fields?.[fieldName];
        expect(
          field,
          `Critical field ${tableName}.${fieldName} is missing`,
        ).toBeDefined();
        expect(
          field?.type,
          `Type change detected: ${tableName}.${fieldName} ` +
          `changed from '${expectedType}' to '${field?.type}'`,
        ).toBe(expectedType);
      });
    }
  });
});
