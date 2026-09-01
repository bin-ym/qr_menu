'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Script from 'next/script'
import { supabase } from '@/lib/supabaseClient'

type Item = {
  id: string
  name: string
  description: string | null
  price: number
  photo_url: string | null
  model_url: string | null
}

export default function ItemDetailPage() {
  const { venueId, itemId } = useParams<{ venueId: string; itemId: string }>()
  const searchParams = useSearchParams()
  const tableNumber = searchParams.get('table')
  const router = useRouter()

  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('items')
        .select('id, name, description, price, photo_url, model_url')
        .eq('id', itemId)
        .single()
      setItem(data)
      setLoading(false)
    }
    load()
  }, [itemId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
        Loading...
      </div>
    )
  }

  if (!item) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
        Item not found.
      </div>
    )
  }

  const backUrl = `/menu/${venueId}${tableNumber ? `?table=${tableNumber}` : ''}`

  return (
    <div className="min-h-screen bg-zinc-50">
      <Script
        type="module"
        src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"
        strategy="afterInteractive"
      />

      <header className="border-b border-zinc-200 bg-white px-4 py-4">
        <button
          onClick={() => router.push(backUrl)}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          ← Back to menu
        </button>
      </header>

      <div className="p-4">
        {item.model_url ? (
          // @ts-expect-error - model-viewer is a custom element, not a typed React component
          <model-viewer
            src={item.model_url}
            poster={item.photo_url ?? undefined}
            camera-controls
            auto-rotate
            ar
            style={{ width: '100%', height: '320px', background: '#f4f4f5', borderRadius: '12px' }}
          />
        ) : item.photo_url ? (
          <img
            src={item.photo_url}
            alt={item.name}
            className="h-80 w-full rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-80 w-full items-center justify-center rounded-xl bg-zinc-100 text-sm text-zinc-400">
            No image or 3D model yet
          </div>
        )}

        <h1 className="mt-4 text-xl font-semibold text-zinc-900">{item.name}</h1>
        {item.description && (
          <p className="mt-1 text-sm text-zinc-600">{item.description}</p>
        )}
        <p className="mt-2 text-lg font-semibold text-zinc-900">
          {item.price.toFixed(2)} Birr
        </p>
      </div>
    </div>
  )
}