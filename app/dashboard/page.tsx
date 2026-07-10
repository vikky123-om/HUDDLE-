"use client";

import { useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BarChart3,
  Users,
  Star,
  Clock,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { catInfo } from "@/lib/categories";

/* ─── category bar colors ─── */
const CATEGORY_COLORS: Record<string, string> = {
  food: "#e11d48",     // rose-600
  outdoors: "#059669", // emerald-600
  games: "#0284c7",    // sky-600
  study: "#7c3aed",    // violet-600
  arts: "#d97706",     // amber-600
  other: "#78716c",    // stone-500
};

/* ─── helpers ─── */
function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ─── custom tooltip for recharts ─── */
function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { category: string; count: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const info = catInfo(d.category);
  return (
    <div className="rounded-xl border border-amber-900/15 bg-paper px-4 py-3 shadow-card">
      <p className="font-display text-sm font-semibold text-ink">{info.label}</p>
      <p className="text-xs text-amber-800/70">
        {d.count} huddle{d.count !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

/* ─── stat card ─── */
function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent: string;
  delay: number;
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-amber-900/10 bg-paper p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* gradient accent strip */}
      <div
        className="absolute inset-x-0 top-0 h-1 opacity-80"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-800/60">
            {label}
          </p>
          <p className="font-display text-3xl font-bold text-ink">{value}</p>
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: `${accent}18` }}
        >
          <Icon className="h-5 w-5" style={{ color: accent }} />
        </div>
      </div>
    </div>
  );
}

/* ─── page ─── */
export default function DashboardPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const personalStats = useQuery(
    api.analytics.stats,
    isSignedIn ? {} : "skip",
  );
  const globalStats = useQuery(api.analytics.globalStats);

  /* loading skeleton */
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-900/20 border-t-amber-800" />
      </div>
    );
  }

  /* not signed in */
  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper px-4 text-center">
        <BarChart3 className="h-16 w-16 text-amber-800/30" />
        <h1 className="font-display text-2xl font-bold text-ink">
          Sign in to view your dashboard
        </h1>
        <p className="max-w-md text-sm text-amber-800/70">
          Track your hosting stats, join history, and community analytics all in
          one place.
        </p>
        <SignInButton mode="modal">
          <Button>Sign In</Button>
        </SignInButton>
        <Link
          href="/"
          className="mt-2 text-xs text-amber-800/50 underline-offset-2 hover:underline"
        >
          ← Back to Huddle
        </Link>
      </div>
    );
  }

  const isLoadingStats = personalStats === undefined || globalStats === undefined;

  return (
    <main className="min-h-screen bg-paper">
      {/* header bar */}
      <div className="border-b border-amber-900/10 bg-paper/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-amber-800/70 transition-colors hover:text-amber-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Huddle
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-amber-800" />
            <h1 className="font-display text-lg font-bold text-ink">
              Dashboard
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        {isLoadingStats ? (
          /* skeleton grid */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[108px] animate-pulse rounded-2xl border border-amber-900/10 bg-amber-50/50"
              />
            ))}
          </div>
        ) : (
          <>
            {/* ── personal stats ── */}
            <section>
              <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-amber-800/50">
                Your Stats
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  icon={Star}
                  label="Hosted"
                  value={personalStats?.totalHuddlesHosted ?? 0}
                  accent="#a64d2d"
                  delay={0}
                />
                <StatCard
                  icon={Users}
                  label="Joined"
                  value={personalStats?.totalHuddlesJoined ?? 0}
                  accent="#059669"
                  delay={80}
                />
                <StatCard
                  icon={Clock}
                  label="Pending Requests"
                  value={personalStats?.totalPending ?? 0}
                  accent="#d97706"
                  delay={160}
                />
                <StatCard
                  icon={TrendingUp}
                  label="Accept Rate"
                  value={`${personalStats?.acceptRate ?? 100}%`}
                  accent="#7c3aed"
                  delay={240}
                />
              </div>
            </section>

            {/* ── community overview ── */}
            <section>
              <h2 className="mb-1 font-display text-sm font-semibold uppercase tracking-wider text-amber-800/50">
                Community Overview
              </h2>
              <p className="mb-4 text-xs text-amber-800/40">
                {globalStats?.totalHuddles ?? 0} huddles ·{" "}
                {globalStats?.totalMembers ?? 0} members
              </p>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                {/* bar chart */}
                <div className="rounded-2xl border border-amber-900/10 bg-paper p-5 shadow-card lg:col-span-3">
                  <h3 className="mb-4 font-display text-sm font-semibold text-ink">
                    Category Breakdown
                  </h3>
                  {globalStats?.categoryCounts &&
                  globalStats.categoryCounts.some((c) => c.count > 0) ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        data={globalStats.categoryCounts}
                        margin={{ top: 4, right: 8, bottom: 4, left: -16 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(120,80,40,0.08)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="category"
                          tick={{ fontSize: 11, fill: "#92400e" }}
                          tickFormatter={(v: string) =>
                            catInfo(v).label
                          }
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#92400eaa" }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          content={<ChartTooltip />}
                          cursor={{ fill: "rgba(120,80,40,0.04)" }}
                        />
                        <Bar
                          dataKey="count"
                          radius={[8, 8, 0, 0]}
                          maxBarSize={48}
                        >
                          {globalStats.categoryCounts.map((entry) => (
                            <Cell
                              key={entry.category}
                              fill={
                                CATEGORY_COLORS[entry.category] ?? "#78716c"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[260px] items-center justify-center text-sm text-amber-800/40">
                      No huddles yet — be the first!
                    </div>
                  )}
                </div>

                {/* recent activity feed */}
                <div className="rounded-2xl border border-amber-900/10 bg-paper p-5 shadow-card lg:col-span-2">
                  <h3 className="mb-4 font-display text-sm font-semibold text-ink">
                    Recent Activity
                  </h3>
                  {globalStats?.recentActivity &&
                  globalStats.recentActivity.length > 0 ? (
                    <ul className="space-y-3">
                      {globalStats.recentActivity.map((item, i) => {
                        const info = catInfo(item.category);
                        return (
                          <li
                            key={i}
                            className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-amber-50/60"
                          >
                            {/* category dot */}
                            <span
                              className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full"
                              style={{
                                backgroundColor:
                                  CATEGORY_COLORS[item.category] ?? "#78716c",
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-ink">
                                {item.title}
                              </p>
                              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${info.bg} ${info.text}`}
                                >
                                  {info.label}
                                </span>
                                <span className="text-[11px] text-amber-800/50">
                                  by {item.hostName}
                                </span>
                                <span className="text-[11px] text-amber-800/40">
                                  {timeAgo(item.createdAt)}
                                </span>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="flex h-48 items-center justify-center text-sm text-amber-800/40">
                      No recent activity
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
