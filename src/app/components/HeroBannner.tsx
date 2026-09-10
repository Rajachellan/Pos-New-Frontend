import React from 'react'
import heroImg from '../../../public/images/heroBanner.png'
import {
  FiShield,
  FiClock,
} from "react-icons/fi";

import {
  MdApartment,MdPeople
} from "react-icons/md";


const features = [
  {
    icon: <FiShield/>,
    title: "Secure Access",
    description: "Your data, always protected",
  },
  {
    icon: <MdApartment/>,
    title: "Multiple Branches",
    description: "Manage all locations",
  },
  {
    icon: <FiClock/>,
    title: "24/7 Operations",
    description: "Always on, always ready",
  },
  {
    description: "Colloborative Team Work",
    title: "Team Management",
    icon: <MdPeople/>,
  },
];

function HeroBannner() {

  return (
    <>
    
    <section>
    <div className="max-w-7xl mx-auto px-5 flex items-center grid-cols-1 lg:grid-cols-2 gap-5 py-20 lg:py-10">
    
     <div className='flex flex-col gap-5 justify-center'>
    <div className="status-badge uppercase">
    <span className="status-dot" />
    Smart hotel operations
   </div>
    <h1 className='lg:text-5xl text-3xl font-bold  leading-tight' style={{letterSpacing:"1px"}}>Run Every Stay. <br /> <span className='text-[#e02424]' style={{fontStyle:"italic"}}>From One Power <br /> Full Platform</span> </h1>
    <p className='text-gray-700 text-[16px]w-full lg:w-[600px]' style={{letterSpacing:"1px"}}>Simplify hotel operations, manage multiple branches, and deliver exceptional guest experiences with one intelligent management system built for modern hospitality businesses.</p>

    <div className="hero-features grid grid-cols-1 lg:grid-cols-2 gap-5">
  {features.map((feature) => (
    <div className="feature-card" key={feature.title}>
      <div className="feature-icon">{feature.icon}</div>

      <div>
        <h3>{feature.title}</h3>
        <p>{feature.description}</p>
      </div>
    </div>
  ))}
</div>

    </div>

    </div>
    </section>
    
    
    </>
  )
}

export default HeroBannner