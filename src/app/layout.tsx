
import type { Metadata, Viewport } from "next";

import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";

import "./globals.css";

import BeyondTheScreen from "./components/BeyondTheScreen/BeyondTheScreen";
import SiteHeader from "./components/SiteHeader";
import SiteEffects from "./components/SiteEffects";

export const metadata: Metadata = {
  title: "IEI × ISTE NITTE | Engineering the Future",
  description: "The official digital platform of IEI × ISTE NITTE.",
};

export const viewport: Viewport = {
  themeColor: "#0a0b0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <BeyondTheScreen />
        <SiteHeader />
        <SiteEffects />
        <div className="grain" aria-hidden="true" />
        <main className="site-content">{children}</main>
      </body>
    </html>
  );
}
