"use client"

import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { AxiosError } from 'axios'
import { PiTableBold, PiMapPinSimpleAreaFill } from "react-icons/pi";
import {useRouter} from 'next/navigation'

function page() {

  interface areaData {
    areaName: string,
    _id: string,
    areaCode: string
  }

  interface BranchSummary {
    _id?: string;
    branchName: string;
  }

  interface AreaSummary {
    _id: string;
    areaName: string;
    branchName?: BranchSummary;
  }

  interface TableByBranchResponse {
    _id: string;
    tableNumber: string;
    areaName: AreaSummary;
    availabilityStatus: "AVAILABLE" | "OCCUPIED";
    createdBy?: string;
  }

  const [areaData, setAreaData] = useState<areaData[]>([])
  const [tableList, setTableList] = useState<TableByBranchResponse[]>([])
  const [selectedArea, setSelectedArea] = useState<string>("ALL")

  async function getBranchDatasFun() {
    try {
      const res = await api.get('/get/area/branch')
      const data = Array.isArray(res?.data?.data) ? res.data.data : []
      setAreaData(data)
    }
    catch (err) {
      const error = err as AxiosError<{ message?: string }>
      alert(error.response?.data?.message || error.message || "Failed to add branch. Please try again.")
    }
  }

  async function getAllTablesFun() {
    try {
      const res = await api.get('/get/all/tables')
      const data = Array.isArray(res?.data?.data) ? res.data.data : []
      setTableList(data)
    }
    catch (err) {
      const error = err as AxiosError<{ message?: string }>
      alert(error.response?.data?.message || error.message || "Failed to add branch. Please try again.")
    }
  }

  async function getTableByAreaFun(id: string) {
    try {
      const res = await api.get(`/get/tables/area/${id}`)
      const data = Array.isArray(res?.data?.data) ? res.data.data : []
      setTableList(data)
    }
    catch (err) {
      const error = err as AxiosError<{ message?: string }>
      alert(error.response?.data?.message || error.message || "Failed to add branch. Please try again.")
    }
  }

  async function getTableByBranch() {
    try {
      const res = await api.get('/get/tables/branch')
      const data = Array.isArray(res?.data?.data) ? res.data.data : []
      setTableList(data)
    }
    catch (err) {
      const error = err as AxiosError<{ message?: string }>
      alert(error.response?.data?.message || error.message || "Failed to add branch. Please try again.")
    }
  }

  useEffect(() => {
    getBranchDatasFun()
    getTableByBranch()
  }, [])

  const router=useRouter()

  return (
    <>
      <div className="p-6 lg:p-8">
        <div className="mt-4 rounded-2xl border border-red-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between ">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#9b1c1c]">
              Get Tables By Areas
            </h2>

            <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-bold text-[#9b1c1c]">
              {areaData.length} Areas
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              key="all"
              className={`rounded-full px-3 py-2 text-[11px] font-bold transition ${
                selectedArea === "ALL"
                  ? "bg-[#9b1c1c] text-white"
                  : "border border-red-200 bg-[#fffaf7] text-gray-700 hover:bg-[#9b1c1c] hover:text-white"
              }`}
              onClick={() => {
                setSelectedArea("ALL")
                getAllTablesFun()
              }}
            >
              All
            </button>

            {areaData.map((area) => (
              <button
                type="button"
                key={area._id}
                className={`rounded-full px-3 py-2 text-[11px] font-bold transition ${
                  selectedArea === area._id
                    ? "bg-[#9b1c1c] text-white"
                    : "border border-red-200 bg-[#fffaf7] text-gray-700 hover:bg-[#9b1c1c] hover:text-white"
                }`}
                onClick={() => {
                  setSelectedArea(area._id)
                  getTableByAreaFun(area._id)
                }}
              >
                {area.areaName} -- {area.areaCode}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-12 lg:p-8">
        {tableList.map((table) => (
          <article
            key={table._id}
            className="flex h-28 w-28 flex-col items-center justify-center rounded-2xl border border-red-100 bg-white p-2 shadow-sm transition hover:-translate-y-1 hover:shadow-md" onClick={()=>router.push('/user-dashboard/menus')}>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-[#9b1c1c]">
                {table.tableNumber}
              </span>

              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  table.availabilityStatus === "AVAILABLE"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />
            </div>

            <div className="mt-1 text-[11px] font-bold uppercase text-gray-500">
              {table.areaName.areaName}
            </div>

            <div className="mt-1 text-[10px] font-bold uppercase text-gray-600">
              {table.availabilityStatus}
            </div>
          </article>
        ))}
      </div>

    </>

  )
}

export default page