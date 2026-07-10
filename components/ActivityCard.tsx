"use client";

import { useMutation } from "convex/react";
import { CalendarDays, Lock, MapPin, Trash2, Users, Pencil, MessageCircle, Clock, Share2, Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { CategoryPill } from "@/components/CategoryPill";
import { catInfo, seededRotation } from "@/lib/categories";
import { cn } from "@/lib/utils";

type Member = {
  userId: string;
  userName: string;
  status: "joined" | "pending" | "waitlist";
};

export type Activity = {
  _id: Id<"activities">;
  title: string;
  category: string;
  location: string | null;
  secretLocation: boolean;
  when: string;
  whenTimestamp?: number;
  description: string;
  spotsTotal: number;
  hostId: string;
  hostName: string;
  joined: Member[];
  pending: Member[];
  waitlist: Member[];
  joinedCount: number;
  pendingCount: number;
  waitlistCount: number;
  myStatus: "joined" | "pending" | "waitlist" | null;
  isHost: boolean;
  imageUrl?: string | null;
  imageId?: Id<"_storage">;
};

type ActivityCardProps = {
  activity: Activity;
  isSignedIn: boolean;
  onEdit?: (activity: Activity) => void;
  onChat?: (activity: Activity) => void;
};

export function ActivityCard({ activity, isSignedIn, onEdit, onChat }: ActivityCardProps) {
  const requestToJoin = useMutation(api.activities.requestToJoin);
  const cancelRequest = useMutation(api.activities.cancelRequest);
  const leave = useMutation(api.activities.leave);
  const accept = useMutation(api.activities.accept);
  const decline = useMutation(api.activities.decline);
  const remove = useMutation(api.activities.remove);
  const spotsLeft = Math.max(activity.spotsTotal - activity.joinedCount, 0);
  const isFull = spotsLeft === 0;

  const info = catInfo(activity.category);

  async function run(action: () => Promise<unknown>) {
    try {
      await action();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Something went wrong");
    }
  }

  const canChat = activity.isHost || activity.myStatus === "joined";
  const [copied, setCopied] = useState(false);

  function copyLink() {
    const url = `${window.location.origin}/huddle/${activity._id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <article
      className="relative flex min-h-[24rem] flex-col rounded-md border border-amber-900/15 bg-paper shadow-card transition-all duration-300 ease-out rotate-[var(--card-rotation)] hover:rotate-0 hover:-translate-y-1.5 hover:scale-[1.03] hover:shadow-2xl group overflow-hidden"
      style={{ "--card-rotation": `${seededRotation(activity._id)}deg` } as React.CSSProperties}
    >
      {/* 3D Push Pin */}
      <div className="absolute left-1/2 -top-2.5 -translate-x-1/2 z-10 select-none pointer-events-none filter drop-shadow-[0_3px_2px_rgba(0,0,0,0.35)] flex flex-col items-center">
        <div className={cn("h-4.5 w-4.5 rounded-full border border-white/20 relative shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)]", info.pinBg)} style={{ width: '18px', height: '18px' }} />
        <div className={cn("w-2 h-3.5 -mt-0.5 opacity-90 border-x border-white/10 relative", info.pinBg)} style={{ borderRadius: '1px 1px 2px 2px', width: '8px', height: '10px' }} />
        <div className="w-[1.5px] h-3.5 bg-zinc-400 -mt-[1px] relative shadow-sm" />
      </div>

      {/* Cover Image */}
      {activity.imageUrl && (
        <div className="relative h-36 w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activity.imageUrl}
            alt={activity.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-paper/40" />
        </div>
      )}

      <div className={cn("flex flex-col flex-1 p-6", activity.imageUrl ? "pt-3" : "pt-6")}>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CategoryPill category={activity.category} />
            <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-amber-950 group-hover:text-amber-900 transition-colors">
              {activity.title}
            </h2>
            <p className="mt-1 text-xs text-ink/65">
              Hosted by{" "}
              <Link
                href={`/profile/${activity.hostId}`}
                className="font-semibold text-ink/80 hover:text-primary hover:underline transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {activity.hostName}
              </Link>
            </p>
          </div>

          {/* Host action buttons */}
          {activity.isHost && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                aria-label="Edit huddle"
                onClick={() => onEdit?.(activity)}
                size="icon"
                variant="ghost"
                className="text-ink/50 hover:bg-amber-100 hover:text-amber-900"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                aria-label="Delete huddle"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this huddle?")) {
                    run(() => remove({ activityId: activity._id }));
                  }
                }}
                size="icon"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2 text-sm text-ink/75">
          <p className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary/70 flex-shrink-0" />
            <span className="font-medium">{activity.when}</span>
          </p>
          <p className="flex items-center gap-2">
            {activity.location ? (
              <>
                <MapPin className="h-4 w-4 text-primary/70 flex-shrink-0" />
                <span className="truncate">{activity.location}</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 text-amber-600/80 flex-shrink-0" />
                <span className="italic text-amber-950/60 text-xs">Location hidden until accepted</span>
              </>
            )}
          </p>
          <p className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary/70 flex-shrink-0" />
            <span>
              {isFull
                ? `Full · ${activity.waitlistCount > 0 ? `${activity.waitlistCount} on waitlist` : "No spots left"}`
                : `${spotsLeft} of ${activity.spotsTotal} spots left`}
            </span>
          </p>
        </div>

        {activity.description ? (
          <p className="mt-4 text-sm leading-relaxed text-ink/75 bg-amber-50/50 p-2.5 rounded border border-amber-900/5 min-h-[4rem]">
            {activity.description}
          </p>
        ) : null}

        {/* Members list */}
        {activity.joined.length > 0 && (
          <div className="mt-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40 block mb-1.5">
              Joined ({activity.joinedCount}/{activity.spotsTotal})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activity.joined.map((member) => {
                const initials = member.userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "?";
                return (
                  <span
                    key={member.userId}
                    title={member.userName}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#fdfaf2] hover:bg-white px-2 py-0.5 text-xs font-semibold text-amber-950/80 border border-amber-900/10 transition-colors shadow-sm cursor-help"
                  >
                    <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-amber-800/85 text-[9px] font-bold text-amber-50" style={{ width: '18px', height: '18px' }}>
                      {initials}
                    </span>
                    <span className="truncate max-w-[80px]">{member.userName}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Host: pending requests */}
        {activity.isHost && activity.pending.length > 0 ? (
          <div className="mt-4 space-y-2 rounded-md bg-amber-100/60 border border-amber-200/50 p-3 shadow-inner">
            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-950/70 flex items-center justify-between">
              <span>Requests ({activity.pendingCount})</span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            </p>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-0.5">
              {activity.pending.map((member) => (
                <div
                  className="flex items-center justify-between gap-2 text-sm bg-white/70 p-1.5 rounded border border-amber-900/5"
                  key={member.userId}
                >
                  <span className="font-semibold text-xs truncate max-w-[120px]">{member.userName}</span>
                  <span className="flex gap-1">
                    <Button
                      onClick={() =>
                        run(() =>
                          accept({
                            activityId: activity._id,
                            userId: member.userId,
                          }),
                        )
                      }
                      size="sm"
                      className="h-7 px-2 text-[11px] bg-emerald-700 hover:bg-emerald-800 text-white"
                    >
                      Accept
                    </Button>
                    <Button
                      onClick={() =>
                        run(() =>
                          decline({
                            activityId: activity._id,
                            userId: member.userId,
                          }),
                        )
                      }
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px] border-amber-900/20 hover:bg-destructive/10 hover:text-destructive"
                    >
                      Decline
                    </Button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Host: waitlist */}
        {activity.isHost && activity.waitlist.length > 0 && (
          <div className="mt-3 rounded-md bg-blue-50/60 border border-blue-200/50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-blue-800/70 flex items-center gap-1.5 mb-1.5">
              <Clock className="h-3 w-3" />
              Waitlist ({activity.waitlistCount})
            </p>
            <div className="flex flex-wrap gap-1">
              {activity.waitlist.map((m) => (
                <span key={m.userId} className="text-[11px] font-semibold bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 border border-blue-200/50">
                  {m.userName}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bottom action row */}
        <div className="mt-auto pt-5 space-y-2">
          {/* Chat button for joined members & hosts */}
          {canChat && (
            <Button
              variant="outline"
              className="w-full border-amber-900/15 text-amber-900 hover:bg-amber-50 gap-2 text-xs font-semibold"
              onClick={() => onChat?.(activity)}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Open Huddle Chat
            </Button>
          )}
          {/* Share / Copy Link button */}
          <button
            onClick={copyLink}
            className={cn(
              "w-full flex items-center justify-center gap-1.5 rounded-md border py-1.5 text-[11px] font-semibold transition-all duration-200",
              copied
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-amber-900/10 bg-white/50 text-ink/50 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-900/20"
            )}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                Link Copied!
              </>
            ) : (
              <>
                <Share2 className="h-3 w-3" />
                Copy Link
              </>
            )}
          </button>

          {activity.isHost ? (
            <p className="text-xs font-semibold text-center text-ink/50 bg-[#e3d1be]/20 py-1.5 rounded border border-dashed border-amber-900/10">
              You are hosting this huddle
            </p>
          ) : activity.myStatus === "joined" ? (
            <Button
              className="w-full border-red-200 text-red-700 bg-red-50 hover:bg-red-100 hover:text-red-800"
              onClick={() => run(() => leave({ activityId: activity._id }))}
              variant="outline"
            >
              Leave Huddle
            </Button>
          ) : activity.myStatus === "pending" ? (
            <Button
              className="w-full"
              onClick={() => run(() => cancelRequest({ activityId: activity._id }))}
              variant="secondary"
            >
              Cancel Request
            </Button>
          ) : activity.myStatus === "waitlist" ? (
            <div className="space-y-1.5">
              <p className="text-xs text-center font-semibold text-blue-700 bg-blue-50 border border-blue-200/50 rounded py-1.5 flex items-center justify-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                You&apos;re on the waitlist
              </p>
              <Button
                className="w-full"
                onClick={() => run(() => cancelRequest({ activityId: activity._id }))}
                variant="secondary"
                size="sm"
              >
                Leave Waitlist
              </Button>
            </div>
          ) : (
            <Button
              className="w-full shadow-sm"
              disabled={!isSignedIn}
              onClick={() => run(() => requestToJoin({ activityId: activity._id }))}
            >
              {isFull ? "Join Waitlist" : "Request to Join"}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
