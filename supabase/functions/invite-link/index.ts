import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-user-token',
}

/**
 * Generate a 6-character alphanumeric referral code.
 * Uses crypto.getRandomValues for better randomness than Math.random.
 */
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Parse request body
    let body: { universal?: boolean; label?: string; access_token?: string } = {}
    try {
      body = await req.json()
    } catch {
      // empty body
    }

    // Accept user token from: body.access_token, x-user-token header, or Authorization header
    const token = body.access_token
      || req.headers.get('x-user-token')
      || req.headers.get('Authorization')?.replace('Bearer ', '')
      || ''

    const { data: { user }, error: userError } = await admin.auth.getUser(token)

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', detail: userError?.message }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const isUniversal = body.universal === true

    // ── Admin universal code path ──────────────────────────────────────────
    if (isUniversal) {
      const { data: profile } = await admin
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      let code = ''
      for (let attempt = 0; attempt < 5; attempt++) {
        code = generateCode()
        const { error: insertError } = await admin
          .from('referral_codes')
          .insert({
            user_id: user.id,
            code,
            is_universal: true,
            label: body.label || null
          })

        if (!insertError) break
        if (attempt === 4) throw new Error('Could not generate a unique code. Please try again.')
      }

      return new Response(JSON.stringify({
        code,
        url: `https://apexrevenue.works/join?ref=${code}`,
        universal: true,
        label: body.label || null
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── Personal code path ─────────────────────────────────────────────────
    const { data: existing } = await admin
      .from('referral_codes')
      .select('code')
      .eq('user_id', user.id)
      .eq('is_universal', false)
      .single()

    if (existing) {
      return new Response(JSON.stringify({
        code: existing.code,
        url: `https://apexrevenue.works/join?ref=${existing.code}`
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    let code = ''
    for (let attempt = 0; attempt < 5; attempt++) {
      code = generateCode()
      const { error: insertError } = await admin
        .from('referral_codes')
        .insert({ user_id: user.id, code, is_universal: false })

      if (!insertError) break
      if (attempt === 4) throw new Error('Could not generate a unique referral code. Please try again.')
    }

    return new Response(JSON.stringify({
      code,
      url: `https://apexrevenue.works/join?ref=${code}`
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
