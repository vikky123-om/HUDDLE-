import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(30);
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;
    const n = await ctx.db.get(notificationId);
    if (n && n.userId === identity.subject) {
      await ctx.db.patch(notificationId, { read: true });
    }
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect()
      .then((ns) => ns.filter((n) => !n.read));

    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }
  },
});
