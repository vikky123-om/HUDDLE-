import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

const ADMIN_USERS = process.env.ADMIN_USER_IDS?.split(",") || [];

function requireAdmin(identity: any) {
  if (!identity || !ADMIN_USERS.includes(identity.subject)) {
    throw new ConvexError("Admin access required");
  }
}

export const logAction = mutation({
  args: {
    action: v.string(),
    targetType: v.string(),
    targetId: v.optional(v.string()),
    details: v.optional(v.string()),
  },
  handler: async (ctx, { action, targetType, targetId, details }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not signed in");

    return await ctx.db.insert("auditLog", {
      userId: identity.subject,
      action,
      targetType,
      targetId,
      details,
      timestamp: Date.now(),
    });
  },
});

export const getAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    requireAdmin(identity);

    const totalActivities = await ctx.db.query("activities")
      .filter((a) => !a.deletedAt)
      .count();

    const totalMembers = await ctx.db.query("memberships")
      .filter((m) => m.status === "joined")
      .count();

    const totalMessages = await ctx.db.query("messages").count();

    const recentActivities = await ctx.db.query("activities")
      .filter((a) => !a.deletedAt)
      .order("desc")
      .take(10);

    return {
      totalActivities,
      totalMembers,
      totalMessages,
      recentActivities,
    };
  },
});

export const getAuditLog = query({
  args: { limit: v.number() },
  handler: async (ctx, { limit = 50 }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    requireAdmin(identity);

    return await ctx.db.query("auditLog")
      .order("desc")
      .take(limit);
  },
});
