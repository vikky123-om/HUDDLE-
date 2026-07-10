import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  activities: defineTable({
    title: v.string(),
    category: v.string(),
    location: v.string(),
    secretLocation: v.boolean(),
    when: v.string(),
    whenTimestamp: v.optional(v.number()),
    description: v.string(),
    spotsTotal: v.number(),
    hostId: v.string(),
    hostName: v.string(),
    createdAt: v.number(),
    imageId: v.optional(v.id("_storage")),
  }).index("by_category", ["category"]),

  memberships: defineTable({
    activityId: v.id("activities"),
    userId: v.string(),
    userName: v.string(),
    status: v.union(
      v.literal("joined"),
      v.literal("pending"),
      v.literal("waitlist"),
    ),
  })
    .index("by_activity", ["activityId"])
    .index("by_activity_and_user", ["activityId", "userId"])
    .index("by_user", ["userId"]),

  messages: defineTable({
    activityId: v.id("activities"),
    userId: v.string(),
    userName: v.string(),
    text: v.string(),
    createdAt: v.number(),
  }).index("by_activity", ["activityId"]),

  notifications: defineTable({
    userId: v.string(),
    type: v.union(
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("request"),
    ),
    activityId: v.id("activities"),
    activityTitle: v.string(),
    fromName: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
