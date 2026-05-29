import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Okane - Pencatatan Keuangan",
  description: "Aplikasi pencatatan keuangan pribadi. Catat pemasukan, pengeluaran, dan pantau kondisi keuanganmu.",
  keywords: "keuangan, pencatatan, pemasukan, pengeluaran, okane, finance tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
