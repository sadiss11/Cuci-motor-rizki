import type { Metadata, Viewport } from "next";
import { Oswald } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Cuci Motor Rizky — Kasir",
  description: "Aplikasi kasir, kas, laporan, dan loyalti pelanggan untuk CUCI MOTOR RIZKY.",
};

const display = Oswald({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-oswald" });

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#111111" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={display.variable}>
      <body className="min-h-dvh font-sans antialiased">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
