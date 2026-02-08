import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { getConvexAuthTables } from "@convex-dev/better-auth/schema";
import { organization } from "better-auth/plugins/organization";
import { admin } from "better-auth/plugins/admin";

export default defineSchema({
  ...getConvexAuthTables({
    plugins: [organization({ teams: { enabled: true } }), admin()],
  }),
  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
    userId: v.string(),
  }).index("userId", ["userId"]),
});
