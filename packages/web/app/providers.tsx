"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { SyncProvider } from "@mw/ui/SyncProvider";
import { AIProvider } from "@mw/ui/AIProvider";
import { SyncBanner } from "@mw/ui/SyncBanner";
import { NavProvider, type Nav } from "@mw/ui/nav";
import { relayFetcher } from "@/lib/adapters/fetchRelay";

// Client wrapper: the transport factory (relayFetcher) and the Next router are
// functions, so they must be wired from a client component.
export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const nav = useMemo<Nav>(
    () => ({ navigate: (p) => router.push(p), resolveHref: (p) => p }),
    [router],
  );
  return (
    <NavProvider value={nav}>
      <SyncProvider makeFetcher={relayFetcher}>
        <AIProvider>
          <SyncBanner />
          {children}
        </AIProvider>
      </SyncProvider>
    </NavProvider>
  );
}
