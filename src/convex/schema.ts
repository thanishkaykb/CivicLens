import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
    }).index("email", ["email"]),

    // RTI Applications
    rtiApplications: defineTable({
      userId: v.string(),
      title: v.string(),
      status: v.union(
        v.literal("draft"),
        v.literal("ready_to_submit"),
        v.literal("submitted"),
        v.literal("awaiting_response"),
        v.literal("response_received"),
        v.literal("closed")
      ),
      originalDescription: v.string(),
      problemAnalysis: v.optional(v.any()),
      answers: v.optional(v.any()),
      evidence: v.optional(v.any()),
      authority: v.optional(v.any()),
      draft: v.optional(v.any()),
      applicationType: v.union(
        v.literal("rti"),
        v.literal("complaint"),
        v.literal("both")
      ),
      createdAt: v.string(),
      updatedAt: v.string(),
      submissionDate: v.optional(v.string()),
      referenceNumber: v.optional(v.string()),
    })
      .index("by_user", ["userId"])
      .index("by_status", ["status"])
      .index("by_user_status", ["userId", "status"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
