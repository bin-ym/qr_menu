'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Category = {
  id: string
  name: string
  sort_order: number
}

export default function CategoriesPage() {
  const [venueId, setVenueId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [error, setError] = useState('')

  async function loadCategories(vid: string) {
    setLoading(true)
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('venue_id', vid)
      .order('sort_order')
    setCategories(data ?? [])
    setLoading(false)
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
        loadCategories(profile.venue_id)
      }
    }
    init()
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!venueId || !newName.trim()) return
    setError('')

    const { error: insertError } = await supabase.from('categories').insert({
      venue_id: venueId,
      name: newName.trim(),
      sort_order: categories.length,
    })

    if (insertError) {
      setError(insertError.message)
      return
    }

    setNewName('')
    loadCategories(venueId)
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id)
    setEditingName(cat.name)
  }

  async function saveEdit(id: string) {
    if (!venueId) return
    await supabase.from('categories').update({ name: editingName }).eq('id', id)
    setEditingId(null)
    loadCategories(venueId)
  }

  async function handleDelete(id: string) {
    if (!venueId) return
    if (!confirm('Delete this category? Items in it will become uncategorized.')) return
    await supabase.from('categories').delete().eq('id', id)
    loadCategories(venueId)
  }

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Categories</h1>

      <form onSubmit={handleAdd} className="mb-6 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700"
        >
          Add
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading...</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-zinc-500">No categories yet.</p>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 last:border-0"
            >
              {editingId === cat.id ? (
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => saveEdit(cat.id)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit(cat.id)}
                  autoFocus
                  className="flex-1 rounded-lg border border-zinc-300 px-2 py-1 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              ) : (
                <span className="text-sm text-zinc-900">{cat.name}</span>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => startEdit(cat)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="text-xs font-medium text-red-500 hover:text-red-700"
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