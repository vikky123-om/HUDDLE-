"use client";

import { SignedOut, SignInButton, useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useState } from "react";
import { Search, X, Plus, Sparkles, MessageCircle } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { ActivityCard, type Activity } from "@/components/ActivityCard";
import { CategoryPill } from "@/components/CategoryPill";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { NewHuddleForm } from "@/components/NewHuddleForm";
import { EditHuddleForm } from "@/components/EditHuddleForm";
import { HuddleChat } from "@/components/HuddleChat";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CATEGORIES, type Category } from "@/lib/categories";

export default function Page() {
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [chatActivity, setChatActivity] = useState<Activity | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "my-plans" | "open">("all");

  const { userId } = useAuth();
  const isSignedIn = !!userId;

  const activities = useQuery(
    api.activities.list,
    selectedCategory === "all" ? {} : { category: selectedCategory },
  ) as Activity[] | undefined;

  // Filter activities client-side based on search and tab selections
  const filteredActivities = activities?.filter((activity) => {
    // 1. Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = activity.title.toLowerCase().includes(q);
      const matchDesc = activity.description?.toLowerCase().includes(q);
      const matchHost = activity.hostName.toLowerCase().includes(q);
      const matchLoc = activity.location?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchHost && !matchLoc) {
        return false;
      }
    }

    // 2. Status tab match
    if (filterTab === "my-plans") {
      const isPart = activity.isHost || activity.myStatus === "joined" || activity.myStatus === "pending";
      if (!isPart) return false;
    } else if (filterTab === "open") {
      const spotsLeft = activity.spotsTotal - activity.joinedCount;
      if (spotsLeft <= 0) return false;
    }

    return true;
  });

  return (
    <main className="min-h-screen px-4 py-6 text-ink sm:px-6 lg:px-10">
      <section className="mx-auto max-w-7xl">
        <Header onCreate={() => setCreateOpen(true)} />

        <SignedOut>
          <div className="mt-6 rounded-lg border border-amber-900/20 bg-paper/85 p-5 shadow-card sm:flex sm:items-center sm:justify-between transition-all duration-300 hover:border-amber-900/35">
            <div>
              <h2 className="font-display text-xl font-bold flex items-center gap-1.5">
                <Sparkles className="h-5 w-5 text-primary" />
                Sign in to post or join huddles
              </h2>
              <p className="mt-1 text-sm text-ink/75">
                You can browse public details, but sending join requests and hosting require
                an account.
              </p>
            </div>
            <SignInButton mode="modal">
              <Button className="mt-4 sm:mt-0 font-semibold shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-transform">
                Sign in to HUDDLE
              </Button>
            </SignInButton>
          </div>
        </SignedOut>

        {/* Search & Advanced Filters */}
        <div className="mt-8 space-y-4 bg-paper/75 backdrop-blur-sm border border-amber-900/15 p-5 rounded-lg shadow-sm transition-all duration-300">
          <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-[1fr_260px_160px]">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
              <input
                type="text"
                placeholder="Search huddles by title, description, or host..."
                className="w-full rounded-md border border-amber-900/20 bg-white/80 py-2 pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-primary/50 text-ink placeholder-ink/40 transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-ink/40 hover:bg-amber-100 hover:text-ink/80 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Smart Filters (All, My Huddles, Open Spots) */}
            <div className="flex rounded-md border border-amber-900/20 bg-white/80 p-0.5 text-xs font-semibold shadow-sm">
              <button
                onClick={() => setFilterTab("all")}
                className={cn(
                  "flex-1 rounded-sm py-1.5 text-center transition-all",
                  filterTab === "all"
                    ? "bg-amber-950 text-amber-50 shadow-sm"
                    : "text-ink/75 hover:bg-amber-100/50"
                )}
              >
                All Plans
              </button>
              <button
                onClick={() => setFilterTab("my-plans")}
                className={cn(
                  "flex-1 rounded-sm py-1.5 text-center transition-all disabled:opacity-50",
                  filterTab === "my-plans"
                    ? "bg-amber-950 text-amber-50 shadow-sm"
                    : "text-ink/75 hover:bg-amber-100/50"
                )}
                disabled={!isSignedIn}
                title={!isSignedIn ? "Sign in to see your plans" : "Show huddles you are hosting or joined"}
              >
                My Plans
              </button>
              <button
                onClick={() => setFilterTab("open")}
                className={cn(
                  "flex-1 rounded-sm py-1.5 text-center transition-all",
                  filterTab === "open"
                    ? "bg-amber-950 text-amber-50 shadow-sm"
                    : "text-ink/75 hover:bg-amber-100/50"
                )}
              >
                Open Spots
              </button>
            </div>

            {/* Create new plan button inside filter bar (responsive shortcut) */}
            <Button
              onClick={() => {
                if (!isSignedIn) {
                  alert("Please sign in to post a huddle!");
                  return;
                }
                setCreateOpen(true);
              }}
              className="w-full bg-[#8f5b2f] hover:bg-[#784d28] text-white flex items-center justify-center gap-1.5 shadow-sm font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Pin Plan
            </Button>
          </div>

          {/* Categories select row */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-amber-900/10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink/50 mr-1">Categories:</span>
            <button
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                selectedCategory === "all"
                  ? "border-amber-950 bg-amber-950 text-amber-50 shadow-sm"
                  : "border-amber-900/15 bg-white/60 text-ink/80 hover:bg-white/90 hover:scale-105 active:scale-95"
              }`}
              onClick={() => setSelectedCategory("all")}
              type="button"
            >
              All Categories
            </button>
            {CATEGORIES.map((category) => (
              <CategoryPill
                active={selectedCategory === category}
                category={category}
                key={category}
                onClick={() => setSelectedCategory(category)}
              />
            ))}
          </div>
        </div>

        {/* Board Display */}
        <section className="cork-board mt-6 min-h-[30rem] rounded-lg border-[10px] border-[#8f5b2f] p-5 shadow-2xl sm:p-8 relative overflow-hidden">
          {/* Subtle wood shadow layer for realism */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_4px_12px_rgba(0,0,0,0.35)] rounded-sm" />

          {activities === undefined ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  className="h-80 animate-pulse rounded-md bg-paper/60 border border-amber-900/10"
                  key={index}
                />
              ))}
            </div>
          ) : filteredActivities === undefined || filteredActivities.length === 0 ? (
            <EmptyState
              isFiltered={selectedCategory !== "all" || searchQuery.trim() !== "" || filterTab !== "all"}
              onReset={() => {
                setSelectedCategory("all");
                setSearchQuery("");
                setFilterTab("all");
              }}
              onCreateHuddle={() => {
                if (!isSignedIn) {
                  alert("Please sign in to post a huddle!");
                  return;
                }
                setCreateOpen(true);
              }}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 relative z-1">
              {filteredActivities.map((activity) => (
                <ActivityCard
                  activity={activity}
                  isSignedIn={Boolean(isSignedIn)}
                  key={activity._id}
                  onEdit={setEditActivity}
                  onChat={setChatActivity}
                />
              ))}
            </div>
          )}
        </section>
      </section>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-paper border border-amber-900/20 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold text-amber-950">Post a new huddle</DialogTitle>
          </DialogHeader>
          <NewHuddleForm onCreated={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editActivity} onOpenChange={(open) => { if (!open) setEditActivity(null); }}>
        <DialogContent className="bg-paper border border-amber-900/20 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold text-amber-950">Edit Huddle</DialogTitle>
          </DialogHeader>
          {editActivity && (
            <EditHuddleForm
              activity={editActivity}
              onSaved={() => setEditActivity(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={!!chatActivity} onOpenChange={(open) => { if (!open) setChatActivity(null); }}>
        <DialogContent className="bg-paper border border-amber-900/20 max-w-md h-[600px] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-amber-900/10 flex-shrink-0">
            <DialogTitle className="font-display text-xl font-bold text-amber-950 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              {chatActivity?.title}
            </DialogTitle>
            <p className="text-xs text-ink/50 font-medium">Huddle Chat · members only</p>
          </DialogHeader>
          {chatActivity && (
            <HuddleChat
              activityId={chatActivity._id}
              currentUserId={userId ?? undefined}
            />
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
