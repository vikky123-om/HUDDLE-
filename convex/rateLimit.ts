import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";

const LIMITS = {
  create_huddle: { max: 10, window: 3600000 }, // 10 per hour
  send_message: { max: 100, window: 3600000 }, // 100 per hour
  join_request: { max: 20, window: 3600000 }, // 20 per hour
};

export async function checkRateLimit(
  ctx: MutationCtx,
  userId: string,
  action: "create_huddle" | "send_message" | "join_request"
) {
  const now = Date.now();
  const limit = LIMITS[action];
  const windowStart = now - limit.window;

  const recentActions = await ctx.db
    .query("rateLimitLog")
    .withIndex("by_user_and_action", (q) =>
      q.eq("userId", userId).eq("action", action)
    )
    .filter((r) => r.timestamp > windowStart)
    .collect();

  if (recentActions.length >= limit.max) {
    throw new ConvexError(
      `Too many ${action.replace("_", " ")}. Try again in ${Math.ceil((recentActions[0].timestamp + limit.window - now) / 60000)} minutes.`
    );
  }

  // Log this action
  await ctx.db.insert("rateLimitLog", {
    userId,
    action,
    timestamp: now,
  });
}

export const cleanupExpiredLogs = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oldestRelevant = now - 24 * 3600000; // Keep 24 hours of logs

    const oldLogs = await ctx.db
      .query("rateLimitLog")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", oldestRelevant))
      .collect();

    for (const log of oldLogs) {
      await ctx.db.delete(log._id);
    }

    return { deletedCount: oldLogs.length };
  },
});
