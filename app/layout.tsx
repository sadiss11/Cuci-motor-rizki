import type { Metadata, Viewport } from "next";
import { Oswald, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Cuci Motor Rizky — Kasir",
  description: "Aplikasi kasir, kas, laporan, dan loyalti pelanggan untuk CUCI MOTOR RIZKY.",
};

const display = Oswald({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-oswald" });
const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#d0021b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-dvh font-sans antialiased">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
