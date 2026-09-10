import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const registerDeviceToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not signed in");

    // Check if token already exists
    const existing = await ctx.db
      .query("deviceTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();

    if (!existing) {
      await ctx.db.insert("deviceTokens", {
        userId: identity.subject,
        token,
        createdAt: Date.now(),
      });
    }
  },
});

export const getNotifications = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(50);

    return notifications;
  },
});

export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not signed in");

    const notification = await ctx.db.get(notificationId);
    if (!notification || notification.userId !== identity.subject) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(notificationId, { read: true });
  },
});
