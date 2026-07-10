"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Plus, BarChart3 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";

type HeaderProps = {
  onCreate: () => void;
};

export function Header({ onCreate }: HeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-950/65">
          pin a plan, find your people
        </p>
        <h1 className="mt-1 font-display text-5xl font-black text-ink sm:text-6xl">
          Huddle
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <SignedOut>
          <SignInButton mode="modal">
            <Button>Sign in</Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <Link
            href="/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-900/15 bg-white/70 hover:bg-amber-50 hover:border-amber-900/25 transition-all duration-200"
            title="Dashboard"
          >
            <BarChart3 className="h-4 w-4 text-ink/60" />
          </Link>
          <NotificationBell />
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4" />
            New huddle
          </Button>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
}
