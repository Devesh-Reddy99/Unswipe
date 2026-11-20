import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unswipe: less scroll, more stroll",
  description:
    "A dating app for verified early-career graduates. Five thoughtful intros a day, 72 hours to plan a real date, and safety built in.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#221B33", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
