import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "./ConvexClientProvider";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Huddle",
  description: "Find and host small local plans with real-time updates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!clerkPublishableKey) {
    return (
      <html lang="en">
        <body>
          <div className="min-h-screen bg-[#f7ead3] p-6 text-ink">
            <div className="mx-auto max-w-xl rounded-lg border border-amber-900/20 bg-paper p-5 shadow-card">
              <h1 className="font-display text-2xl font-semibold">
                Clerk is not configured yet
              </h1>
              <p className="mt-2 text-sm text-ink/70">
                Add <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
                <code>CLERK_SECRET_KEY</code> to your environment to run Huddle.
              </p>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <html lang="en">
        <body>
          <ConvexClientProvider>{children}</ConvexClientProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#fdfaf2",
                border: "1px solid rgba(143,91,47,0.15)",
                color: "#3d2010",
                fontFamily: "inherit",
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
