"use client"

import React, { useEffect, useState } from 'react'

import api from '../services/api';

import { AxiosError } from 'axios';
import Link from 'next/link';

function ChooseBranch() {

 interface BranchCreator {
  _id: string;
  name: string;
  email: string;
    }

   interface branchDatas {
  _id: string,
  branchName: string,
  branchCode: string,
  address: string,
  createdBy: BranchCreator,
  isActive:boolean
  }
  const [branchData,setBranchData]=useState <branchDatas[]> ([])

  async function getBranches() {
    try{
        const res=await api.get('/get/branch')
        setBranchData(res.data.data)
    }
    catch(err){
         const error = err as AxiosError<{ message?: string }>;
        alert(error.response?.data?.message ||
            error.message ||"Login failed. Please try again."
                      )
    }
  }

  useEffect(()=>{
    getBranches()
  },[])
  return (
    <>
    
    <section className='py-10 lg:py-20'>
    <div className="max-w-7xl mx-auto px-5 flex flex-col gap-6">

    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"5px"}}>
    <div className="status-badge uppercase mx-auto">
    <span className="status-dot" />
    Choose Your Branch
    </div>
    </div>

    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
  {branchData?.map((branch) => (
    <article
      key={branch._id}
      className="group relative overflow-hidden rounded-2xl border border-red-100 bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-800 via-red-500 to-orange-400" />

      <div className="mb-6 flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-2xl">
          🏨
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            branch.isActive
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {branch.isActive ? "Available" : "Closed"}
        </span>
      </div>

      <div  className='flex items-center justify-between mt-2'>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-700">
        {branch.branchCode}
      </p>
       <span className='text-[12px] uppercase font-bold' style={{margin:"auto 0px",letterSpacing:"1px"}}> Created By: {branch.createdBy?.name ?? "Unknown"} </span>
      </div>
    
       
       <h2 className="font-bold text-[16px] uppercase text-[#e02424] mt-3">
        {branch.branchName}
      </h2>
      
    
      
      <div className="flex items-start gap-2 text-sm text-gray-500 mt-3">
        <span>📍</span>
        <p>{branch.address}</p>
      </div>
        
     <Link href={'/user/login'} className='view-branch-btn mt-3 uppercase'>Choose Branch</Link>
      
    </article>
  ))}
</div>

    </div>
    </section>
    
    
    </>
  )
}

export default ChooseBranch