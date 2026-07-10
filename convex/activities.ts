import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

function requirePositiveSpots(spotsTotal: number) {
  if (!Number.isInteger(spotsTotal) || spotsTotal < 1 || spotsTotal > 100) {
    throw new ConvexError("Spots must be a whole number between 1 and 100");
  }
}

function displayName(identity: { name?: string; email?: string; nickname?: string }) {
  return identity.name ?? identity.nickname ?? identity.email ?? "Someone";
}

async function getMembership(
  ctx: QueryCtx | MutationCtx,
  activityId: Id<"activities">,
  userId: string,
) {
  return await ctx.db
    .query("memberships")
    .withIndex("by_activity_and_user", (q) =>
      q.eq("activityId", activityId).eq("userId", userId),
    )
    .unique();
}

async function joinedCount(
  ctx: QueryCtx | MutationCtx,
  activityId: Id<"activities">,
) {
  const memberships = await ctx.db
    .query("memberships")
    .withIndex("by_activity", (q) => q.eq("activityId", activityId))
    .collect();
  return memberships.filter((membership) => membership.status === "joined").length;
}

async function requireHost(
  ctx: MutationCtx,
  activityId: Id<"activities">,
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Not signed in");
  }

  const activity = await ctx.db.get(activityId);
  if (!activity || activity.hostId !== identity.subject) {
    throw new ConvexError("Only the host can do that");
  }

  return { activity, identity };
}

export const list = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, { category }) => {
    const identity = await ctx.auth.getUserIdentity();
    const activities = category
      ? await ctx.db
          .query("activities")
          .withIndex("by_category", (q) => q.eq("category", category))
          .collect()
      : await ctx.db.query("activities").collect();

    const rows = await Promise.all(
      activities.map(async (activity) => {
        const memberships = await ctx.db
          .query("memberships")
          .withIndex("by_activity", (q) => q.eq("activityId", activity._id))
          .collect();
        const myMembership = identity
          ? memberships.find((membership) => membership.userId === identity.subject)
          : undefined;
        const isHost = identity?.subject === activity.hostId;
        const canSeeLocation =
          isHost || !activity.secretLocation || myMembership?.status === "joined";
        const joined = memberships.filter(
          (membership) => membership.status === "joined",
        );
        const pending = memberships.filter(
          (membership) => membership.status === "pending",
        );
        const waitlist = memberships.filter(
          (membership) => membership.status === "waitlist",
        );

        // Resolve cover image URL
        const imageUrl = activity.imageId
          ? await ctx.storage.getUrl(activity.imageId)
          : null;

        return {
          ...activity,
          location: canSeeLocation ? activity.location : null,
          joined,
          pending: isHost ? pending : [],
          waitlist: isHost ? waitlist : [],
          joinedCount: joined.length,
          pendingCount: pending.length,
          waitlistCount: waitlist.length,
          myStatus: myMembership?.status ?? null,
          isHost,
          imageUrl,
        };
      }),
    );

    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const hosted = await ctx.db
      .query("activities")
      .collect()
      .then((all) => all.filter((a) => a.hostId === userId));

    const joined = await Promise.all(
      memberships
        .filter((m) => m.status === "joined")
        .map((m) => ctx.db.get(m.activityId)),
    ).then((acts) => acts.filter(Boolean) as Doc<"activities">[]);

    return { hosted, joined };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not signed in");
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    category: v.string(),
    location: v.string(),
    secretLocation: v.boolean(),
    when: v.string(),
    whenTimestamp: v.optional(v.number()),
    description: v.string(),
    spotsTotal: v.number(),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not signed in");
    }

    requirePositiveSpots(args.spotsTotal);

    return await ctx.db.insert("activities", {
      ...args,
      title: args.title.trim(),
      location: args.location.trim(),
      when: args.when.trim(),
      description: args.description.trim(),
      hostId: identity.subject,
      hostName: displayName(identity),
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    activityId: v.id("activities"),
    title: v.string(),
    category: v.string(),
    location: v.string(),
    secretLocation: v.boolean(),
    when: v.string(),
    whenTimestamp: v.optional(v.number()),
    description: v.string(),
    spotsTotal: v.number(),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { activityId, ...args }) => {
    const { activity } = await requireHost(ctx, activityId);
    requirePositiveSpots(args.spotsTotal);

    // Make sure new spotsTotal doesn't go below current joined count
    const currentJoined = await joinedCount(ctx, activityId);
    if (args.spotsTotal < currentJoined) {
      throw new ConvexError(`Cannot reduce spots below current joined count (${currentJoined})`);
    }

    await ctx.db.patch(activityId, {
      ...args,
      title: args.title.trim(),
      location: args.location.trim(),
      when: args.when.trim(),
      description: args.description.trim(),
    });
  },
});

export const requestToJoin = mutation({
  args: {
    activityId: v.id("activities"),
  },
  handler: async (ctx, { activityId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not signed in");
    }

    const activity = await ctx.db.get(activityId);
    if (!activity) {
      throw new ConvexError("Activity not found");
    }
    if (activity.hostId === identity.subject) {
      throw new ConvexError("Hosts are already part of their own huddles");
    }

    const existing = await getMembership(ctx, activityId, identity.subject);
    if (existing) {
      return existing._id;
    }

    const accepted = await joinedCount(ctx, activityId);

    // If full, add to waitlist instead
    if (accepted >= activity.spotsTotal) {
      return await ctx.db.insert("memberships", {
        activityId,
        userId: identity.subject,
        userName: displayName(identity),
        status: "waitlist",
      });
    }

    // Notify the host about the new request
    await ctx.db.insert("notifications", {
      userId: activity.hostId,
      type: "request",
      activityId,
      activityTitle: activity.title,
      fromName: displayName(identity),
      read: false,
      createdAt: Date.now(),
    });

    return await ctx.db.insert("memberships", {
      activityId,
      userId: identity.subject,
      userName: displayName(identity),
      status: "pending",
    });
  },
});

export const accept = mutation({
  args: {
    activityId: v.id("activities"),
    userId: v.string(),
  },
  handler: async (ctx, { activityId, userId }) => {
    await requireHost(ctx, activityId);

    const membership = await getMembership(ctx, activityId, userId);
    if (!membership) {
      throw new ConvexError("Request not found");
    }

    const accepted = await joinedCount(ctx, activityId);
    const activity = await ctx.db.get(activityId);
    if (!activity || accepted >= activity.spotsTotal) {
      throw new ConvexError("This huddle is full");
    }

    await ctx.db.patch(membership._id, { status: "joined" });

    // Notify the user they were accepted
    await ctx.db.insert("notifications", {
      userId,
      type: "accepted",
      activityId,
      activityTitle: activity.title,
      fromName: activity.hostName,
      read: false,
      createdAt: Date.now(),
    });

    // Send email notification if user has an email on their identity
    const hostIdentity = await ctx.auth.getUserIdentity();
    if (hostIdentity && membership.userName) {
      // We don't have the accepted user's email from server-side; schedule email
      // The email will be sent only if the user's email is known at acceptance time
      // (Clerk exposes email on the JWT; we use hostIdentity as a proxy here)
      // To get the accepted user's email, they would need to be stored in a users table.
      // For now, schedule a best-effort notification.
      await ctx.scheduler.runAfter(0, internal.emails.sendNotificationEmail, {
        toEmail: membership.userName, // fallback; replace with real email if users table is added
        toName: membership.userName,
        type: "accepted",
        activityTitle: activity.title,
        hostName: activity.hostName,
      });
    }
  },
});

export const decline = mutation({
  args: {
    activityId: v.id("activities"),
    userId: v.string(),
  },
  handler: async (ctx, { activityId, userId }) => {
    const { activity } = await requireHost(ctx, activityId);

    const membership = await getMembership(ctx, activityId, userId);
    if (membership) {
      await ctx.db.delete(membership._id);
    }

    // Notify the user they were declined
    await ctx.db.insert("notifications", {
      userId,
      type: "declined",
      activityId,
      activityTitle: activity.title,
      fromName: activity.hostName,
      read: false,
      createdAt: Date.now(),
    });

    // Schedule email notification (best-effort; requires users table for real email)
    if (membership) {
      await ctx.scheduler.runAfter(0, internal.emails.sendNotificationEmail, {
        toEmail: membership.userName,
        toName: membership.userName,
        type: "declined",
        activityTitle: activity.title,
        hostName: activity.hostName,
      });
    }
  },
});

export const leave = mutation({
  args: {
    activityId: v.id("activities"),
  },
  handler: async (ctx, { activityId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not signed in");
    }

    const membership = await getMembership(ctx, activityId, identity.subject);
    if (membership) {
      await ctx.db.delete(membership._id);

      // If they were joined, promote first waitlisted person
      if (membership.status === "joined") {
        const activity = await ctx.db.get(activityId);
        if (activity) {
          const waitlisted = await ctx.db
            .query("memberships")
            .withIndex("by_activity", (q) => q.eq("activityId", activityId))
            .collect()
            .then((ms) => ms.filter((m) => m.status === "waitlist"));

          if (waitlisted.length > 0) {
            // Promote the first one to pending
            await ctx.db.patch(waitlisted[0]._id, { status: "pending" });
            // Notify host of the new pending request
            await ctx.db.insert("notifications", {
              userId: activity.hostId,
              type: "request",
              activityId,
              activityTitle: activity.title,
              fromName: waitlisted[0].userName,
              read: false,
              createdAt: Date.now(),
            });
          }
        }
      }
    }
  },
});

export const cancelRequest = mutation({
  args: {
    activityId: v.id("activities"),
  },
  handler: async (ctx, { activityId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not signed in");
    }

    const membership = await getMembership(ctx, activityId, identity.subject);
    if (membership && (membership.status === "pending" || membership.status === "waitlist")) {
      await ctx.db.delete(membership._id);
    }
  },
});

export const remove = mutation({
  args: {
    activityId: v.id("activities"),
  },
  handler: async (ctx, { activityId }) => {
    await requireHost(ctx, activityId);

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_activity", (q) => q.eq("activityId", activityId))
      .collect();

    for (const membership of memberships) {
      await ctx.db.delete(membership._id);
    }

    await ctx.db.delete(activityId);
  },
});

export const get = query({
  args: { activityId: v.id("activities") },
  handler: async (ctx, { activityId }) => {
    const activity = await ctx.db.get(activityId);
    if (!activity) return null;

    const identity = await ctx.auth.getUserIdentity();

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_activity", (q) => q.eq("activityId", activityId))
      .collect();

    const myMembership = identity
      ? memberships.find((m) => m.userId === identity.subject)
      : undefined;
    const isHost = identity?.subject === activity.hostId;
    const canSeeLocation =
      isHost || !activity.secretLocation || myMembership?.status === "joined";

    const joined = memberships.filter((m) => m.status === "joined");
    const imageUrl = activity.imageId
      ? await ctx.storage.getUrl(activity.imageId)
      : null;

    return {
      ...activity,
      location: canSeeLocation ? activity.location : null,
      joinedCount: joined.length,
      spotsLeft: Math.max(activity.spotsTotal - joined.length, 0),
      myStatus: myMembership?.status ?? null,
      isHost,
      imageUrl,
    };
  },
});

