import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-user-token',
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
    let body: { access_token?: string } = {}
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

    // Check admin status
    const { data: profile } = await admin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.is_admin === true

    // ── Personal referral stats (all users) ──────────────────────────────
    const { data: personalCode } = await admin
      .from('referral_codes')
      .select('code, created_at')
      .eq('user_id', user.id)
      .eq('is_universal', false)
      .single()

    let personalReferrals: any[] = []
    if (personalCode) {
      const { data } = await admin
        .from('referrals')
        .select('referred_user_id, status, created_at')
        .eq('referral_code', personalCode.code)
        .order('created_at', { ascending: false })

      personalReferrals = data || []
    }

    const result: any = {
      personal: {
        code: personalCode?.code || null,
        totalReferrals: personalReferrals.length,
        activeReferrals: personalReferrals.filter(r => r.status === 'active').length,
        pendingReferrals: personalReferrals.filter(r => r.status === 'pending').length,
        referrals: personalReferrals.map(r => ({
          status: r.status,
          date: r.created_at
        }))
      }
    }

    // ── Admin stats (admin only) ─────────────────────────────────────────
    if (isAdmin) {
      const { data: universalCodes } = await admin
        .from('referral_codes')
        .select('code, label, created_at, is_universal')
        .eq('user_id', user.id)
        .eq('is_universal', true)
        .order('created_at', { ascending: false })

      const universalStats = []
      for (const uc of (universalCodes || [])) {
        const { data: refs } = await admin
          .from('referrals')
          .select('id, status, created_at')
          .eq('referral_code', uc.code)
          .order('created_at', { ascending: false })

        universalStats.push({
          code: uc.code,
          label: uc.label,
          created_at: uc.created_at,
          totalReferrals: (refs || []).length,
          activeReferrals: (refs || []).filter(r => r.status === 'active').length,
          referrals: (refs || []).map(r => ({
            status: r.status,
            date: r.created_at
          }))
        })
      }

      const { count: totalGlobalReferrals } = await admin
        .from('referrals')
        .select('id', { count: 'exact', head: true })

      const { count: totalUsers } = await admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })

      const { count: totalCodes } = await admin
        .from('referral_codes')
        .select('id', { count: 'exact', head: true })

      result.admin = {
        universalCodes: universalStats,
        globalStats: {
          totalReferrals: totalGlobalReferrals || 0,
          totalUsers: totalUsers || 0,
          totalCodes: totalCodes || 0
        }
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
