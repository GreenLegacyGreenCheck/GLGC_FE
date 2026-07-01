import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/context/auth-context";
import { DiagnosisProvider } from "@/context/diagnosis-context";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import "./globals.css";

export const metadata: Metadata = {
  title: "GreenCheck",
  description: "고지서 기반 기후·에너지 자가진단 플랫폼",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GreenCheck",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1ba77d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">
        <main className="min-h-screen bg-[#c7d5c9] px-0 py-0 text-[#13261f] sm:flex sm:items-center sm:justify-center sm:px-6 sm:py-6">
          <div
            className="relative mx-auto min-h-screen w-full max-w-[430px] overflow-hidden bg-[#eef7f2] shadow-2xl shadow-emerald-950/25 sm:h-[920px] sm:min-h-0 sm:rounded-[44px] sm:ring-2 sm:ring-emerald-950/15"
            data-phone-frame
          >
            <AuthProvider>
              <DiagnosisProvider>{children}</DiagnosisProvider>
            </AuthProvider>
          </div>
        </main>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
