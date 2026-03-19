// Apex Revenue — notify-support-ticket Edge Function
// Triggered by Supabase Database Webhook on INSERT to "Support Tickets and Development Ideas"
// Sends an email notification to the admin using Resend (https://resend.com)
//
// Deploy:
//   supabase functions deploy notify-support-ticket
//
// Set secrets:
//   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
//   supabase secrets set NOTIFY_EMAIL=ridge.johnston@gmail.com
//
// Then wire up a Database Webhook in Supabase Dashboard:
//   Database → Webhooks → Create a new hook
//     Table:  Support Tickets and Development Ideas
//     Events: INSERT
//     URL:    https://<your-project-ref>.supabase.co/functions/v1/notify-support-ticket

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const NOTIFY_EMAIL   = Deno.env.get('NOTIFY_EMAIL')   ?? 'ridge.johnston@gmail.com';
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')   ?? '';
const SUPABASE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

Deno.serve(async (req) => {
  try {
    // Supabase Database Webhooks POST the row payload as JSON
    const body = await req.json();

    // The new row is in body.record (Database Webhook format)
    const ticket = body.record ?? body;

    const type      = ticket.type       ?? 'unknown';
    const email     = ticket.email      ?? '(not provided)';
    const message   = ticket.message    ?? '(no message)';
    const username  = ticket.username   ?? null;
    const userId    = ticket.user_id    ?? 'anonymous';
    const createdAt = ticket.created_at ?? new Date().toISOString();

    // Display name: registered username if available, otherwise UUID
    const displayUser = username ? username : userId;

    // ── Supabase Realtime payload (as requested) ──────────────────────────────
    const realtimeSnippet = `
const channels = supabase.channel('custom-update-channel')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'Support Tickets and Development Ideas' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()`;

    // ── Email body ────────────────────────────────────────────────────────────
    const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#f0eeff;padding:32px;border-radius:12px">
  <h2 style="margin:0 0 4px;color:#ff3f6c;font-size:18px">🎫 New Apex Revenue Ticket</h2>
  <p style="margin:0 0 24px;color:#6e6d85;font-size:13px">${new Date(createdAt).toUTCString()}</p>

  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <tr>
      <td style="padding:8px 12px;background:#111118;border:1px solid rgba(255,255,255,0.07);border-radius:6px 0 0 0;color:#6e6d85;font-size:11px;width:100px">Type</td>
      <td style="padding:8px 12px;background:#111118;border:1px solid rgba(255,255,255,0.07);border-top-right-radius:6px;font-size:13px;text-transform:capitalize">${type}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;background:#111118;border:1px solid rgba(255,255,255,0.07);color:#6e6d85;font-size:11px">Email</td>
      <td style="padding:8px 12px;background:#111118;border:1px solid rgba(255,255,255,0.07);font-size:13px;color:#ff3f6c">${email}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;background:#111118;border:1px solid rgba(255,255,255,0.07);color:#6e6d85;font-size:11px">Username</td>
      <td style="padding:8px 12px;background:#111118;border:1px solid rgba(255,255,255,0.07);font-size:13px;font-weight:600">${displayUser}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;background:#111118;border:1px solid rgba(255,255,255,0.07);color:#6e6d85;font-size:11px">User ID</td>
      <td style="padding:8px 12px;background:#111118;border:1px solid rgba(255,255,255,0.07);font-size:10px;color:#6e6d85;font-family:monospace">${userId}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;background:#111118;border:1px solid rgba(255,255,255,0.07);border-radius:0 0 0 6px;color:#6e6d85;font-size:11px;vertical-align:top">Message</td>
      <td style="padding:8px 12px;background:#111118;border:1px solid rgba(255,255,255,0.07);border-bottom-right-radius:6px;font-size:13px;line-height:1.6;white-space:pre-wrap">${message}</td>
    </tr>
  </table>

  <div style="background:#1a1a24;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:16px;margin-bottom:24px">
    <p style="margin:0 0 8px;color:#6e6d85;font-size:10px;letter-spacing:1px;text-transform:uppercase">Realtime Channel Snippet</p>
    <pre style="margin:0;color:#a855f7;font-size:11px;overflow-x:auto;white-space:pre-wrap">${realtimeSnippet.trim()}</pre>
  </div>

  <p style="margin:0;color:#6e6d85;font-size:11px;text-align:center">
    Apex Revenue · Creator Intelligence Engine
  </p>
</div>`;

    // ── Send via Resend ───────────────────────────────────────────────────────
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    'Apex Revenue <notifications@apexrevenue.works>',
        to:      [NOTIFY_EMAIL],
        subject: `[Apex] New ${type} ticket${email !== '(not provided)' ? ' from ' + email : ''}`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[notify-support-ticket] Resend error:', err);
      return new Response(JSON.stringify({ error: err }), { status: 500 });
    }

    console.log('[notify-support-ticket] Email sent for ticket:', ticket.id);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });

  } catch (e) {
    console.error('[notify-support-ticket] Unexpected error:', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
