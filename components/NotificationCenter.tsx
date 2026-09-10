"use client";

import { useQuery } from "convex/react";
import { Bell, CheckCircle, XCircle, MessageSquareText } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";

export function NotificationCenter() {
  const notifications = useQuery(api.notifications.getNotifications) || [];
  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const getIcon = (type: string) => {
    switch (type) {
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "declined":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "request":
        return <MessageSquareText className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationText = (notif: any) => {
    switch (notif.type) {
      case "accepted":
        return `You were accepted to join "${notif.activityTitle}"!`;
      case "declined":
        return `Your request for "${notif.activityTitle}" was declined`;
      case "request":
        return `${notif.fromName} requested to join "${notif.activityTitle}"`;
      default:
        return "New notification";
    }
  };

  if (!notifications || notifications.length === 0) {
    return (
      <div className="text-center py-8 text-ink/50">
        <Bell className="h-8 w-8 mx-auto opacity-30 mb-2" />
        <p className="text-sm">No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {notifications.map((notif) => (
        <div
          key={notif._id}
          className={`p-3 rounded-lg border ${
            notif.read
              ? "bg-white/50 border-amber-900/10"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {getIcon(notif.type)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-950">
                {getNotificationText(notif)}
              </p>
              <p className="text-xs text-ink/50 mt-1">
                {new Date(notif.createdAt).toLocaleDateString()}
              </p>
            </div>
            {!notif.read && (
              <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
