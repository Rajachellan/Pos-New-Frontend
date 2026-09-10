"use client"

import React, { useEffect, useState } from 'react'
import api from '../../services/api';
import { AxiosError } from "axios";

function page() {

  interface menus{
    _id:string,
    category:string,
    name:string,
    price:number,
    }

  const [menuDatas,setMenuDatas]=useState<menus[]>([])

    async function getMenus() {
    try{
        const res=await api.get('/get/menus')
        setMenuDatas(res.data.data)
    }
    catch(err){
         const axiosError = err as AxiosError<{ message?: string }>;

    alert(
      axiosError.response?.data?.message ||
        axiosError.message ||
        "Failed to add menu item."
    );
    }
    }

    useEffect(()=>{
        getMenus()
    },[])

  return (
    <>
    
     <section className="p-8">
  <div className="mb-5 flex items-center justify-between">
    <div>
      <h2 className="text-xl font-bold text-gray-900">Food Menu</h2>
      <p className="text-sm text-gray-500">
        All menu items added to your restaurant
      </p>
    </div>

    <span className="rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-[#9b1c1c]">
      {menuDatas.length} Items
    </span>
  </div>

  {menuDatas.length === 0 ? (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
      No menu items found.
    </div>
  ) : (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
      {menuDatas.map((menu) => (
        <article
          key={menu._id}
          className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-[#e02424]">
            {menu.category}
          </p>

          <h3 className="mt-2 text-lg font-bold text-gray-900">
            {menu.name}
          </h3>

          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-xs uppercase tracking-wider text-gray-400">
              Price
            </p>

            <p className="mt-1 text-xl font-bold text-[#9b1c1c]">
              INR {menu.price}
            </p>
          </div>
        </article>
      ))}
    </div>
  )}
     </section>
    
    
    </>
  )
}

export default page