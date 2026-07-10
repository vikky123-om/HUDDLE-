import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Personal stats for the authenticated user's dashboard.
 */
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const userId = identity.subject;

    // 1. Total huddles hosted — scan activities by creation time (no hostId index)
    //    Take a reasonable upper bound; most users won't host more than 500.
    const allActivities = await ctx.db.query("activities").take(500);
    const hostedActivities = allActivities.filter((a) => a.hostId === userId);
    const totalHuddlesHosted = hostedActivities.length;

    // 2. Total huddles joined — use by_user index on memberships
    const userMemberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(500);
    const totalHuddlesJoined = userMemberships.filter(
      (m) => m.status === "joined",
    ).length;

    // 3. Total pending requests across all hosted activities
    let totalPending = 0;
    for (const activity of hostedActivities) {
      const memberships = await ctx.db
        .query("memberships")
        .withIndex("by_activity", (q) => q.eq("activityId", activity._id))
        .take(200);
      totalPending += memberships.filter((m) => m.status === "pending").length;
    }

    // 4. Accept rate — ratio of accepted / (accepted + declined) notifications
    //    sent BY this user (as host). These notifications have userId = recipient,
    //    so we cross-reference via hostedActivityIds.
    const hostedActivityIds = new Set(hostedActivities.map((a) => a._id));
    const allNotifications = await ctx.db.query("notifications").take(2000);
    const hostDecisions = allNotifications.filter(
      (n) =>
        (n.type === "accepted" || n.type === "declined") &&
        hostedActivityIds.has(n.activityId),
    );
    const accepted = hostDecisions.filter((n) => n.type === "accepted").length;
    const total = hostDecisions.length;
    const acceptRate = total > 0 ? Math.round((accepted / total) * 100) : 100;

    return {
      totalHuddlesHosted,
      totalHuddlesJoined,
      totalPending,
      acceptRate,
    };
  },
});

/**
 * Public analytics for the community dashboard.
 */
export const globalStats = query({
  args: {},
  handler: async (ctx) => {
    // 1. Total huddles
    const activities = await ctx.db.query("activities").take(1000);
    const totalHuddles = activities.length;

    // 2. Total joined members
    const memberships = await ctx.db.query("memberships").take(5000);
    const totalMembers = memberships.filter(
      (m) => m.status === "joined",
    ).length;

    // 3. Category breakdown — count each category using the by_category index
    const categories = [
      "food",
      "outdoors",
      "games",
      "study",
      "arts",
      "other",
    ] as const;
    const categoryCounts: { category: string; count: number }[] = [];
    for (const category of categories) {
      const items = await ctx.db
        .query("activities")
        .withIndex("by_category", (q) => q.eq("category", category))
        .take(1000);
      categoryCounts.push({ category, count: items.length });
    }

    // 4. Recent activity — last 10 created huddles
    const recentActivity = await ctx.db
      .query("activities")
      .order("desc")
      .take(10);

    return {
      totalHuddles,
      totalMembers,
      categoryCounts,
      recentActivity: recentActivity.map((a) => ({
        title: a.title,
        category: a.category,
        hostName: a.hostName,
        createdAt: a.createdAt,
      })),
    };
  },
});
