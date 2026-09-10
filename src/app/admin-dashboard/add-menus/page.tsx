"use client"

import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { AxiosError } from "axios";
import { PiForkKnifeBold } from "react-icons/pi";

function page() {
    
  const [category,setCategory]=useState<string>("")
  const [name,setName]=useState<string>("")
  const [price,setPrice]=useState<number>()

  const categories=["Biryani","Starters","Tandoori","Chinese","Fast-Food","Soups","Desserts","Drinks","Meals"]

  const [loading, setLoading] = useState(false);

  async function addMenusFun(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  setLoading(true);

  try {
    const response = await api.post("/add/menu", {
      category,
      name,
      price: Number(price),
    });

    alert(response.data.message);
    setCategory("")
    setName("")
    setPrice(0)
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;

    alert(
      axiosError.response?.data?.message ||
        axiosError.message ||
        "Failed to add menu item."
    );
  } finally {
    setLoading(false);
  }
}

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
    <main className="bg-[#fffaf7] p-6 lg:p-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center gap-4 border-b border-red-100 pb-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#9b1c1c] text-white shadow-md">
            <PiForkKnifeBold size={28} />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e02424]">
              Restaurant Setup
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              Add Food Menu
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Add dishes and prices to your restaurant menu.
            </p>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
          <section className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm lg:p-8">
            <h2 className="text-lg font-bold text-gray-900">
              Menu Information
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter the details for the new food item.
            </p>

            <form onSubmit={(e)=>addMenusFun(e)} className="mt-6 space-y-6">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Food Name
                </label>

                <input
                  required
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Example: Chicken Biryani"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#9b1c1c] focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Category
                </label>

                <select
                  required
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#9b1c1c] focus:ring-2 focus:ring-red-100"
                >
                  <option value="" disabled>
                    Select food category
                  </option>

                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Price
                </label>

                <div className="flex items-center rounded-xl border border-gray-200 focus-within:border-[#9b1c1c] focus-within:ring-2 focus-within:ring-red-100">
                  <span className="px-4 text-sm font-semibold text-gray-500">
                    INR
                  </span>

                  <input
                    required
                    min="1"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="250"
                    className="w-full rounded-r-xl px-3 py-3 text-sm outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#9b1c1c] py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#e02424] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Adding Menu Item..." : "Add Menu Item"}
              </button>
            </form>
          </section>

          <aside className="rounded-2xl bg-[#9b1c1c] p-6 text-white shadow-md lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-200">
              Live Preview
            </p>

            <div className="mt-8 rounded-2xl bg-white p-6 text-gray-900 shadow-lg">
              <p className="text-xs font-bold uppercase tracking-wider text-[#e02424]">
                {category || "Food Category"}
              </p>

              <h2 className="mt-3 text-2xl font-bold">
                {name || "Your Food Item"}
              </h2>

              <div className="mt-6 border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500">Menu Price</p>
                <p className="mt-1 text-2xl font-bold text-[#9b1c1c]">
                  INR {price || "0"}
                </p>
              </div>
            </div>

            <p className="mt-6 text-sm leading-6 text-red-100">
              Make the dish name clear and choose the category customers will
              use when searching the menu.
            </p>
          </aside>
        </div>
      </div>
    </main>
  
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