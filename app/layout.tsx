import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "@/features/whiteboard/styles/styles.css";

export const metadata: Metadata = {
  title: "Whiteboard Notes",
  description: "Personal notes on an infinite whiteboard canvas",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="h-full w-full antialiased">
      <body className="h-full w-full overflow-hidden">{children}</body>
    </html>
  );
}
