"use client";
import { SyncProvider } from "@mw/ui/SyncProvider";
import { AIProvider } from "@mw/ui/AIProvider";
import { SyncBanner } from "@mw/ui/SyncBanner";
import { relayFetcher } from "@/lib/adapters/fetchRelay";

// Client wrapper: the transport factory (relayFetcher) is a function, so it must be
// supplied from a client component — it cannot be passed through the server layout.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SyncProvider makeFetcher={relayFetcher}>
      <AIProvider>
        <SyncBanner />
        {children}
      </AIProvider>
    </SyncProvider>
  );
}
