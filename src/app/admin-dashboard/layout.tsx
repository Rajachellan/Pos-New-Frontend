"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/app/context/AuthContext'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, isAdmin, isManager } = useAuth()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/user/login')
      } else if (!isAdmin() && !isManager()) {
        router.push('/user-dashboard')
      }
    }
  }, [user, loading, router, isAdmin, isManager])

  if (loading || !user || (!isAdmin() && !isManager())) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Verifying Authorization...
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50/70 font-sans antialiased text-slate-800 relative">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex flex-1 flex-col min-w-0 overflow-x-hidden">
        <Navbar onToggleMobileMenu={() => setMobileOpen(!mobileOpen)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

