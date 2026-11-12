import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Cuci Motor Rizky — Kasir",
  description: "Aplikasi kasir, kas, laporan, dan loyalti pelanggan untuk CUCI MOTOR RIZKY.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#111111" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-dvh font-sans antialiased">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
