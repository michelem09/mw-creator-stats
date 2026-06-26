import type { Metadata } from "next";
// Self-hosted fonts (bundled, no remote Google Fonts fetch).
import "@fontsource/archivo/400.css";
import "@fontsource/archivo/600.css";
import "@fontsource/archivo/800.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/600.css";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "MakerWorld Creator Stats",
  description: "Interactive dashboard for your MakerWorld Creator Center stats.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
