import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GreenCheck",
  description: "고지서 기반 기후·에너지 자가진단 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
