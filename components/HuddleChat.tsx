"use client";

import { useMutation, useQuery } from "convex/react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type HuddleChatProps = {
  activityId: Id<"activities">;
  currentUserId?: string;
};

function timeLabel(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function HuddleChat({ activityId, currentUserId }: HuddleChatProps) {
  const messages = useQuery(api.messages.list, { activityId }) ?? [];
  const send = useMutation(api.messages.send);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await send({ activityId, text: trimmed });
      setText("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-ink/40">
            <MessageCircle className="h-10 w-10 opacity-20" />
            <p className="text-sm font-medium">No messages yet — say hi!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.userId === currentUserId;
            const prevMsg = messages[i - 1];
            const showName = !prevMsg || prevMsg.userId !== msg.userId;
            const initials = msg.userName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() || "?";

            return (
              <div
                key={msg._id}
                className={cn("flex items-end gap-2", isMe ? "flex-row-reverse" : "flex-row")}
              >
                {/* Avatar */}
                {!isMe && (
                  <div className={cn(
                    "flex-shrink-0 flex items-center justify-center rounded-full text-[10px] font-bold text-amber-50 bg-amber-800/85 shadow-sm",
                    showName ? "opacity-100" : "opacity-0"
                  )}
                  style={{ width: 28, height: 28 }}
                  title={msg.userName}
                  >
                    {initials}
                  </div>
                )}

                <div className={cn("max-w-[72%] space-y-0.5", isMe ? "items-end" : "items-start", "flex flex-col")}>
                  {showName && !isMe && (
                    <span className="text-[10px] font-bold text-ink/50 ml-1">{msg.userName}</span>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                      isMe
                        ? "bg-amber-900 text-amber-50 rounded-br-sm"
                        : "bg-white border border-amber-900/10 text-ink rounded-bl-sm"
                    )}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-ink/30 mx-1">{timeLabel(msg.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-amber-900/10 p-3 bg-amber-50/30">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            id="huddle-chat-input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            placeholder="Say something…"
            className="flex-1 rounded-full border border-amber-900/15 bg-white/90 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 placeholder-ink/35 transition-all shadow-sm"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="flex items-center justify-center rounded-full bg-amber-900 text-amber-50 hover:bg-amber-800 disabled:opacity-40 transition-all shadow-sm active:scale-95"
            style={{ width: 36, height: 36 }}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
        <p className="mt-1 text-center text-[10px] text-ink/30">
          Only accepted members can chat
        </p>
      </div>
    </div>
  );
}
