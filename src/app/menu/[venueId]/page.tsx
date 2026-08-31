'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type Venue = {
  id: string
  name: string
  is_active: boolean
}

type Category = {
  id: string
  name: string
}

type Item = {
  id: string
  name: string
  description: string | null
  price: number
  category_id: string | null
  photo_url: string | null
}

export default function MenuPage() {
  const { venueId } = useParams<{ venueId: string }>()
  const searchParams = useSearchParams()
  const tableNumber = searchParams.get('table')

  const [venue, setVenue] = useState<Venue | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)

      const { data: venueData } = await supabase
        .from('venues')
        .select('id, name, is_active')
        .eq('id', venueId)
        .single()

      if (!venueData || !venueData.is_active) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setVenue(venueData)

      const { data: categoryData } = await supabase
        .from('categories')
        .select('id, name')
        .eq('venue_id', venueId)
        .order('sort_order')
      setCategories(categoryData ?? [])
      if (categoryData && categoryData.length > 0) {
        setActiveCategory(categoryData[0].id)
      }

      const { data: itemData } = await supabase
        .from('items')
        .select('id, name, description, price, category_id, photo_url')
        .eq('venue_id', venueId)
        .eq('is_available', true)
        .order('sort_order')
      setItems(itemData ?? [])

      setLoading(false)
    }

    load()
  }, [venueId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
        Loading menu...
      </div>
    )
  }

  if (notFound || !venue) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
        This menu is not available.
      </div>
    )
  }

  const visibleItems = items.filter((item) => item.category_id === activeCategory)

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-4 py-4">
        <h1 className="text-lg font-semibold text-zinc-900">{venue.name}</h1>
        {tableNumber && (
          <p className="text-xs text-zinc-500">Table {tableNumber}</p>
        )}
      </header>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-zinc-200 bg-white px-4 py-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ${
              activeCategory === cat.id
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Item grid */}
      <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3">
        {visibleItems.length === 0 ? (
          <p className="col-span-full text-sm text-zinc-500">
            No items in this category yet.
          </p>
        ) : (
          visibleItems.map((item) => (
            <Link
              key={item.id}
              href={`/menu/${venueId}/item/${item.id}${
                tableNumber ? `?table=${tableNumber}` : ''
              }`}
              className="rounded-lg border border-zinc-200 bg-white p-3 hover:shadow-sm"
            >
              <div className="mb-2 flex h-24 w-full items-center justify-center rounded-md bg-zinc-100 text-xs text-zinc-400">
                {item.photo_url ? (
                  <img
                    src={item.photo_url}
                    alt={item.name}
                    className="h-full w-full rounded-md object-cover"
                  />
                ) : (
                  'No photo'
                )}
              </div>
              <p className="text-sm font-medium text-zinc-900">{item.name}</p>
              <p className="text-xs text-zinc-500">{item.price.toFixed(2)} Birr</p>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}