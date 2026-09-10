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
import { FaHistory, FaCodeBranch } from "react-icons/fa";
import { SiJirasoftware } from "react-icons/si";
import { IoIosLogOut } from "react-icons/io";
import { useRouter } from 'next/navigation';
import { MdTableRestaurant } from "react-icons/md";

function Sidebar() {
    const menuList = [
      {
        label: "Admin Overview",
        href: "/admin-dashboard",
        icon: RiDashboardLine,
      },
      {
        label: "Add Branch",
        href: "/admin-dashboard/add-branch",
        icon: FaCodeBranch,
      },
      {
        label: "Add Areas",
        href: "/admin-dashboard/add-areas",
        icon: PiMapPinSimpleAreaFill,
      },
      {
        label: "Add Tables",
        href: "/admin-dashboard/add-tables",
        icon: MdTableRestaurant,
      },
      {
        label: "Add Users",
        href: "/admin-dashboard/add-users",
        icon: RiUserLine,
      },
      {
        label: "POS Staff View",
        href: "/user-dashboard",
        icon: RiRestaurantLine,
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
            key={item.href}
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
        <button onClick={()=>logOut()} className='uppercase logoout-btn w-full'>logout <IoIosLogOut size={18}/> </button>
        </div>
    
        </aside>
    
    
    </>
  )
}

export default Sidebar