'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

const navItems = [
  { label: 'Overview', href: '/superadmin/dashboard' },
  { label: 'Venues', href: '/superadmin/dashboard/venues' },
]

export default function SuperAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [email, setEmail] = useState('')

  useEffect(() => {
    async function checkAccess() {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (!user) {
        router.replace('/superadmin/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'superadmin') {
        router.replace('/superadmin/login')
        return
      }

      setEmail(profile.email)
      setChecking(false)
    }

    checkAccess()
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/superadmin/login')
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
        Checking access...
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col justify-between border-r border-zinc-200 bg-white p-6">
        <div>
          <div className="mb-8">
            <h2 className="text-lg font-bold text-zinc-900">
              SuperAdmin
            </h2>
            <p className="mt-0.5 text-xs font-medium text-indigo-600">Platform Control</p>
          </div>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-600 hover:bg-indigo-50 hover:text-indigo-700'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="border-t border-zinc-200 pt-4">
          <p className="mb-2 truncate text-xs text-zinc-500">{email}</p>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}