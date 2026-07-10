"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useMemo, type ReactNode } from "react";

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const convex = useMemo(
    () => (convexUrl ? new ConvexReactClient(convexUrl) : null),
    [convexUrl],
  );

  if (!convex) {
    return (
      <div className="min-h-screen bg-[#f7ead3] p-6 text-ink">
        <div className="mx-auto max-w-xl rounded-lg border border-amber-900/20 bg-paper p-5 shadow-card">
          <h1 className="font-display text-2xl font-semibold">
            Convex is not configured yet
          </h1>
          <p className="mt-2 text-sm text-ink/70">
            Add <code>NEXT_PUBLIC_CONVEX_URL</code> to your environment after
            running <code>npx convex dev</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
