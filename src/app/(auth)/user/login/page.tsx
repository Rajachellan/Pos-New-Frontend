"use client"

import React, { useState } from 'react'

import Link from 'next/link';
import { FiEye, FiEyeOff, FiLock, FiArrowLeft } from "react-icons/fi";
import api from '@/src/app/services/api';

import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { useAuth } from '@/src/app/context/AuthContext';

function LoginPage() {

  const [eyeOpen, setEyeOpen] = useState(false);

  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")

  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const { loginUser } = useAuth()

  async function loginFun(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/user/login', { email, password })
      loginUser(res.data)
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
      <section className="min-h-screen bg-[#fdf2f2] px-3 py-6 sm:px-6 sm:py-10 lg:px-8 flex flex-col justify-center">
        {/* Mobile-friendly top header with Return to Website */}
        <div className="mx-auto w-full max-w-5xl mb-3 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-red-600 transition bg-white/70 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-red-150 shadow-2xs"
          >
            <FiArrowLeft size={14} />
            <span>Back to Home</span>
          </Link>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden sm:inline">
            HotelPro Cloud POS
          </span>
        </div>

        <div className="mx-auto flex w-full max-w-5xl items-center justify-center">
          <div className="grid w-full overflow-hidden rounded-2xl border border-red-100 bg-white shadow-xl lg:grid-cols-2">
            {/* Left Brand Showcase Banner */}
            <div className="bg-gradient-to-br from-[#9b1c1c] via-[#b91c1c] to-[#e02424] p-6 sm:p-10 text-white flex flex-col justify-between">
              <div>
                <p className="mb-2 sm:mb-4 text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] text-red-200">
                  Hotel Management System
                </p>

                <h1 className="font-playfair text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                  Manage your hotel with confidence.
                </h1>

                <p className="mt-3 sm:mt-5 max-w-sm text-xs sm:text-sm leading-relaxed text-red-100/90">
                  Access your branch operations, live tables, dining areas, and staff from one secure dashboard.
                </p>
              </div>

              <div className="pt-4 sm:pt-6 border-t border-red-400/30 mt-4 sm:mt-0 flex items-center justify-between text-xs text-red-100">
                <span>Authorized Personnel Only</span>
                <span className="text-[10px] bg-red-950/40 px-2 py-0.5 rounded-full border border-red-400/20 font-bold">256-bit SSL</span>
              </div>
            </div>

            {/* Right Login Form */}
            <div className="flex flex-col justify-center px-5 py-8 sm:px-10 lg:px-14">
              <div className="mb-6 sm:mb-8">
                <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#e02424] border border-red-100">
                  Secure Access
                </span>

                <h2 className="mt-3 sm:mt-4 font-playfair text-2xl sm:text-3xl font-bold text-gray-900">
                  Welcome back
                </h2>

                <p className="mt-1 text-xs sm:text-sm text-gray-500">
                  Sign in with your organization credentials.
                </p>
              </div>

              <form className="flex flex-col gap-4 sm:gap-5" onSubmit={loginFun}>
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Email address or Username
                  </label>

                  <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Enter email or username"
                    autoComplete="username"
                    required
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-base sm:text-sm outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
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
                      className="w-full rounded-lg border border-gray-200 py-3 pl-11 pr-12 text-base sm:text-sm outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
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