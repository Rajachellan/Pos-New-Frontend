import React from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'

function layout({
  children,
}: {
  children: React.ReactNode
}) {
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

export default layout