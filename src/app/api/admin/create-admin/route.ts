import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  const { email, password, venueId } = await req.json()

  if (!email || !password || !venueId) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  // 1. Create the auth user directly — does NOT affect any browser session
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email verification since SuperAdmin is vouching for them
  })

  if (userError || !userData.user) {
    return NextResponse.json(
      { error: userError?.message ?? 'Failed to create user.' },
      { status: 400 }
    )
  }

  // 2. Create the matching profile row
  const { error: profileError } = await supabaseAdmin.from('profiles').insert({
    id: userData.user.id,
    email,
    role: 'admin',
    venue_id: venueId,
  })

  if (profileError) {
    // rollback: delete the auth user we just created, so we don't leave an orphan
    await supabaseAdmin.auth.admin.deleteUser(userData.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, userId: userData.user.id })
}