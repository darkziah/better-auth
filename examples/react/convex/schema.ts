import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  getConvexAuthTables,
  organization,
  admin,
} from "@convex-dev/better-auth/schema";

const schema = defineSchema({
  ...getConvexAuthTables({
    plugins: [organization({ teams: { enabled: true } }), admin()],
  }),
  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("userId", ["userId"]),
});

export default schema;
