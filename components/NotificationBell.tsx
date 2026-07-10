"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Notification = {
  _id: Id<"notifications">;
  type: "accepted" | "declined" | "request";
  activityTitle: string;
  fromName: string;
  read: boolean;
  createdAt: number;
};

function timeAgo(ts: number) {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function notificationMessage(n: Notification) {
  switch (n.type) {
    case "accepted":
      return `${n.fromName} accepted you into "${n.activityTitle}"`;
    case "declined":
      return `${n.fromName} declined your request for "${n.activityTitle}"`;
    case "request":
      return `${n.fromName} wants to join "${n.activityTitle}"`;
  }
}

function notificationIcon(type: Notification["type"]) {
  switch (type) {
    case "accepted":
      return "✅";
    case "declined":
      return "❌";
    case "request":
      return "🙋";
  }
}

export function NotificationBell() {
  const notifications = useQuery(api.notifications.list) as Notification[] | undefined;
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef<number>(0);

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  // Show toast when new notifications arrive
  useEffect(() => {
    if (!notifications) return;
    const currentCount = notifications.filter((n) => !n.read).length;

    if (currentCount > prevCountRef.current && prevCountRef.current !== 0) {
      // A new unread notification appeared
      const newest = notifications.find((n) => !n.read);
      if (newest) {
        toast(notificationMessage(newest), {
          icon: notificationIcon(newest.type),
          duration: 4000,
        });
      }
    }
    prevCountRef.current = currentCount;
  }, [notifications]);

  // Close panel on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200",
          open
            ? "border-amber-900/30 bg-amber-100 shadow-sm"
            : "border-amber-900/15 bg-white/70 hover:bg-amber-50 hover:border-amber-900/25"
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell
          className={cn(
            "h-4 w-4 transition-all",
            unreadCount > 0 ? "text-amber-900 animate-[wiggle_0.5s_ease-in-out]" : "text-ink/60"
          )}
        />
        {/* Badge */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm"
            style={{ height: "18px", minWidth: "18px" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden rounded-xl border border-amber-900/15 bg-paper shadow-2xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-900/10 px-4 py-3">
            <h3 className="font-display text-sm font-bold text-amber-950">Notifications</h3>
            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-ink/60 hover:bg-amber-100 hover:text-amber-900 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-ink/40 hover:bg-amber-100 hover:text-ink/80 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto max-h-72">
            {!notifications || notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-ink/35">
                <Bell className="h-8 w-8 opacity-30" />
                <p className="text-xs font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => {
                    if (!n.read) markRead({ notificationId: n._id });
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-amber-50/60 border-b border-amber-900/5 last:border-b-0",
                    !n.read && "bg-amber-50/40"
                  )}
                >
                  {/* Icon */}
                  <span className="mt-0.5 text-base flex-shrink-0">{notificationIcon(n.type)}</span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs leading-relaxed", !n.read ? "font-semibold text-amber-950" : "text-ink/70")}>
                      {notificationMessage(n)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-ink/40">{timeAgo(n.createdAt)}</p>
                  </div>

                  {/* Unread dot */}
                  {!n.read && (
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-amber-500 flex-shrink-0 animate-pulse" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
