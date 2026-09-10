"use client"

import React, { useState } from 'react'

import { FiEye, FiEyeOff, FiLock } from "react-icons/fi";
import api from '@/src/app/services/api';

import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';

function LoginPage() {

  const [eyeOpen, setEyeOpen] = useState(false);

  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")

  const [loading, setLoading] = useState(false)

  const router = useRouter()

  async function loginFun(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/user/login', { email, password })
      localStorage.setItem("Token", res.data.token)

      if (res.data.userRole === "Super-Admin") {
        router.push('/admin-dashboard')
      }
      else {
        router.push('/user-dashboard')
      }

      setEmail("")
      setPassword("")
    }
    catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      alert(
        error.response?.data?.message ||
        error.message ||
        "Login failed. Please try again."
      )
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <>

      <section className="min-h-screen bg-[#fdf2f2] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
          <div className="grid w-full overflow-hidden rounded-2xl border border-red-100 bg-white shadow-xl lg:grid-cols-2">
            <div className="bg-gradient-to-br from-[#9b1c1c] to-[#e02424] p-10 text-white lg:flex lg:flex-col lg:justify-between">
              <div>
                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-red-100">
                  Hotel Management System
                </p>

                <h1 className="font-playfair text-4xl font-bold leading-tight">
                  Manage your hotel with confidence.
                </h1>

                <p className="mt-5 max-w-sm text-sm leading-6 text-red-100">
                  Access your branch operations, tables, areas, and staff from one
                  secure dashboard.
                </p>
              </div>

              <p className="text-sm text-red-100">
                Secure access for authorized staff
              </p>
            </div>

            <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14">
              <div className="mb-8">
                <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-800">
                  Secure Login
                </span>

                <h2 className="mt-5 font-playfair text-3xl font-bold text-gray-900">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Sign in to access your hotel dashboard.
                </p>
              </div>

              <form className="flex flex-col gap-5" onSubmit={loginFun}>
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@example.com"
                    autoComplete="email"
                    required
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                    <input
                      id="password"
                      type={eyeOpen ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      className="w-full rounded-lg border border-gray-200 py-3 pl-11 pr-12 text-sm outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
                    />

                    <button
                      type="button"
                      onClick={() => setEyeOpen((current) => !current)}
                      aria-label={eyeOpen ? "Hide password" : "Show password"}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-red-700"
                    >
                      {eyeOpen ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 rounded-lg bg-[#9b1c1c] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#e02424] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Signing in..." : "Login Here"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>


    </>
  )
}

export default LoginPage