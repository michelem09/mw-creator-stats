import { useMemo } from "react";
import { SyncProvider } from "@mw/ui/SyncProvider";
import { AIProvider } from "@mw/ui/AIProvider";
import { SyncBanner } from "@mw/ui/SyncBanner";
import { NavProvider, type Nav } from "@mw/ui/nav";
import { directFetcher } from "./adapters/fetchDirect";

export function ExtProviders({ children }: { children: React.ReactNode }) {
  const nav = useMemo<Nav>(
    () => ({
      navigate: (p) => {
        window.location.hash = p;
      },
      resolveHref: (p) => `#${p}`,
    }),
    [],
  );
  return (
    <NavProvider value={nav}>
      <SyncProvider makeFetcher={directFetcher}>
        <AIProvider>
          <SyncBanner />
          {children}
        </AIProvider>
      </SyncProvider>
    </NavProvider>
  );
}
