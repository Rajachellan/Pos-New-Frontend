"use client"

import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { AxiosError } from 'axios'
import { PiMapPinSimpleAreaFill } from 'react-icons/pi'



function AddAreasPage() {
 
  interface Branch {
  _id: string
  branchName: string
  branchCode: string
}
  const [branchData,setBranchData]=useState <Branch[]> ()

  async function getBranch() {
    try{
      const res=await api.get('/get/branch')
      setBranchData(res.data.data)

    }
    catch(err){
      const error = err as AxiosError<{ message?: string }> 
      alert(
            error.response?.data?.message ||
              error.message ||
              "Failed to add branch. Please try again."
            )
    }
  }
    useEffect(()=>{
    getBranch()
  },[])

  const [areaName,setAreaName]=useState<string>("")
  const [areaCode,setaAreaCode]=useState<string>("")
  const [branchName,setBranchName]=useState<string>("")

  async function addBranch(e:React.FormEvent <HTMLFormElement>) {
    e.preventDefault()
    try{
      const res=await api.post('/add/area',{areaName,areaCode,branchName})
      alert(res.data.message)
      getAreas()
    }
    catch(err){
      const error = err as AxiosError<{ message?: string }> 
      alert(
            error.response?.data?.message ||
              error.message ||
              "Failed to add branch. Please try again."
            )
    }
  }
  interface branchByName{
    branchName:string
  }

  interface areas{
    _id:string,
    areaName:string,
    areaCode:string,
    branchName:branchByName
  }

  

  const [areadatas,setAreaDatas]=useState<areas[]>([])

    async function getAreas() {
    try{
      const res=await api.get('/get/area/all')
      setAreaDatas(res.data.data)

    }
    catch(err){
      const error = err as AxiosError<{ message?: string }> 
      alert(
            error.response?.data?.message ||
              error.message ||
              "Failed to add branch. Please try again."
            )
    }
  }

  useEffect(()=>{
    getAreas()
  },[])

  return (
    
    <>
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-red-100 pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md">
          <PiMapPinSimpleAreaFill size={26} />
        </div>
        <div>
          <h1 className="font-playfair text-2xl font-bold text-gray-900">Add Dining Area</h1>
          <p className="text-xs text-gray-500">Configure layout areas (e.g., Terrace, AC Hall, Garden, Main Floor)</p>
        </div>
      </div>

      <div className="bg-white p-6 lg:p-8 rounded-2xl border border-red-100 shadow-sm">
        <form  className="flex flex-col gap-6" onSubmit={(e)=>addBranch(e)}>
         
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
              Area Name
            </label>
            <input
              type="text"
              required value={areaName}
              placeholder="e.g. Main Dining Hall, Rooftop Terrace" onChange={(e)=>setAreaName(e.target.value)}
             
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-red-500 focus:outline-none transition"
            />
          </div>

           <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
              Area Code
            </label>
            <input
              type="text" value={areaCode}
              required
              placeholder="e.g. Main Dining Hall, Rooftop Terrace" onChange={(e)=>setaAreaCode(e.target.value)}
             
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-red-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
              Select Branch
            </label>
            <select value={branchName}
              required className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-red-500 focus:outline-none transition bg-white"
         onChange={(e)=>setBranchName(e.target.value)}>
              <option value="" disabled>
                -- Select Target Branch --
              </option>
              {
                branchData?.map((x,y)=>{
                  return(
                    <option key={x._id} value={x._id}>{x.branchName}</option>
                  )
                })
              }
              
            </select>
          </div>

          <button
            type="submit" className="w-full rounded-xl bg-[#9b1c1c] py-3.5 text-sm font-semibold text-white transition hover:bg-[#e02424] shadow-md disabled:opacity-50">
           Add Branch
          </button>
        </form>
      </div>
    </div>

    <section className="mt-8 px-10 pb-20">
  <div className="mb-4 flex items-center justify-between">
    <div>
      <h2 className="text-xl font-bold text-gray-900">
        Dining Areas
      </h2>
      <p className="text-sm text-gray-500">
        Manage areas configured for your branches
      </p>
    </div>

    <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-[#9b1c1c]">
      {areadatas.length} Areas
    </span>
  </div>

  {areadatas.length === 0 ? (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
      No dining areas found
    </div>
  ) : (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
      {areadatas.map((area) => (
        <article
          key={area._id}
          className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-2xl">
                📍
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {area.areaName}
                </h3>

                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Dining Area
                </p>
              </div>
            </div>

            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
              Active
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400">
                Area Code
              </p>
              <p className="mt-1 font-semibold text-[#9b1c1c]">
                {area.areaCode}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400">
                Branch
              </p>
              <p className="mt-1 truncate font-semibold text-gray-700">
                {area.branchName?.branchName}
              </p>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
             
              className="flex-1 rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
            >
              Update
            </button>

            <button
              type="button"
             
              className="flex-1 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  )}
</section>
    
    </>

      

  )
}

export default AddAreasPage