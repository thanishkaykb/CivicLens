import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all RTI applications for the current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) return [];
    return await ctx.db
      .query("rtiApplications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Get a single RTI application by ID
export const get = query({
  args: { applicationId: v.id("rtiApplications") },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) return null;
    const app = await ctx.db.get(args.applicationId);
    if (!app || app.userId !== userId) return null;
    return app;
  },
});

// Create a new RTI application
export const create = mutation({
  args: {
    title: v.string(),
    originalDescription: v.string(),
    applicationType: v.union(
      v.literal("rti"),
      v.literal("complaint"),
      v.literal("both")
    ),
  },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error("Not authenticated");

    const now = new Date().toISOString();
    return await ctx.db.insert("rtiApplications", {
      userId,
      title: args.title,
      status: "draft",
      originalDescription: args.originalDescription,
      applicationType: args.applicationType,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update an RTI application
export const update = mutation({
  args: {
    applicationId: v.id("rtiApplications"),
    title: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("ready_to_submit"),
      v.literal("submitted"),
      v.literal("awaiting_response"),
      v.literal("response_received"),
      v.literal("closed")
    )),
    problemAnalysis: v.optional(v.any()),
    answers: v.optional(v.any()),
    evidence: v.optional(v.any()),
    authority: v.optional(v.any()),
    draft: v.optional(v.any()),
    submissionDate: v.optional(v.string()),
    referenceNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error("Not authenticated");

    const app = await ctx.db.get(args.applicationId);
    if (!app || app.userId !== userId) throw new Error("Not found or unauthorized");

    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.status !== undefined) updates.status = args.status;
    if (args.problemAnalysis !== undefined) updates.problemAnalysis = args.problemAnalysis;
    if (args.answers !== undefined) updates.answers = args.answers;
    if (args.evidence !== undefined) updates.evidence = args.evidence;
    if (args.authority !== undefined) updates.authority = args.authority;
    if (args.draft !== undefined) updates.draft = args.draft;
    if (args.submissionDate !== undefined) updates.submissionDate = args.submissionDate;
    if (args.referenceNumber !== undefined) updates.referenceNumber = args.referenceNumber;

    await ctx.db.patch(args.applicationId, updates);
    return args.applicationId;
  },
});

// Delete an RTI application
export const remove = mutation({
  args: { applicationId: v.id("rtiApplications") },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error("Not authenticated");
    const app = await ctx.db.get(args.applicationId);
    if (!app || app.userId !== userId) throw new Error("Not found or unauthorized");
    await ctx.db.delete(args.applicationId);
  },
});

// Save a draft (create or update)
export const saveDraft = mutation({
  args: {
    applicationId: v.optional(v.id("rtiApplications")),
    title: v.string(),
    originalDescription: v.string(),
    problemAnalysis: v.optional(v.any()),
    answers: v.optional(v.any()),
    evidence: v.optional(v.any()),
    authority: v.optional(v.any()),
    draft: v.optional(v.any()),
    status: v.optional(v.union(
      v.literal("draft"), v.literal("ready_to_submit"),
      v.literal("submitted"), v.literal("awaiting_response"),
      v.literal("response_received"), v.literal("closed")
    )),
  },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error("Not authenticated");
    const now = new Date().toISOString();
    if (args.applicationId) {
      const app = await ctx.db.get(args.applicationId);
      if (!app || app.userId !== userId) throw new Error("Not found");
      const { applicationId: _appId, ...patchData } = args;
      await ctx.db.patch(args.applicationId, { ...patchData, updatedAt: now });
      return args.applicationId;
    }
    return await ctx.db.insert("rtiApplications", {
      userId, title: args.title, status: args.status || "draft",
      originalDescription: args.originalDescription,
      problemAnalysis: args.problemAnalysis,
      answers: args.answers,
      evidence: args.evidence,
      authority: args.authority,
      draft: args.draft,
      applicationType: "rti",
      createdAt: now, updatedAt: now,
    });
  },
});
