"use client";

import { useMutation, useQuery } from "convex/react";
import { Star, MessageSquare, AlertCircle } from "lucide-react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

type ReviewProps = {
  activityId: Id<"activities">;
  userJoined: boolean;
};

export function ReviewSection({ activityId, userJoined }: ReviewProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const submitReview = useMutation(api.reviews.add);
  const { reviews, averageRating, totalReviews } = useQuery(
    api.reviews.getActivityReviews,
    { activityId }
  ) || { reviews: [], averageRating: 0, totalReviews: 0 };

  async function handleSubmit() {
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }
    try {
      await submitReview({ activityId, rating, comment });
      setRating(0);
      setComment("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit review");
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-amber-900/15 bg-paper p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg text-amber-950">Reviews</h3>
        <div className="flex items-center gap-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.round(averageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold">
            {averageRating.toFixed(1)} ({totalReviews})
          </span>
        </div>
      </div>

      {userJoined && !submitted ? (
        <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm font-semibold mb-3 text-amber-950">
            Share your experience
          </p>
          <div className="flex gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-6 w-6 ${
                    star <= rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you think?"
            maxLength={500}
            className="w-full rounded-md border border-amber-900/20 p-2 text-sm focus:ring-2 focus:ring-primary/50"
            rows={3}
          />
          <Button
            onClick={handleSubmit}
            className="w-full mt-2"
            size="sm"
          >
            Submit Review
          </Button>
        </div>
      ) : submitted ? (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
          ✓ Review submitted! Thanks for sharing.
        </div>
      ) : null}

      <div className="space-y-3 max-h-60 overflow-y-auto">
        {reviews && reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review._id} className="border-t border-amber-900/10 pt-3 first:border-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm text-amber-950">
                    {review.reviewerName}
                  </p>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {review.comment && (
                <p className="text-xs text-ink/70 mt-1">{review.comment}</p>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-ink/50 text-center py-4">No reviews yet</p>
        )}
      </div>
    </div>
  );
}
