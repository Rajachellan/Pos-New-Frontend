"use client";

import React, { useEffect, useState } from "react";
import { PiTableBold, PiMapPinSimpleAreaFill } from "react-icons/pi";
import api from "../../services/api";

import { AxiosError } from "axios";

function AddTablesPage() {

    interface branchByName{
    branchName:string
  }

    interface area{
        _id:string,
        areaName:string,
        areaCode:string,
        branchName:branchByName
    }

    const [areaDatas,setAreaDatas]=useState<area[]>([])
    
    async function getAreaDatas() {
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
        getAreaDatas()
    },[])

    // Add Tables Functionality
    const [tableNumber,setTableNumber]=useState<string>("")
    const [areaName,setAreaName]=useState<string>("")
    
    async function addTablesfun(e:React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        try{
          const res=await api.post('/add/tables',{tableNumber,areaName})
          alert(res.data.message)
          setTableNumber("")
          setAreaName("")
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
  
    interface BranchSummary {
  _id?: string;
  branchName: string;
  branchCode?: string;
}

interface Area {
  _id: string;
  areaName: string;
  areaCode: string;
  branchName: BranchSummary;
}

interface TableData {
  _id: string;
  tableNumber: string;
  areaName: Area;
  availabilityStatus: "AVAILABLE" | "OCCUPIED";
  createdBy?: string;
}
    const [tableData,setTableDatas]=useState<TableData[]>([])
    
    // Get All Tables
    async function getAllTableDatasFun() {
        try{
          const res=await api.get('/get/all/tables')
          setTableDatas(res.data.data)
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
      getAllTableDatasFun()
    },[])

    interface BranchSummary {
  branchName: string;
}

interface AreaDetail {
  _id: string;
  areaName: string;
  branchName?: BranchSummary;
}

interface TableByArea {
  _id: string;
  tableNumber: string;
  areaName: AreaDetail;
  availabilityStatus: "AVAILABLE" | "OCCUPIED";
}
    const [tableByArea,setTableByArea]=useState<TableByArea[]>([])

    // Get Tables By Area
    async function getTableByAreaFun(id:any) {
      try{
        const res=await api.get(`/get/tables/area/${id}`)
        setTableByArea(res.data.data)
      }
      catch(err){
        const error = err as AxiosError<{ message?: string }> 
        alert(error.response?.data?.message || error.message ||"Failed to add branch. Please try again.")
      }
    }

   

  return (
   <>
    <div className="bg-[#fffaf7] p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-center gap-4 border-b border-red-100 pb-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#9b1c1c] text-white shadow-md">
            <PiTableBold size={28} />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e02424]">
              Restaurant Setup
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              Add Dining Tables
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Assign a table to a specific dining area.
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm lg:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                Table Information
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Enter the details for the new table.
              </p>
            </div>

            <form className="space-y-6" onSubmit={(e)=>addTablesfun(e)}>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Table Number
                </label>

                <input
                  type="text"
                  placeholder="e.g. T-01"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#9b1c1c] focus:ring-2 focus:ring-red-100" onChange={(e)=>setTableNumber(e.target.value)}
               value={tableNumber} />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Select Area
                </label>

                <select
                  defaultValue=""
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#9b1c1c] focus:ring-2 focus:ring-red-100"
              onChange={(e)=>setAreaName(e.target.value)} value={areaName}  >
                  <option value="" disabled>
                    Select dining area
                  </option>
                  {
                    areaDatas.map((x,y)=>{
                        return(
                            <option value={x._id}>      {x.areaName} : {x.branchName?.branchName} </option>
                        )
                    })
                  }
                </select>
              </div>
            <button
                type="submit"
                className="w-full rounded-xl bg-[#9b1c1c] py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#e02424]"
              >
                Add Table
              </button>
            </form>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl bg-[#9b1c1c] p-6 text-white shadow-md">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                <PiMapPinSimpleAreaFill size={26} />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-200">
                Selected Area
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Main Dining Hall
              </h2>

              <p className="mt-2 text-sm leading-6 text-red-100">
                Tables added here will belong only to this dining area.
              </p>
            </div>

            <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">
                Table Preview
              </h2>

              <div className="mt-5 rounded-2xl border border-dashed border-red-200 bg-red-50 p-6 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-8 border-white bg-[#9b1c1c] text-xl font-bold text-white shadow-md">
                  T-01
                </div>

                <p className="mt-4 text-sm font-semibold text-gray-800">
                  Main Dining Hall
                </p>

                <span className="mt-2 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                  Available
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div className="mt-4 p-6 lg:p-8">
  <div className="mb-4 flex items-center justify-between">
    <div>
      <h2 className="text-xl font-bold text-gray-900">
        Table List
      </h2>
      <p className="text-sm text-gray-500">
        All dining tables by branch and area
      </p>
    </div>

    <span className="rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-[#9b1c1c]">
      {tableData.length} Tables
    </span>
  </div>

  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    {tableData.map((table) => (
      <article
        key={table._id}
        className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#9b1c1c] text-white">
            <PiTableBold size={24} />
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              table.availabilityStatus === "AVAILABLE"
                ? "bg-green-100 text-green-700"
                : "bg-orange-100 text-orange-700"
            }`} >
            {table.availabilityStatus}
          </span>
        </div>

        <div className="mt-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
            Table Number
          </p>
          <h3 className="mt-2 text-xl font-bold text-[#9b1c1c]">
            {table.tableNumber}
          </h3>
        </div>

        <div className="mt-5 border-t border-red-50 pt-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
              Branch
            </span>

            <span className="text-sm font-bold text-gray-800">
              {table.areaName.branchName?.branchName}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
              Area
            </span>

            <span className="text-sm font-bold text-gray-800">
              {table.areaName.areaName}
            </span>
          </div>
        </div>
      </article>
    ))}
  </div>
    </div>

    <div className="p-6 lg:p-8"> 
    <div className="mt-4 rounded-2xl border border-red-100 bg-white p-4 shadow-sm">
  <div className="mb-3 flex items-center justify-between ">
    <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#9b1c1c]">
      Get Tables By Areas
    </h2>

    <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-bold text-[#9b1c1c]">
      {areaDatas.length} Areas
    </span>
  </div>

  <div className="flex flex-wrap gap-2">
    {areaDatas.map((area) => (
      <button
        type="button"
        key={area._id}
        onClick={() => getTableByAreaFun(area._id)}
        className="rounded-full border border-red-200 bg-[#fffaf7] px-3 py-2 text-[11px] font-bold text-gray-700 transition hover:bg-[#9b1c1c] hover:text-white"
      >
        {area.areaName} -- {area.branchName.branchName}
      </button>
    ))}
  </div>
   </div>
    </div>


    <div className="mt-4 p-6 lg:p-8">
  <div className="mb-4 flex items-center justify-between">
    <div>
      <h2 className="text-xl font-bold text-gray-900">
        Table List
      </h2>
      <p className="text-sm text-gray-500">
        All dining tables by branch and area
      </p>
    </div>

    <span className="rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-[#9b1c1c]">
      {tableByArea.length} Tables
    </span>
  </div>

  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    {tableByArea.map((table) => (
      <article
        key={table._id}
        className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#9b1c1c] text-white">
            <PiTableBold size={24} />
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              table.availabilityStatus === "AVAILABLE"
                ? "bg-green-100 text-green-700"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            {table.availabilityStatus}
          </span>
        </div>

        <div className="mt-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
            Table Number
          </p>

          <h3 className="mt-2 text-xl font-bold text-[#9b1c1c]">
            {table.tableNumber}
          </h3>
        </div>

        <div className="mt-5 border-t border-red-50 pt-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
              Branch
            </span>

            <span className="text-sm font-bold text-gray-800">
              {table.areaName.branchName?.branchName}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
              Area
            </span>

            <span className="text-sm font-bold text-gray-800">
              {table.areaName.areaName}
            </span>
          </div>
        </div>
      </article>
    ))}
  </div>
    </div>


   </>
  );
}

export default AddTablesPage;