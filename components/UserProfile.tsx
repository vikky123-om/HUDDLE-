"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Star, Users, Heart } from "lucide-react";

type UserProfileProps = {
  userId: string;
};

export function UserProfile({ userId }: UserProfileProps) {
  const userActivities = useQuery(api.activities.getByUser, { userId });
  const userReviews = useQuery(api.reviews.getUserReviews, { userId });

  if (!userActivities || !userReviews) {
    return <div className="animate-pulse">Loading profile...</div>;
  }

  const avgHostRating =
    userReviews.length > 0
      ? (userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length).toFixed(1)
      : "N/A";

  return (
    <div className="max-w-2xl mx-auto p-6 bg-paper rounded-lg border border-amber-900/15">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-amber-950 mb-2">
          User Profile
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg bg-amber-50 p-4 text-center">
          <Users className="h-6 w-6 text-amber-900 mx-auto mb-2" />
          <p className="text-2xl font-bold text-amber-950">
            {userActivities.hosted.length}
          </p>
          <p className="text-xs text-amber-900/70">Hosted</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-4 text-center">
          <Heart className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-900">
            {userActivities.joined.length}
          </p>
          <p className="text-xs text-blue-900/70">Attended</p>
        </div>
        <div className="rounded-lg bg-yellow-50 p-4 text-center">
          <Star className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-yellow-900">{avgHostRating}</p>
          <p className="text-xs text-yellow-900/70">Avg Rating</p>
        </div>
      </div>

      {/* Hosted Section */}
      {userActivities.hosted.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-lg text-amber-950 mb-4">Hosted</h2>
          <div className="space-y-2">
            {userActivities.hosted.map((activity) => (
              <div
                key={activity._id}
                className="p-3 rounded border border-amber-900/10 hover:bg-amber-50"
              >
                <p className="font-semibold text-amber-950">{activity.title}</p>
                <p className="text-xs text-ink/50">{activity.category}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attended Section */}
      {userActivities.joined.length > 0 && (
        <div>
          <h2 className="font-semibold text-lg text-amber-950 mb-4">Attended</h2>
          <div className="space-y-2">
            {userActivities.joined.map((activity) => (
              <div
                key={activity._id}
                className="p-3 rounded border border-blue-200 hover:bg-blue-50"
              >
                <p className="font-semibold text-blue-900">{activity.title}</p>
                <p className="text-xs text-blue-600">{activity.category}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
