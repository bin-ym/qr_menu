'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

const navItems = [
  { label: 'Overview', href: '/admin/dashboard' },
  { label: 'Categories', href: '/admin/dashboard/categories' },
  { label: 'Items', href: '/admin/dashboard/items' },
  { label: 'Tables', href: '/admin/dashboard/tables' },
]

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [email, setEmail] = useState('')
  const [venueName, setVenueName] = useState('')
  

  useEffect(() => {
    async function checkAccess() {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (!user) {
        router.replace('/admin/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, email, venue_id, venues(name)')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin' || !profile.venue_id) {
        router.replace('/admin/login')
        return
      }

      setEmail(profile.email)
      // @ts-expect-error - joined relation shape
      setVenueName(profile.venues?.name ?? '')
      setChecking(false)
    }

    checkAccess()
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/admin/login')
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
      <aside className="flex w-64 flex-col justify-between border-r border-zinc-200 bg-white p-6">
        <div>
          <h2 className="mb-1 text-lg font-semibold text-zinc-900">{venueName || 'Admin'}</h2>
          <p className="mb-8 text-xs text-zinc-500">Venue Dashboard</p>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    active
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-600 hover:bg-zinc-100'
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
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}