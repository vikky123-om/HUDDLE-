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
    deletedAt: v.optional(v.number()),
    archived: v.optional(v.boolean()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  })
    .index("by_category", ["category"])
    .index("by_created_at", ["createdAt"])
    .index("by_host_id", ["hostId"])
    .index("by_created_at_desc", ["createdAt"]),

  memberships: defineTable({
    activityId: v.id("activities"),
    userId: v.string(),
    userName: v.string(),
    status: v.union(
      v.literal("joined"),
      v.literal("pending"),
      v.literal("waitlist")
    ),
  })
    .index("by_activity", ["activityId"])
    .index("by_activity_and_user", ["activityId", "userId"])
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"]),

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
      v.literal("request")
    ),
    activityId: v.id("activities"),
    activityTitle: v.string(),
    fromName: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  deviceTokens: defineTable({
    userId: v.string(),
    token: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_token", ["token"]),

  reviews: defineTable({
    activityId: v.id("activities"),
    reviewerId: v.string(),
    reviewerName: v.string(),
    rating: v.number(),
    comment: v.string(),
    createdAt: v.number(),
  })
    .index("by_activity", ["activityId"])
    .index("by_reviewer", ["reviewerId"]),

  rateLimitLog: defineTable({
    userId: v.string(),
    action: v.union(
      v.literal("create_huddle"),
      v.literal("send_message"),
      v.literal("join_request")
    ),
    timestamp: v.number(),
  })
    .index("by_user_and_action", ["userId", "action"])
    .index("by_timestamp", ["timestamp"]),

  imageGallery: defineTable({
    activityId: v.id("activities"),
    storageId: v.id("_storage"),
    uploadedBy: v.string(),
    uploadedAt: v.number(),
    order: v.number(),
  })
    .index("by_activity", ["activityId"])
    .index("by_activity_order", ["activityId", "order"]),

  auditLog: defineTable({
    userId: v.string(),
    action: v.string(),
    targetId: v.optional(v.string()),
    targetType: v.string(),
    details: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_target", ["targetType", "targetId"]),
});
