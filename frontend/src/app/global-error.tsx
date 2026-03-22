"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center gap-6">
        <div>
          <p className="text-6xl font-bold text-red-500/20 font-mono">500</p>
          <h1 className="text-2xl font-bold mt-2">Something went wrong</h1>
          <p className="text-muted-foreground text-sm mt-2">
            An unexpected error occurred. Please try again.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/50 mt-1 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="px-6 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="px-6 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent"
          >
            Go home
          </Link>
        </div>
      </body>
    </html>
  );
}
