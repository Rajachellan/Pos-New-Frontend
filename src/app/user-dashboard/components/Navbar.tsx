"use client"

import React, { useEffect, useState } from 'react'
import { FaMapLocationDot } from "react-icons/fa6";
import api from '../../services/api';
import { AxiosError } from 'axios';
import { FaCodeBranch } from "react-icons/fa";
import {FiMapPin,FiChevronDown,
  FiLogOut,
  FiUser, } from "react-icons/fi";


function Navbar() {
  interface branchDatas {
  _id: string,
  branchName: string,
  branchCode: string,
  address: string,
  }

  interface userDatasArray {
  _id: string,
  name: string,
  email: string,
  role: string,
  branch: string,
  }

  const [branchDatas,setBranchDatas]=useState<branchDatas[]>()
  const [userDatas,setUserDatas]=useState<userDatasArray>()

  async function getDatas() {
    try{
      const res=await api.get('/get/branch/role')
      setBranchDatas(res.data.data)
    }
    catch(err){
       const error = err as AxiosError<{ message?: string }>;
       alert(error.response?.data?.message ||
        error.message ||"Login failed. Please try again.")
    }
  }

   async function getUsers() {
    try{
      const res=await api.get('/user/get')
      setUserDatas(res.data.data)
    }
    catch(err){
       const error = err as AxiosError<{ message?: string }>;
       alert(error.response?.data?.message ||
        error.message ||"Login failed. Please try again.")
    }
  }

  const [branchOpen, setBranchOpen] = useState(false);

  const [userOpen, setUserOpen] = useState(false);

  useEffect(()=>{
    getDatas(),getUsers()
  },[])

  return (
    <>
    
    <section className="flex w-full items-center justify-between border-b border-red-100 bg-white px-5 py-4 shadow-sm lg:px-8">
  
  <div>
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
      Workspace
    </p>

    <h2 className="mt-1 font-playfair text-xl font-bold text-[#9b1c1c]">
      Dashboard Overview
    </h2>
  </div>



    <div className='flex items-center gap-5'>
     <div className="">
<div className="relative">
  <button
    type="button"
    onClick={() => setBranchOpen((open) => !open)}
    aria-expanded={branchOpen}
    className="flex items-center gap-3 rounded-xl border border-red-100 bg-[#fdf2f2] px-4 py-2.5 transition hover:border-red-300"
  >
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#9b1c1c] text-white">
      <FaCodeBranch size={18} />
    </div>

    <div className="text-left">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
        Active Branch
      </p>

      <p className="max-w-[150px] truncate text-sm font-bold text-[#e02424]">
        {branchDatas?.[0]?.branchName ?? "Loading..."}
      </p>
    </div>

    <FiChevronDown
      size={18}
      className={`text-[#9b1c1c] transition-transform ${
        branchOpen ? "rotate-180" : ""
      }`}
    />
  </button>

  {branchOpen && (
    <div className="absolute -right-10 top-full z-50 mt-2 w-72 rounded-xl border border-red-100 bg-white p-4 shadow-xl">
      {branchDatas?.map((branch) => (
        <div key={branch._id} className="space-y-3">
          
          <div className='flex items-center justify-between'>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Branch Name
            </p>
            <p className="text-sm font-bold text-[#e02424]">
              {branch.branchName}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Branch Code
            </p>
            <p className="text-sm font-semibold text-[#e02424]">
              {branch.branchCode}
            </p>
          </div>
          </div>

          <div className="flex items-start gap-2 border-t border-red-100 pt-3">
            <FiMapPin className="mt-1 shrink-0 text-[#e02424]" size={16} />

            <p className="break-words text-xs leading-5 text-gray-600">
              {branch.address}
            </p>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
  </div>

  <div className="relative">
  <button
    type="button"
    onClick={() => setUserOpen((open) => !open)}
    aria-expanded={userOpen}
    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 transition hover:border-red-200 hover:bg-red-50"
  >
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#9b1c1c] text-sm font-bold text-white">
      {userDatas?.name?.charAt(0).toUpperCase() || <FiUser />}
    </div>

    <div className="hidden text-left sm:block">
      <p className="max-w-[130px] truncate text-sm font-bold text-gray-800">
        {userDatas?.name || "Loading..."}
      </p>

      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#e02424]">
        {userDatas?.role || "User"}
      </p>
    </div>

    <FiChevronDown
      size={17}
      className={`text-gray-500 transition-transform ${
        userOpen ? "rotate-180" : ""
      }`}
    />
  </button>

  {userOpen && (
    <div className="absolute right-0 top-full z-50 mt-2 w- tu rounded-xl border border-red-100 bg-white p-4 shadow-xl">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-lg font-bold text-[#9b1c1c]">
          {userDatas?.name?.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-gray-900">
            {userDatas?.name}
          </p>

          <p className="max-w-[190px] truncate text-xs text-gray-500">
            {userDatas?.email}
          </p>
        </div>
      </div>

     

    
    </div>
  )}
   </div>
  </div>
 


    </section>
    
    </>
  )
}

export default Navbar