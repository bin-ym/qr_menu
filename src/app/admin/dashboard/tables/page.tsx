'use client'

import { useEffect, useState, useRef } from 'react'
import QRCode from 'qrcode'
import { supabase } from '@/lib/supabaseClient'

type VenueTable = {
  id: string
  table_number: number
  label: string | null
}

// Change this to your real deployed domain once you have one.
// For now, localhost works for testing on the same device/network.
const BASE_URL = typeof window !== 'undefined' ? window.location.origin : ''

export default function TablesPage() {
  const [venueId, setVenueId] = useState<string | null>(null)
  const [tables, setTables] = useState<VenueTable[]>([])
  const [loading, setLoading] = useState(true)
  const [newLabel, setNewLabel] = useState('')
  const [error, setError] = useState('')
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({})

  async function loadTables(vid: string) {
    setLoading(true)
    const { data } = await supabase
      .from('venue_tables')
      .select('*')
      .eq('venue_id', vid)
      .order('table_number')
    setTables(data ?? [])
    setLoading(false)

    // generate QR codes for each table
    if (data) {
      const urls: Record<string, string> = {}
      for (const t of data) {
        const menuUrl = `${BASE_URL}/menu/${vid}?table=${t.table_number}`
        urls[t.id] = await QRCode.toDataURL(menuUrl, { width: 200, margin: 1 })
      }
      setQrDataUrls(urls)
    }
  }

  useEffect(() => {
    async function init() {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session?.user.id
      if (!userId) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', userId)
        .single()

      if (profile?.venue_id) {
        setVenueId(profile.venue_id)
        loadTables(profile.venue_id)
      }
    }
    init()
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!venueId) return
    setError('')

    const nextNumber =
      tables.length > 0 ? Math.max(...tables.map((t) => t.table_number)) + 1 : 1

    const { error: insertError } = await supabase.from('venue_tables').insert({
      venue_id: venueId,
      table_number: nextNumber,
      label: newLabel.trim() || null,
    })

    if (insertError) {
      setError(insertError.message)
      return
    }

    setNewLabel('')
    loadTables(venueId)
  }

  async function handleDelete(id: string) {
    if (!venueId) return
    if (!confirm('Delete this table? Its QR code will stop working.')) return
    await supabase.from('venue_tables').delete().eq('id', id)
    loadTables(venueId)
  }

  function downloadQr(table: VenueTable) {
    const dataUrl = qrDataUrls[table.id]
    if (!dataUrl) return
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `table-${table.table_number}-qr.png`
    link.click()
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Tables & QR Codes</h1>

      <form onSubmit={handleAdd} className="mb-8 flex items-end gap-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Table label (optional)
          </label>
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="e.g. Patio 3"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          + Add Table
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading...</p>
      ) : tables.length === 0 ? (
        <p className="text-sm text-zinc-500">No tables yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {tables.map((t) => (
            <div
              key={t.id}
              className="flex flex-col items-center rounded-lg border border-zinc-200 bg-white p-4"
            >
              <p className="mb-1 text-sm font-semibold text-zinc-900">
                Table {t.table_number}
              </p>
              {t.label && <p className="mb-2 text-xs text-zinc-500">{t.label}</p>}

              {qrDataUrls[t.id] ? (
                <img
                  src={qrDataUrls[t.id]}
                  alt={`QR code for table ${t.table_number}`}
                  className="mb-3 h-32 w-32"
                />
              ) : (
                <div className="mb-3 flex h-32 w-32 items-center justify-center text-xs text-zinc-400">
                  Generating...
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => downloadQr(t)}
                  className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
                >
                  Download
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="text-xs font-medium text-red-600 underline hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}