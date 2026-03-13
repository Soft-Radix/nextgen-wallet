import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppProviders from "./Providers";
import { Toaster } from "react-hot-toast";
import NotificationSetup from "@/components/NotificationSetup";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nextgen-wallet.vercel.app"),
  title: "Next Generation Pay",
  description: "Secure wallet transfers and real-time payment notifications.",
  applicationName: "Next Generation Pay",
  manifest: "/manifest.webmanifest",
  themeColor: "#0b6f4f",
  icons: {
    icon: "/icon",
    apple: "/apple-icon",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NextGen Pay",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${inter.className}`}>
        <Toaster position="top-center" />
        <AppProviders>
          <NotificationSetup />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
