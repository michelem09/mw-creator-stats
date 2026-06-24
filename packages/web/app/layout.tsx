import type { Metadata } from "next";
import "./globals.css";
import { SyncProvider } from "@mw/ui/SyncProvider";
import { SyncBanner } from "@mw/ui/SyncBanner";
import { AIProvider } from "@mw/ui/AIProvider";

export const metadata: Metadata = {
  title: "MakerWorld Creator Stats",
  description: "Interactive dashboard for your MakerWorld Creator Center stats.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-ink">
        <SyncProvider>
          <AIProvider>
            <SyncBanner />
            {children}
          </AIProvider>
        </SyncProvider>
      </body>
    </html>
  );
}
