import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SatriaCanvas",
  description: "Game Lobby Card Generator — Free Fire & Mobile Legends",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
