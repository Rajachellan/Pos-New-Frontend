
"use client"

import React from 'react'
import Link from 'next/link';
import { RiDashboardLine } from "react-icons/ri";
import {
  RiRestaurantLine,
  RiTableLine,
  RiFileList3Line,
  RiUserLine,
  RiSettings3Line,
  RiLogoutBoxLine,
} from "react-icons/ri";
import { MdMeetingRoom,MdOutlineBorderColor  } from "react-icons/md";
import { PiMapPinSimpleAreaFill } from "react-icons/pi";
import { FaHistory } from "react-icons/fa";
import { SiJirasoftware } from "react-icons/si";
import { IoIosLogOut } from "react-icons/io";
import {useRouter} from 'next/navigation'

function Sidebar() {

  const menuList=[
    {
    label: "Dashboard",
    href: "/user-dashboard",
    icon: RiDashboardLine,
  },
  // {
  //   label: "Tables",
  //   href: "/user-dashboard/tables",
  //   icon: RiTableLine,
  // },
  {
    label: "Areas-Tables",
    href: "/user-dashboard/tables",
    icon: PiMapPinSimpleAreaFill,
  },
  {
    label: "Rooms",
    href: "/user-dashboard/settings",
    icon: MdMeetingRoom,
  },
 
  {
    label: "KDS (Kitchen)",
    href: "/user-dashboard/kitchen",
    icon: RiRestaurantLine,
  },
   {
    label: "Current Orders",
    href: "/user-dashboard/profile",
    icon: MdOutlineBorderColor ,
  },
  {
    label: "Order History",
    href: "/user-dashboard/order-history",
    icon: FaHistory ,
  },
  {
    label: "Profile",
    href: "/user-dashboard/profile",
    icon: RiUserLine,
  },

  ]

  const router=useRouter()
  
      function logOut(){
        localStorage.removeItem("Token")
        router.push('/user/login')
      }

  return (
    <>
    
    <aside className='h-screen sticky left-0 top-0 flex flex-col gap-5 bg-black w-65 p-5 justify-between'>

    <div className='flex flex-col gap-6'>
    <div className='flex items-center gap-3'>
    <span className='bg-[#e02424] flex items-center justify-center h-9  w-9 rounded-2xl'>
    <SiJirasoftware className='text-white' size={22}/>
    </span>
    <h2 className='font-bold text-[18px] text-[#e02424] text-[18px]' style={{letterSpacing:"1px",margin:"auto 0px"}}>POS  SOFTWARE</h2>
    </div>

    <div style={{borderBottom:"1px solid gray"}}></div>

    <nav className="flex flex-col gap-2">
  {menuList.map((item) => {
    const Icon = item.icon;

    return (
      <Link
        key={item.label}
        href={item.href}
        className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-300 transition hover:bg-[#e02424] hover:text-white"
      >
        <Icon size={20} />
        <span className='text-[16px]'>{item.label}</span>
      </Link>
    );
  })}
    </nav>
    </div>

    <div>
    <button onClick={()=>logOut()} className='uppercase logoout-btn'>logout <IoIosLogOut size={18}/> </button>
    </div>

    </aside>
    
    </>
  )
}

export default Sidebar