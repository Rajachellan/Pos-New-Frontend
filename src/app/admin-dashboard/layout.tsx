"use client"

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/app/context/AuthContext'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/user/login')
      } else if (!isAdmin()) {
        router.push('/user-dashboard')
      }
    }
  }, [user, loading, router, isAdmin])

  if (loading || !user || !isAdmin()) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Verifying Admin Authorization...
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50/70 font-sans antialiased text-slate-800">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}