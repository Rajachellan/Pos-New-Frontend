import Link from 'next/link'
import React from 'react'



function Navbar() {
  return (
    <>
    
    
    <section>
    <div className="max-w-7xl mx-auto px-5 flex items-center justify-between py-5">

    <div>
    <h1 style={{margin:"auto 0px"}} className='uppercase text-2xl font-bold'>Hotel Management System</h1>
    </div>

    <ul className='flex items-center gap-4'>
    <li style={{margin:"auto 0px",letterSpacing:"1px"}}>Home</li>
    <li style={{margin:"auto 0px",letterSpacing:"1px"}}>Branches</li>
    <li style={{margin:"auto 0px",letterSpacing:"1px"}}>Help</li>
    <li style={{margin:"auto 0px",letterSpacing:"1px"}}>Support</li>
    </ul>


    <div>
    <Link href={'/user/login'} className='admin-login uppercase'>Admin Port</Link>
    </div>

    </div>
    </section>
    
    
    </>
  )
}

export default Navbar