"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange={false}
      >
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "hsl(var(--card))",
              color: "hsl(var(--card-foreground))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.75rem",
              fontSize: "0.875rem",
              fontFamily: "var(--font-sans)",
            },
            success: {
              iconTheme: { primary: "hsl(142 71% 45%)", secondary: "white" },
            },
            error: {
              iconTheme: { primary: "hsl(0 84% 60%)", secondary: "white" },
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
