import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

async function requireHost(
  ctx: any,
  activityId: Id<"activities">
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Not signed in");

  const activity = await ctx.db.get(activityId);
  if (!activity || activity.hostId !== identity.subject) {
    throw new ConvexError("Only the host can do that");
  }

  return { activity, identity };
}

export const generateUploadUrl = mutation({
  args: { activityId: v.id("activities") },
  handler: async (ctx, { activityId }) => {
    await requireHost(ctx, activityId);
    return await ctx.storage.generateUploadUrl();
  },
});

export const addImage = mutation({
  args: {
    activityId: v.id("activities"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { activityId, storageId }) => {
    await requireHost(ctx, activityId);

    const maxOrder = await ctx.db
      .query("imageGallery")
      .withIndex("by_activity", (q) => q.eq("activityId", activityId))
      .take(1000);

    const nextOrder = maxOrder.length > 0
      ? Math.max(...maxOrder.map((i) => i.order)) + 1
      : 0;

    return await ctx.db.insert("imageGallery", {
      activityId,
      storageId,
      uploadedBy: ctx.auth.getUserIdentity()?.subject || "unknown",
      uploadedAt: Date.now(),
      order: nextOrder,
    });
  },
});

export const getGallery = query({
  args: { activityId: v.id("activities") },
  handler: async (ctx, { activityId }) => {
    const images = await ctx.db
      .query("imageGallery")
      .withIndex("by_activity_order", (q) => q.eq("activityId", activityId))
      .order("asc")
      .collect();

    const withUrls = await Promise.all(
      images.map(async (img) => ({
        ...img,
        url: await ctx.storage.getUrl(img.storageId),
      }))
    );

    return withUrls;
  },
});

export const deleteImage = mutation({
  args: { imageId: v.id("imageGallery") },
  handler: async (ctx, { imageId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not signed in");

    const image = await ctx.db.get(imageId);
    if (!image) throw new ConvexError("Image not found");

    const activity = await ctx.db.get(image.activityId);
    if (!activity || activity.hostId !== identity.subject) {
      throw new ConvexError("Not authorized");
    }

    await ctx.db.delete(imageId);
    await ctx.storage.delete(image.storageId);
  },
});
