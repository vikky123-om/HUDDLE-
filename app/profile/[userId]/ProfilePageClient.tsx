"use client";

import { useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, CalendarDays, MapPin, Lock, Users, Star, Clock } from "lucide-react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { catInfo } from "@/lib/categories";
import { cn } from "@/lib/utils";

type MiniActivity = {
  _id: string;
  title: string;
  category: string;
  when: string;
  location: string;
  joinedCount?: number;
  spotsTotal: number;
  imageId?: string;
  imageUrl?: string | null;
};

function MiniCard({ activity }: { activity: MiniActivity }) {
  const info = catInfo(activity.category);
  const joinedCount = activity.joinedCount ?? 0;
  const spotsLeft = Math.max(activity.spotsTotal - joinedCount, 0);

  return (
    <div
      className={cn(
        "rounded-lg border border-amber-900/15 bg-paper shadow-card overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg group"
      )}
    >
      {activity.imageUrl && (
        <div className="h-28 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activity.imageUrl}
            alt={activity.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-4">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
            info.bg,
            info.text,
            info.border
          )}
        >
          {info.label}
        </span>
        <h3 className="mt-2 font-display text-lg font-bold text-amber-950 leading-tight">
          {activity.title}
        </h3>
        <div className="mt-2 space-y-1 text-xs text-ink/65">
          <p className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-primary/70" />
            {activity.when}
          </p>
          <p className="flex items-center gap-1.5">
            {activity.location ? (
              <>
                <MapPin className="h-3.5 w-3.5 text-primary/70" />
                <span className="truncate">{activity.location}</span>
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5 text-amber-600/70" />
                <span className="italic text-amber-950/50">Hidden location</span>
              </>
            )}
          </p>
          <p className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary/70" />
            {spotsLeft === 0
              ? "Full"
              : `${spotsLeft}/${activity.spotsTotal} spots left`}
          </p>
        </div>
      </div>
    </div>
  );
}

type Props = {
  userId: string;
};

export default function ProfilePageClient({ userId }: Props) {
  const { userId: currentUserId } = useAuth();
  const data = useQuery(api.activities.getByUser, { userId });

  const isOwnProfile = currentUserId === userId;

  // Derive display name from hosted activities
  const displayName =
    data?.hosted?.[0]?.hostName ??
    (isOwnProfile ? "Your Profile" : "Member Profile");

  if (data === undefined) {
    return (
      <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col gap-6">
            <div className="h-28 w-full animate-pulse rounded-xl bg-paper/60" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-48 animate-pulse rounded-lg bg-paper/60"
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  const hosted = data.hosted ?? [];
  const joined = data.joined ?? [];

  const initials =
    displayName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <main className="min-h-screen px-4 py-8 text-ink sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 hover:text-ink transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Huddle
        </Link>

        {/* Profile Header */}
        <div className="rounded-xl border border-amber-900/15 bg-paper shadow-card p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-full bg-amber-800 text-amber-50 font-bold text-2xl shadow-md ring-4 ring-amber-100"
              style={{ width: 72, height: 72 }}
            >
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-3xl font-black text-amber-950">
                  {displayName}
                </h1>
                {isOwnProfile && (
                  <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary">
                    You
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex items-center gap-4 text-sm text-ink/60 font-medium">
                <span className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  {hosted.length} huddle{hosted.length !== 1 ? "s" : ""} hosted
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary/70" />
                  {joined.length} joined
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hosted Huddles */}
        <section className="mb-10">
          <h2 className="font-display text-2xl font-bold text-amber-950 mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Hosted Huddles
            <span className="ml-1 text-base font-normal text-ink/40">
              ({hosted.length})
            </span>
          </h2>
          {hosted.length === 0 ? (
            <div className="rounded-lg border border-dashed border-amber-900/20 bg-paper/60 p-10 text-center text-ink/40">
              <p className="font-medium">No hosted huddles yet</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hosted.map((a) => (
                <MiniCard
                  key={a._id}
                  activity={{
                    ...a,
                    location: a.location ?? "",
                    imageUrl: undefined,
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* Joined Huddles (only show on own profile) */}
        {isOwnProfile && (
          <section>
            <h2 className="font-display text-2xl font-bold text-amber-950 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Joined Huddles
              <span className="ml-1 text-base font-normal text-ink/40">
                ({joined.length})
              </span>
            </h2>
            {joined.length === 0 ? (
              <div className="rounded-lg border border-dashed border-amber-900/20 bg-paper/60 p-10 text-center text-ink/40">
                <p className="font-medium">
                  Haven&apos;t joined any huddles yet
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {joined.map((a) => (
                  <MiniCard
                    key={a._id}
                    activity={{
                      ...a,
                      location: a.location ?? "",
                      imageUrl: undefined,
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
