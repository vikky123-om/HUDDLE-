import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

async function getMembership(
  ctx: any,
  activityId: Id<"activities">,
  userId: string
) {
  return await ctx.db
    .query("memberships")
    .withIndex("by_activity_and_user", (q) =>
      q.eq("activityId", activityId).eq("userId", userId)
    )
    .unique();
}

export const add = mutation({
  args: {
    activityId: v.id("activities"),
    rating: v.number(),
    comment: v.string(),
  },
  handler: async (ctx, { activityId, rating, comment }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not signed in");

    // Verify activity exists
    const activity = await ctx.db.get(activityId);
    if (!activity) throw new ConvexError("Huddle not found");

    // Verify user was actually a member and joined
    const membership = await getMembership(ctx, activityId, identity.subject);
    if (!membership || membership.status !== "joined") {
      throw new ConvexError("Only members who joined can review");
    }

    // Verify user hasn't already reviewed
    const existingReview = await ctx.db
      .query("reviews")
      .withIndex("by_activity", (q) => q.eq("activityId", activityId))
      .filter((r) => r.reviewerId === identity.subject)
      .unique();

    if (existingReview) throw new ConvexError("You already reviewed this");

    const validRating = Math.max(1, Math.min(5, Math.round(rating)));

    return await ctx.db.insert("reviews", {
      activityId,
      reviewerId: identity.subject,
      reviewerName: identity.name || "Anonymous",
      rating: validRating,
      comment: comment.slice(0, 500),
      createdAt: Date.now(),
    });
  },
});

export const getActivityReviews = query({
  args: { activityId: v.id("activities") },
  handler: async (ctx, { activityId }) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_activity", (q) => q.eq("activityId", activityId))
      .order("desc")
      .collect();

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return {
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
    };
  },
});

export const getUserReviews = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_reviewer", (q) => q.eq("reviewerId", userId))
      .order("desc")
      .collect();

    return reviews;
  },
});
