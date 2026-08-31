import { createClient, SupabaseClient } from '@supabase/supabase-js'

// SERVER-ONLY — never import this file in a 'use client' component.
// It uses the service_role key, which bypasses RLS entirely.
/**
 * Returns a Supabase admin client. During the build step the required env variables may be missing.
 * In that case we return a dummy client that throws when used, preventing the module from throwing on import.
 */
export function getSupabaseAdmin(): SupabaseClient<any, 'public'> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    // Return a proxy that throws on any operation to make the failure explicit at runtime.
    const handler = {
      get() {
        throw new Error('Supabase admin client accessed without required env variables')
      },
    }
    return new Proxy({} as any, handler)
  }
  return createClient(url, key)
}