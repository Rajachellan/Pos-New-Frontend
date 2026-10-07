"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/app/context/AuthContext";
import SuperAdminSidebar from "./components/Sidebar";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isSuperAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/user/login");
      } else if (!isSuperAdmin()) {
        router.push("/admin-dashboard");
      }
    }
  }, [user, loading, router]);

  if (loading || !user || !isSuperAdmin()) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-500 text-sm gap-3">
        <div className="w-10 h-10 border-3 border-red-200 border-t-[#e02424] rounded-full animate-spin"></div>
        <p className="font-medium text-xs tracking-wider uppercase text-slate-400">
          Verifying Super Admin Authorization...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased">
      <SuperAdminSidebar />
      <main className="flex-1 overflow-y-auto min-h-screen bg-[#F8FAFC] p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
