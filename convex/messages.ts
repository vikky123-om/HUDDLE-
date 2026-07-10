import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { activityId: v.id("activities") },
  handler: async (ctx, { activityId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    // Only joined members and the host can see messages
    const activity = await ctx.db.get(activityId);
    if (!activity) return [];

    const isHost = activity.hostId === identity.subject;
    if (!isHost) {
      const membership = await ctx.db
        .query("memberships")
        .withIndex("by_activity_and_user", (q) =>
          q.eq("activityId", activityId).eq("userId", identity.subject),
        )
        .unique();
      if (!membership || membership.status !== "joined") return [];
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_activity", (q) => q.eq("activityId", activityId))
      .order("asc")
      .collect();
  },
});

export const send = mutation({
  args: {
    activityId: v.id("activities"),
    text: v.string(),
  },
  handler: async (ctx, { activityId, text }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not signed in");

    const trimmed = text.trim();
    if (!trimmed) throw new ConvexError("Message cannot be empty");
    if (trimmed.length > 500) throw new ConvexError("Message too long (max 500 characters)");

    const activity = await ctx.db.get(activityId);
    if (!activity) throw new ConvexError("Activity not found");

    const isHost = activity.hostId === identity.subject;
    if (!isHost) {
      const membership = await ctx.db
        .query("memberships")
        .withIndex("by_activity_and_user", (q) =>
          q.eq("activityId", activityId).eq("userId", identity.subject),
        )
        .unique();
      if (!membership || membership.status !== "joined") {
        throw new ConvexError("Only joined members can send messages");
      }
    }

    const userName =
      identity.name ?? identity.nickname ?? identity.email ?? "Someone";

    return await ctx.db.insert("messages", {
      activityId,
      userId: identity.subject,
      userName,
      text: trimmed,
      createdAt: Date.now(),
    });
  },
});
