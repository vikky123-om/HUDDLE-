import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

export const listPaginated = query({
  args: {
    category: v.optional(v.string()),
    cursor: v.optional(v.string()),
    pageSize: v.number(),
  },
  handler: async (ctx, { category, cursor, pageSize = 20 }) => {
    let query = category
      ? ctx.db.query("activities")
          .withIndex("by_category", (q) => q.eq("category", category))
      : ctx.db.query("activities");

    // Filter out soft-deleted and archived activities
    query = query.filter((a) => !a.deletedAt && !a.archived);

    // Sort by createdAt descending
    const items = await query.order("desc").take(pageSize + 1);

    const hasMore = items.length > pageSize;
    const data = items.slice(0, pageSize);
    const nextCursor = hasMore ? data[pageSize - 1]?._id : null;

    return {
      items: data,
      nextCursor: nextCursor as string | null,
      hasMore,
    };
  },
});
