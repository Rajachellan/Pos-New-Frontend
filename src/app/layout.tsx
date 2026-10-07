import type { Metadata } from "next";
import { Merriweather } from "next/font/google";
import "./globals.css";

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "HotelPro - All-in-One Hotel Management System",
  description: "Manage rooms, reservations, billing, staff, and guest experiences from a single powerful platform built for modern hotels, resorts and restaurant chains.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

import { AuthProvider } from "@/src/app/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={merriweather.className}>
      <body className="antialiased font-serif">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
