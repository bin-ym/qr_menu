'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

const VENUE_TYPES = ['restaurant', 'hotel', 'cafe', 'bar', 'other']

export default function NewVenuePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [type, setType] = useState('restaurant')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setCreating(true)

    // 1. Create the venue
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .insert({ name, address, type })
      .select()
      .single()

    if (venueError || !venue) {
      setError(venueError?.message ?? 'Failed to create venue.')
      setCreating(false)
      return
    }

    // 2. Create the admin via the server-side API route
    //    (does NOT touch your current SuperAdmin session)
    const res = await fetch('/api/admin/create-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
        venueId: venue.id,
      }),
    })

    const result = await res.json()

    if (!res.ok) {
      setError(result.error ?? 'Failed to create admin.')
      setCreating(false)
      return
    }

    // success
    router.push(`/superadmin/dashboard/venues/${venue.id}`)
  }

  return (
    <div className="max-w-md">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">New Venue</h1>

      <form onSubmit={handleCreate} className="rounded-lg border border-zinc-200 bg-white p-6">
        <label className="mb-1 block text-sm font-medium text-zinc-700">Venue Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mb-3 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />

        <label className="mb-1 block text-sm font-medium text-zinc-700">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="mb-3 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm capitalize transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          {VENUE_TYPES.map((t) => (
            <option key={t} value={t} className="capitalize">
              {t}
            </option>
          ))}
        </select>

        <label className="mb-1 block text-sm font-medium text-zinc-700">Address</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="mb-3 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />

        <hr className="my-4 border-zinc-200" />

        <label className="mb-1 block text-sm font-medium text-zinc-700">Admin Email</label>
        <input
          type="email"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          required
          className="mb-3 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />

        <label className="mb-1 block text-sm font-medium text-zinc-700">Admin Password</label>
        <input
          type="password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          required
          minLength={6}
          className="mb-4 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={creating}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Create Venue + Admin'}
        </button>
      </form>
    </div>
  )
}