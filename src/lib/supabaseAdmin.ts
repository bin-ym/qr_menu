import { createClient } from '@supabase/supabase-js'

// SERVER-ONLY — never import this file in a 'use client' component.
// It uses the service_role key, which bypasses RLS entirely.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)