/**
 * Lightweight, schema-only plugin factories for use in Convex schema files.
 *
 * These return the same `{ id, schema }` shape as the real better-auth plugins
 * but without pulling in any heavy runtime code (endpoints, adapters, etc.)
 * that breaks Convex's restricted schema evaluator.
 *
 * Use these in your `convex/schema.ts` instead of importing from
 * `better-auth/plugins/*`.
 *
 * @example
 * ```ts
 * import { getConvexAuthTables, organization, admin } from "@convex-dev/better-auth/schema";
 * import { defineSchema } from "convex/server";
 *
 * export default defineSchema({
 *   ...getConvexAuthTables({
 *     plugins: [organization({ teams: { enabled: true } }), admin()],
 *   }),
 * });
 * ```
 */

interface SchemaField {
	type: "string" | "number" | "boolean" | "date";
	required?: boolean;
	sortable?: boolean;
	unique?: boolean;
	index?: boolean;
	input?: boolean;
	defaultValue?: unknown;
	references?: { model: string; field: string };
	fieldName?: string;
}

interface PluginSchemaTable {
	fields: Record<string, SchemaField>;
	modelName?: string;
}

interface SchemaOnlyPlugin {
	id: string;
	schema: Record<string, PluginSchemaTable>;
}

/**
 * Schema-only version of `organization()` from `better-auth/plugins/organization`.
 *
 * Returns the same schema shapes the real plugin produces, without heavy
 * runtime dependencies.
 */
export function organization(options?: {
	teams?: { enabled?: boolean };
	schema?: {
		organization?: {
			additionalFields?: Record<string, SchemaField>;
		};
		invitation?: {
			additionalFields?: Record<string, SchemaField>;
		};
	};
}): SchemaOnlyPlugin {
	const teamsEnabled = options?.teams?.enabled ?? false;

	const schema: Record<string, PluginSchemaTable> = {
		organization: {
			fields: {
				name: { type: "string", required: true, sortable: true },
				slug: {
					type: "string",
					required: true,
					unique: true,
					sortable: true,
					index: true,
				},
				logo: { type: "string", required: false },
				createdAt: { type: "date", required: true },
				metadata: { type: "string", required: false },
				...options?.schema?.organization?.additionalFields,
			},
		},
		member: {
			fields: {
				organizationId: {
					type: "string",
					required: true,
					references: { model: "organization", field: "id" },
					index: true,
				},
				userId: {
					type: "string",
					required: true,
					references: { model: "user", field: "id" },
					index: true,
				},
				role: {
					type: "string",
					required: true,
					sortable: true,
					defaultValue: "member",
				},
				createdAt: { type: "date", required: true },
			},
		},
		invitation: {
			fields: {
				organizationId: {
					type: "string",
					required: true,
					references: { model: "organization", field: "id" },
					index: true,
				},
				email: {
					type: "string",
					required: true,
					sortable: true,
					index: true,
				},
				role: { type: "string", required: false, sortable: true },
				teamId: { type: "string", required: false, sortable: true },
				status: {
					type: "string",
					required: true,
					sortable: true,
					defaultValue: "pending",
				},
				expiresAt: { type: "date", required: true },
				createdAt: { type: "date", required: true },
				inviterId: {
					type: "string",
					references: { model: "user", field: "id" },
					required: true,
				},
				...options?.schema?.invitation?.additionalFields,
			},
		},
		session: {
			fields: {
				activeOrganizationId: { type: "string", required: false },
				...(teamsEnabled
					? { activeTeamId: { type: "string", required: false } }
					: {}),
			},
		},
	};

	if (teamsEnabled) {
		schema.team = {
			fields: {
				name: { type: "string", required: true },
				organizationId: {
					type: "string",
					required: true,
					references: { model: "organization", field: "id" },
					index: true,
				},
				createdAt: { type: "date", required: true },
				updatedAt: { type: "date", required: false },
			},
		};
		schema.teamMember = {
			fields: {
				teamId: {
					type: "string",
					required: true,
					references: { model: "team", field: "id" },
					index: true,
				},
				userId: {
					type: "string",
					required: true,
					references: { model: "user", field: "id" },
					index: true,
				},
				createdAt: { type: "date", required: false },
			},
		};
	}

	return { id: "organization", schema };
}

/**
 * Schema-only version of `admin()` from `better-auth/plugins/admin`.
 *
 * Returns the same schema shapes the real plugin produces, without heavy
 * runtime dependencies.
 */
export function admin(): SchemaOnlyPlugin {
	return {
		id: "admin",
		schema: {
			user: {
				fields: {
					role: { type: "string", required: false, input: false },
					banned: {
						type: "boolean",
						defaultValue: false,
						required: false,
						input: false,
					},
					banReason: { type: "string", required: false, input: false },
					banExpires: { type: "date", required: false, input: false },
				},
			},
			session: {
				fields: {
					impersonatedBy: { type: "string", required: false },
				},
			},
		},
	};
}
