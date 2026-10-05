"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/app/context/AuthContext";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isTVMode =
    pathname === "/user-dashboard/kitchen/tv" ||
    pathname === "/user-dashboard/kitchen/customer-tv" ||
    pathname?.endsWith("/tv") ||
    pathname?.endsWith("/customer-tv");

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/user/login");
      }
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Checking Authentication...
        </p>
      </div>
    );
  }

  if (isTVMode) {
    return (
      <main className="w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 antialiased select-none">
        {children}
      </main>
    );
  }

  return (
    <section className="flex min-h-screen">
      <Sidebar />
      <div className="w-full h-full">
        <Navbar />
        <div>{children}</div>
      </div>
    </section>
  );
}
