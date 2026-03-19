// Apex Revenue — notify-ticket-comment Edge Function
// Triggered by Supabase Database Webhook on UPDATE to "Support Tickets and Development Ideas"
// Fires only when admin_comment changes, and only if the row has a submitter email.
// Sends an email to the submitter notifying them of the update.
//
// Deploy:
//   supabase functions deploy notify-ticket-comment
//
// Secrets (shared with notify-support-ticket — already set):
//   RESEND_API_KEY, NOTIFY_EMAIL
//
// Wire up a second Database Webhook in Supabase Dashboard:
//   Database → Webhooks → Create a new hook
//     Table:  Support Tickets and Development Ideas
//     Events: UPDATE
//     URL:    https://ylqpsjwdsgtqdeqetkbt.supabase.co/functions/v1/notify-ticket-comment

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL     = 'Apex Revenue <notifications@apexrevenue.works>';

// Supabase Realtime channel — for reference / dashboard monitoring
// const channels = supabase.channel('custom-update-channel')
//   .on(
//     'postgres_changes',
//     { event: 'UPDATE', schema: 'public', table: 'Support Tickets and Development Ideas' },
//     (payload) => {
//       console.log('Change received!', payload)
//     }
//   )
//   .subscribe()

Deno.serve(async (req) => {
  try {
    const body = await req.json();

    // Database Webhook format: { type: 'UPDATE', record: {...}, old_record: {...} }
    const record     = body.record     ?? body;
    const old_record = body.old_record ?? {};

    const newComment = (record.admin_comment     ?? '').trim();
    const oldComment = (old_record.admin_comment ?? '').trim();

    // Only send an email if admin_comment was actually added or changed
    if (!newComment || newComment === oldComment) {
      console.log('[notify-ticket-comment] No comment change — skipping.');
      return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200 });
    }

    const toEmail   = record.email    ?? null;
    const username  = record.username ?? record.user_id ?? 'there';
    const type      = record.type     ?? 'ticket';
    const message   = record.message  ?? '';
    const createdAt = record.created_at ?? new Date().toISOString();

    // No submitter email — nothing to send
    if (!toEmail) {
      console.log('[notify-ticket-comment] No submitter email on record — skipping.');
      return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200 });
    }

    const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#f0eeff;padding:32px;border-radius:12px">

  <h2 style="margin:0 0 4px;color:#ff3f6c;font-size:18px">💬 Update on your Apex Revenue ticket</h2>
  <p style="margin:0 0 24px;color:#6e6d85;font-size:13px">Hi ${username} — we've added a comment to your ${type} submission.</p>

  <div style="background:#1a1a24;border-left:3px solid #ff3f6c;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:24px">
    <p style="margin:0 0 6px;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6e6d85">Our response</p>
    <p style="margin:0;font-size:14px;line-height:1.7;white-space:pre-wrap">${newComment}</p>
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <tr>
      <td style="padding:8px 12px;background:#111118;border:1px solid rgba(255,255,255,0.07);border-radius:6px 0 0 0;color:#6e6d85;font-size:11px;width:110px">Your ticket</td>
      <td style="padding:8px 12px;background:#111118;border:1px solid rgba(255,255,255,0.07);border-top-right-radius:6px;font-size:11px;color:#6e6d85;text-transform:capitalize">${type} · ${new Date(createdAt).toDateString()}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;background:#111118;border:1px solid rgba(255,255,255,0.07);border-radius:0 0 0 6px;color:#6e6d85;font-size:11px;vertical-align:top">Your message</td>
      <td style="padding:8px 12px;background:#111118;border:1px solid rgba(255,255,255,0.07);border-bottom-right-radius:6px;font-size:12px;line-height:1.6;color:#a09fbf;white-space:pre-wrap">${message}</td>
    </tr>
  </table>

  <p style="margin:0 0 24px;color:#6e6d85;font-size:11px;line-height:1.6">
    If you have more to add, reply to this email or resubmit through the Help tab in your Apex Revenue extension.
  </p>

  <p style="margin:0;color:#6e6d85;font-size:11px;text-align:center;opacity:0.5">
    Apex Revenue · Creator Intelligence Engine · <a href="mailto:support@apexrevenue.works" style="color:#ff3f6c;text-decoration:none">support@apexrevenue.works</a>
  </p>
</div>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    FROM_EMAIL,
        to:      [toEmail],
        subject: `Re: your Apex Revenue ${type} — we left you a note`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[notify-ticket-comment] Resend error:', err);
      return new Response(JSON.stringify({ error: err }), { status: 500 });
    }

    console.log('[notify-ticket-comment] Reply sent to:', toEmail);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });

  } catch (e) {
    console.error('[notify-ticket-comment] Unexpected error:', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
