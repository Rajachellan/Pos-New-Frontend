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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Verifying Super Admin Authorization...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      <SuperAdminSidebar />
      <main className="flex-1 overflow-y-auto min-h-screen bg-slate-950 p-8">
        {children}
      </main>
    </div>
  );
}
