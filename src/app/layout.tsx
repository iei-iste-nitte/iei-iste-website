
import type { Metadata } from "next";
import "./globals.css";
import BeyondTheScreen from "./components/BeyondTheScreen/BeyondTheScreen";

export const metadata: Metadata = {
  title: "IEI × ISTE NITTE | Engineering the Future",
  description:
    "The official digital platform of IEI × ISTE NITTE.",
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
        <div className="site-content">
          {children}
        </div>
      </body>
    </html>
  );
}


