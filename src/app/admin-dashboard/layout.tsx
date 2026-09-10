import React from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'

function layout({
    children,
  }: {
    children: React.ReactNode;
  }) {
  return (
    <>
    
    <section className='flex min-h-screen'>
    
    <Sidebar/>

    <div className='w-full h-full'>
    <Navbar/>
    <div>
    {children}
    </div>
    </div>

    </section>
    
    </>
  )
}

export default layout