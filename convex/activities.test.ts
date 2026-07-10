/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

// Reusable identity helpers
const alice = {
  subject: "user_alice",
  issuer: "https://clerk.example.com",
  name: "Alice",
};

const bob = {
  subject: "user_bob",
  issuer: "https://clerk.example.com",
  name: "Bob",
};

const charlie = {
  subject: "user_charlie",
  issuer: "https://clerk.example.com",
  name: "Charlie",
};

const dave = {
  subject: "user_dave",
  issuer: "https://clerk.example.com",
  name: "Dave",
};

// Reusable huddle creation args
const sampleHuddle = {
  title: "Morning Hike",
  category: "outdoor",
  location: "Trailhead Park",
  secretLocation: false,
  when: "Saturday 8am",
  description: "A chill morning hike",
  spotsTotal: 3,
};

// ---------- 1. Create a huddle (happy path) ----------

test("create a huddle returns an activity ID", async () => {
  const t = convexTest(schema, modules);
  const activityId = await t.withIdentity(alice).mutation(api.activities.create, sampleHuddle);
  expect(activityId).toBeDefined();

  // Verify it shows up in the list
  const activities = await t.withIdentity(alice).query(api.activities.list, {});
  expect(activities).toHaveLength(1);
  expect(activities[0].title).toBe("Morning Hike");
  expect(activities[0].hostId).toBe(alice.subject);
  expect(activities[0].hostName).toBe("Alice");
  expect(activities[0].isHost).toBe(true);
});

// ---------- 2. Create huddle requires auth ----------

test("creating a huddle without auth throws", async () => {
  const t = convexTest(schema, modules);
  await expect(
    t.mutation(api.activities.create, sampleHuddle),
  ).rejects.toThrow("Not signed in");
});

// ---------- 3. Spots validation (1–100) ----------

test("spots must be between 1 and 100", async () => {
  const t = convexTest(schema, modules);

  await expect(
    t.withIdentity(alice).mutation(api.activities.create, { ...sampleHuddle, spotsTotal: 0 }),
  ).rejects.toThrow("Spots must be a whole number between 1 and 100");

  await expect(
    t.withIdentity(alice).mutation(api.activities.create, { ...sampleHuddle, spotsTotal: 101 }),
  ).rejects.toThrow("Spots must be a whole number between 1 and 100");

  await expect(
    t.withIdentity(alice).mutation(api.activities.create, { ...sampleHuddle, spotsTotal: -1 }),
  ).rejects.toThrow("Spots must be a whole number between 1 and 100");

  // Valid boundary values should work
  const id1 = await t.withIdentity(alice).mutation(api.activities.create, { ...sampleHuddle, spotsTotal: 1 });
  expect(id1).toBeDefined();

  const id100 = await t.withIdentity(alice).mutation(api.activities.create, { ...sampleHuddle, spotsTotal: 100 });
  expect(id100).toBeDefined();
});

// ---------- 4. Host cannot join own huddle ----------

test("host cannot request to join their own huddle", async () => {
  const t = convexTest(schema, modules);
  const activityId = await t.withIdentity(alice).mutation(api.activities.create, sampleHuddle);

  await expect(
    t.withIdentity(alice).mutation(api.activities.requestToJoin, { activityId }),
  ).rejects.toThrow("Hosts are already part of their own huddles");
});

// ---------- 5. Request to join creates pending membership + notification ----------

test("request to join creates pending membership and notifies host", async () => {
  const t = convexTest(schema, modules);
  const activityId = await t.withIdentity(alice).mutation(api.activities.create, sampleHuddle);

  // Bob requests to join
  const membershipId = await t.withIdentity(bob).mutation(api.activities.requestToJoin, { activityId });
  expect(membershipId).toBeDefined();

  // Check the activity list shows Bob as pending
  const activities = await t.withIdentity(alice).query(api.activities.list, {});
  expect(activities[0].pendingCount).toBe(1);
  expect(activities[0].pending[0].userId).toBe(bob.subject);
  expect(activities[0].pending[0].status).toBe("pending");

  // Check notification was created for the host (Alice)
  const notifications = await t.run(async (ctx) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", alice.subject))
      .collect();
  });
  expect(notifications).toHaveLength(1);
  expect(notifications[0].type).toBe("request");
  expect(notifications[0].fromName).toBe("Bob");
  expect(notifications[0].activityTitle).toBe("Morning Hike");
});

// ---------- 6. Accept promotes pending to joined + creates notification ----------

test("accepting a request promotes to joined and notifies the user", async () => {
  const t = convexTest(schema, modules);
  const activityId = await t.withIdentity(alice).mutation(api.activities.create, sampleHuddle);

  // Bob requests, Alice accepts
  await t.withIdentity(bob).mutation(api.activities.requestToJoin, { activityId });
  await t.withIdentity(alice).mutation(api.activities.accept, {
    activityId,
    userId: bob.subject,
  });

  // Check Bob is now joined
  const activities = await t.withIdentity(alice).query(api.activities.list, {});
  expect(activities[0].joinedCount).toBe(1);
  expect(activities[0].joined[0].userId).toBe(bob.subject);
  expect(activities[0].joined[0].status).toBe("joined");

  // Check "accepted" notification was created for Bob
  const notifications = await t.run(async (ctx) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", bob.subject))
      .collect();
  });
  const acceptedNotif = notifications.find((n) => n.type === "accepted");
  expect(acceptedNotif).toBeDefined();
  expect(acceptedNotif!.activityTitle).toBe("Morning Hike");
});

// ---------- 7. Decline removes membership + creates notification ----------

test("declining a request removes membership and notifies the user", async () => {
  const t = convexTest(schema, modules);
  const activityId = await t.withIdentity(alice).mutation(api.activities.create, sampleHuddle);

  // Bob requests, Alice declines
  await t.withIdentity(bob).mutation(api.activities.requestToJoin, { activityId });
  await t.withIdentity(alice).mutation(api.activities.decline, {
    activityId,
    userId: bob.subject,
  });

  // Membership should be gone
  const activities = await t.withIdentity(alice).query(api.activities.list, {});
  expect(activities[0].joinedCount).toBe(0);
  expect(activities[0].pendingCount).toBe(0);

  // "declined" notification should exist for Bob
  const notifications = await t.run(async (ctx) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", bob.subject))
      .collect();
  });
  const declinedNotif = notifications.find((n) => n.type === "declined");
  expect(declinedNotif).toBeDefined();
  expect(declinedNotif!.activityTitle).toBe("Morning Hike");
});

// ---------- 8. Can't accept when huddle is full ----------

test("cannot accept a request when the huddle is full", async () => {
  const t = convexTest(schema, modules);

  // Create a huddle with only 1 spot
  const activityId = await t.withIdentity(alice).mutation(api.activities.create, {
    ...sampleHuddle,
    spotsTotal: 1,
  });

  // Bob and Charlie request to join
  await t.withIdentity(bob).mutation(api.activities.requestToJoin, { activityId });
  await t.withIdentity(charlie).mutation(api.activities.requestToJoin, { activityId });

  // Accept Bob (fills the 1 spot)
  await t.withIdentity(alice).mutation(api.activities.accept, {
    activityId,
    userId: bob.subject,
  });

  // Now trying to accept Charlie should fail
  await expect(
    t.withIdentity(alice).mutation(api.activities.accept, {
      activityId,
      userId: charlie.subject,
    }),
  ).rejects.toThrow("This huddle is full");
});

// ---------- 9. Leave promotes first waitlisted person ----------

test("leaving a full huddle promotes the first waitlisted person to pending", async () => {
  const t = convexTest(schema, modules);

  // Create a huddle with 1 spot
  const activityId = await t.withIdentity(alice).mutation(api.activities.create, {
    ...sampleHuddle,
    spotsTotal: 1,
  });

  // Bob requests → pending (spot available)
  await t.withIdentity(bob).mutation(api.activities.requestToJoin, { activityId });
  // Accept Bob → joined
  await t.withIdentity(alice).mutation(api.activities.accept, {
    activityId,
    userId: bob.subject,
  });

  // Charlie requests → waitlist (full)
  await t.withIdentity(charlie).mutation(api.activities.requestToJoin, { activityId });

  // Verify Charlie is on waitlist
  const beforeLeave = await t.withIdentity(alice).query(api.activities.list, {});
  expect(beforeLeave[0].waitlistCount).toBe(1);

  // Bob leaves
  await t.withIdentity(bob).mutation(api.activities.leave, { activityId });

  // Charlie should now be promoted to pending
  const afterLeave = await t.withIdentity(alice).query(api.activities.list, {});
  expect(afterLeave[0].waitlistCount).toBe(0);
  expect(afterLeave[0].pendingCount).toBe(1);
  expect(afterLeave[0].pending[0].userId).toBe(charlie.subject);
  expect(afterLeave[0].pending[0].status).toBe("pending");
});

// ---------- 10. Can't reduce spots below joined count ----------

test("cannot reduce spots below the current joined count", async () => {
  const t = convexTest(schema, modules);
  const activityId = await t.withIdentity(alice).mutation(api.activities.create, {
    ...sampleHuddle,
    spotsTotal: 3,
  });

  // Bob and Charlie join
  await t.withIdentity(bob).mutation(api.activities.requestToJoin, { activityId });
  await t.withIdentity(charlie).mutation(api.activities.requestToJoin, { activityId });
  await t.withIdentity(alice).mutation(api.activities.accept, { activityId, userId: bob.subject });
  await t.withIdentity(alice).mutation(api.activities.accept, { activityId, userId: charlie.subject });

  // Try to reduce spots to 1 (but 2 are joined)
  await expect(
    t.withIdentity(alice).mutation(api.activities.update, {
      activityId,
      ...sampleHuddle,
      spotsTotal: 1,
    }),
  ).rejects.toThrow("Cannot reduce spots below current joined count");

  // Reducing to 2 (exact joined count) should work
  await t.withIdentity(alice).mutation(api.activities.update, {
    activityId,
    ...sampleHuddle,
    spotsTotal: 2,
  });

  const activities = await t.withIdentity(alice).query(api.activities.list, {});
  expect(activities[0].spotsTotal).toBe(2);
});

// ---------- 11. Secret location is hidden for non-members ----------

test("secret location is hidden for users who are not joined", async () => {
  const t = convexTest(schema, modules);

  // Create huddle with secret location
  const activityId = await t.withIdentity(alice).mutation(api.activities.create, {
    ...sampleHuddle,
    secretLocation: true,
    location: "Secret Treehouse",
  });

  // Non-member (Charlie) should NOT see the location
  const asCharlie = await t.withIdentity(charlie).query(api.activities.list, {});
  expect(asCharlie[0].location).toBeNull();

  // Unauthenticated user should NOT see the location
  const asAnon = await t.query(api.activities.list, {});
  expect(asAnon[0].location).toBeNull();

  // Host (Alice) should always see the location
  const asAlice = await t.withIdentity(alice).query(api.activities.list, {});
  expect(asAlice[0].location).toBe("Secret Treehouse");

  // Bob requests and gets accepted (joined member)
  await t.withIdentity(bob).mutation(api.activities.requestToJoin, { activityId });
  await t.withIdentity(alice).mutation(api.activities.accept, { activityId, userId: bob.subject });

  // Joined member (Bob) should see the location
  const asBob = await t.withIdentity(bob).query(api.activities.list, {});
  expect(asBob[0].location).toBe("Secret Treehouse");

  // Pending member should NOT see the location
  await t.withIdentity(dave).mutation(api.activities.requestToJoin, { activityId });
  const asDave = await t.withIdentity(dave).query(api.activities.list, {});
  expect(asDave[0].location).toBeNull();
});

// ---------- 12. Only host can delete ----------

test("only the host can delete a huddle", async () => {
  const t = convexTest(schema, modules);
  const activityId = await t.withIdentity(alice).mutation(api.activities.create, sampleHuddle);

  // Bob requests to join
  await t.withIdentity(bob).mutation(api.activities.requestToJoin, { activityId });

  // Bob tries to delete — should fail
  await expect(
    t.withIdentity(bob).mutation(api.activities.remove, { activityId }),
  ).rejects.toThrow("Only the host can do that");

  // Unauthenticated user tries to delete — should fail
  await expect(
    t.mutation(api.activities.remove, { activityId }),
  ).rejects.toThrow("Not signed in");

  // Alice (host) can delete
  await t.withIdentity(alice).mutation(api.activities.remove, { activityId });

  // Verify the activity is gone
  const activities = await t.withIdentity(alice).query(api.activities.list, {});
  expect(activities).toHaveLength(0);

  // Verify memberships are also cleaned up
  const memberships = await t.run(async (ctx) => {
    return await ctx.db.query("memberships").collect();
  });
  expect(memberships).toHaveLength(0);
});
