"use client";

import { useQuery, useMutation } from "convex/react";
import { SignInButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Lock,
  Users,
  Share2,
  Check,
  Sparkles,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { CategoryPill } from "@/components/CategoryPill";
import { cn } from "@/lib/utils";
import { catInfo } from "@/lib/categories";

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function HuddleDetailClient({
  activityId,
}: {
  activityId: string;
}) {
  const { isSignedIn } = useAuth();
  const activity = useQuery(api.activities.get, {
    activityId: activityId as Id<"activities">,
  });

  const requestToJoin = useMutation(api.activities.requestToJoin);
  const cancelRequest = useMutation(api.activities.cancelRequest);
  const leave = useMutation(api.activities.leave);

  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function run(action: () => Promise<unknown>) {
    try {
      await action();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Something went wrong");
    }
  }

  /* ---- Loading skeleton -------------------------------------------------- */
  if (activity === undefined) {
    return (
      <div className="min-h-screen bg-[#faecd4]">
        <div className="mx-auto max-w-2xl px-4 py-12">
          {/* Back link skeleton */}
          <div className="mb-8 h-5 w-32 rounded bg-amber-200/60 animate-pulse" />

          {/* Hero skeleton */}
          <div className="rounded-xl overflow-hidden border border-amber-900/10 bg-paper shadow-card">
            <div className="h-56 bg-amber-200/40 animate-pulse" />
            <div className="p-8 space-y-5">
              <div className="h-5 w-24 rounded-full bg-amber-200/60 animate-pulse" />
              <div className="h-8 w-3/4 rounded bg-amber-200/50 animate-pulse" />
              <div className="h-4 w-48 rounded bg-amber-200/40 animate-pulse" />
              <div className="space-y-3 pt-4">
                <div className="h-4 w-56 rounded bg-amber-200/30 animate-pulse" />
                <div className="h-4 w-40 rounded bg-amber-200/30 animate-pulse" />
                <div className="h-4 w-44 rounded bg-amber-200/30 animate-pulse" />
              </div>
              <div className="h-24 rounded bg-amber-200/20 animate-pulse" />
              <div className="h-10 rounded bg-amber-200/40 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---- 404 state --------------------------------------------------------- */
  if (activity === null) {
    return (
      <div className="min-h-screen bg-[#faecd4] flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md px-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 border-2 border-amber-200/60 shadow-card">
            <Sparkles className="h-9 w-9 text-amber-600" />
          </div>
          <h1 className="font-display text-3xl font-bold text-amber-950">
            Huddle not found
          </h1>
          <p className="text-ink/60 leading-relaxed">
            This huddle may have been removed or the link might be incorrect.
            Head back and discover other huddles pinned to the board!
          </p>
          <Link href="/">
            <Button className="shadow-sm gap-2 mt-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Huddle Board
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  /* ---- Derived data ------------------------------------------------------ */
  const info = catInfo(activity.category);
  const isFull = activity.spotsLeft === 0;

  return (
    <div className="min-h-screen bg-[#faecd4]">
      <div className="mx-auto max-w-2xl px-4 py-10">
        {/* Back navigation */}
        <Link
          href="/"
          className="group mb-8 inline-flex items-center gap-2 text-sm font-semibold text-amber-800 hover:text-amber-950 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Huddle Board
        </Link>

        {/* Main card */}
        <article className="rounded-xl overflow-hidden border border-amber-900/10 bg-paper shadow-card transition-shadow hover:shadow-xl">
          {/* Cover hero */}
          {activity.imageUrl ? (
            <div className="relative h-64 sm:h-72 w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activity.imageUrl}
                alt={activity.title}
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/20 to-transparent" />
              {/* Category pill on top of image */}
              <div className="absolute bottom-4 left-6">
                <CategoryPill category={activity.category} />
              </div>
            </div>
          ) : (
            /* Decorative header strip if no image */
            <div
              className={cn(
                "relative h-28 w-full flex items-end px-6 pb-4",
                info.bg
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
              <CategoryPill category={activity.category} />
            </div>
          )}

          {/* Content body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Title & host */}
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight text-amber-950">
                {activity.title}
              </h1>
              <p className="mt-2 text-sm text-ink/60">
                Hosted by{" "}
                <Link
                  href={`/profile/${activity.hostId}`}
                  className="font-semibold text-amber-800 hover:text-amber-950 hover:underline transition-colors"
                >
                  {activity.hostName}
                </Link>
              </p>
            </div>

            {/* Meta details */}
            <div className="grid gap-3 rounded-lg bg-amber-50/60 border border-amber-900/8 p-4">
              {/* When */}
              <div className="flex items-center gap-3 text-sm text-ink/75">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <span className="font-medium">{activity.when}</span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-3 text-sm text-ink/75">
                {activity.location ? (
                  <>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{activity.location}</span>
                  </>
                ) : (
                  <>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                      <Lock className="h-4 w-4" />
                    </div>
                    <span className="italic text-amber-950/55 text-xs">
                      Location revealed after you&apos;re accepted
                    </span>
                  </>
                )}
              </div>

              {/* Spots */}
              <div className="flex items-center gap-3 text-sm text-ink/75">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <Users className="h-4 w-4" />
                </div>
                <span className="font-medium">
                  {isFull
                    ? "All spots filled"
                    : `${activity.spotsLeft} of ${activity.spotsTotal} spots left`}
                </span>
                {isFull && (
                  <span className="ml-auto text-xs font-semibold text-amber-700 bg-amber-100 rounded-full px-2.5 py-0.5 border border-amber-200/60">
                    Full
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {activity.description && (
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-ink/40">
                  About this Huddle
                </h2>
                <p className="text-sm leading-relaxed text-ink/75 bg-amber-50/50 p-4 rounded-lg border border-amber-900/5 whitespace-pre-wrap">
                  {activity.description}
                </p>
              </div>
            )}

            {/* Action buttons row */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {/* Join / Leave / Cancel / Sign-in */}
              <div className="flex-1">
                {activity.isHost ? (
                  <p className="text-sm font-semibold text-center text-ink/50 bg-[#e3d1be]/20 py-2.5 rounded border border-dashed border-amber-900/10">
                    You are hosting this huddle
                  </p>
                ) : !isSignedIn ? (
                  <SignInButton mode="modal">
                    <Button className="w-full shadow-sm gap-2">
                      <Sparkles className="h-4 w-4" />
                      Sign in to Join
                    </Button>
                  </SignInButton>
                ) : activity.myStatus === "joined" ? (
                  <Button
                    className="w-full border-red-200 text-red-700 bg-red-50 hover:bg-red-100 hover:text-red-800"
                    onClick={() =>
                      run(() => leave({ activityId: activity._id }))
                    }
                    variant="outline"
                  >
                    Leave Huddle
                  </Button>
                ) : activity.myStatus === "pending" ? (
                  <Button
                    className="w-full"
                    onClick={() =>
                      run(() => cancelRequest({ activityId: activity._id }))
                    }
                    variant="secondary"
                  >
                    Cancel Request
                  </Button>
                ) : activity.myStatus === "waitlist" ? (
                  <div className="space-y-2">
                    <p className="text-xs text-center font-semibold text-blue-700 bg-blue-50 border border-blue-200/50 rounded py-2 flex items-center justify-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      You&apos;re on the waitlist
                    </p>
                    <Button
                      className="w-full"
                      onClick={() =>
                        run(() => cancelRequest({ activityId: activity._id }))
                      }
                      variant="secondary"
                      size="sm"
                    >
                      Leave Waitlist
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full shadow-sm"
                    onClick={() =>
                      run(() => requestToJoin({ activityId: activity._id }))
                    }
                  >
                    {isFull ? "Join Waitlist" : "Request to Join"}
                  </Button>
                )}
              </div>

              {/* Copy link button */}
              <Button
                variant="outline"
                className={cn(
                  "gap-2 border-amber-900/15 text-amber-900 hover:bg-amber-50 transition-all duration-200 sm:w-auto w-full",
                  copied &&
                    "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                )}
                onClick={copyLink}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>

            {/* Membership status indicator for host */}
            {activity.hostId && isSignedIn && activity.myStatus === null && !isFull && (
              <p className="text-xs text-center text-ink/40 pt-1">
                The host will review your request before you join.
              </p>
            )}
          </div>
        </article>

        {/* Footer */}
        <p className="text-center text-xs text-ink/30 mt-8 font-medium">
          Share this link with friends to invite them to your huddle ✨
        </p>
      </div>
    </div>
  );
}
