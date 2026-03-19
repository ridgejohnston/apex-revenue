// ── PostHog session recording ─────────────────────────────────────────────────
(function initPostHog() {
  if (typeof posthog === 'undefined') {
    console.warn('[ApexRevenue] PostHog bundle not loaded — session recording unavailable.');
    return;
  }
  posthog.init('phc_Megg3zY6SfJFPujxs2AjhxPkv3JqjYQnASxcASHNfGJ', {
    api_host: 'https://us.i.posthog.com',
    autocapture: false,
    session_recording: { maskAllInputs: false },
    loaded: function(ph) {
      ph.startSessionRecording();
      console.log('[ApexRevenue] Recording started:', ph.sessionRecordingStarted());
    }
  });
})();

// ── Messaging ─────────────────────────────────────────────────────────────────
function send(type, extra) {
  window.parent.postMessage(Object.assign({ source: 'apex-overlay', type: type }, extra || {}), '*');
}

// ── Logo ──────────────────────────────────────────────────────────────────────
document.getElementById('logo-img').src = chrome.runtime.getURL('icons/icon128.png');

// ── Close ─────────────────────────────────────────────────────────────────────
document.getElementById('btn-close').addEventListener('click', function() {
  send('CLOSE');
});

// ── Minimise ──────────────────────────────────────────────────────────────────
var minimised = false;
document.getElementById('btn-minimize').addEventListener('click', function() {
  minimised = !minimised;
  document.body.classList.toggle('minimised', minimised);
  document.getElementById('btn-minimize').textContent = minimised ? '+' : '–';
  send('MINIMISE', { minimised: minimised });
});

// ── Drag ──────────────────────────────────────────────────────────────────────
document.getElementById('drag-handle').addEventListener('mousedown', function(e) {
  if (e.target.classList.contains('ctrl-btn') || e.target.closest('.ctrl-btn')) return;
  e.preventDefault();
  send('DRAG_START', { mouseX: e.clientX, mouseY: e.clientY });
});

// ── Nav ───────────────────────────────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(function(item) {
  item.addEventListener('click', function() {
    document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
    item.classList.add('active');
    renderPage(item.getAttribute('data-page'));
  });
});

// ── Pages ─────────────────────────────────────────────────────────────────────
function renderPage(page) {
  var c = document.getElementById('overlay-content');
  if (!c) return;
  if (page === 'live') {
    c.innerHTML = getLivePage();
    initLiveCTA();
  }
  else if (page === 'fans') c.innerHTML = getFansPage();
  else if (page === 'help') { c.innerHTML = getHelpPage(); initHelp(); }
  else if (page === 'analytics') c.innerHTML = getAnalyticsPage();
  else if (page === 'settings') { c.innerHTML = getSettingsPage(); initSettings(); }
}

function initLiveCTA() {
  var ctaBtn = document.querySelector('.alert-cta');
  if (!ctaBtn) return;
  ctaBtn.addEventListener('click', function() {
    var promptCards = document.getElementById('prompt-cards');
    if (!promptCards) return;

    // Scroll the top prompt into view smoothly
    promptCards.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Pulse the top card with a purple glow
    var topCard = promptCards.querySelector('.prompt-card');
    if (!topCard) return;
    topCard.style.transition = 'box-shadow 0.15s ease, transform 0.15s ease';
    topCard.style.boxShadow = '0 0 0 2px #a855f7, 0 0 18px rgba(168,85,247,0.45)';
    topCard.style.transform = 'scale(1.025)';
    setTimeout(function() {
      topCard.style.boxShadow = '';
      topCard.style.transform = '';
    }, 1400);
  });
}

function getPlaceholder(icon, label, sub) {
  return '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:260px;gap:10px;padding:40px"><div style="font-size:36px;opacity:0.4">'+icon+'</div><div style="font-family:Syne,sans-serif;font-weight:800;font-size:16px;color:var(--muted)">'+label+'</div><div style="font-size:11px;color:var(--muted);opacity:0.6;text-align:center">'+sub+'</div></div>';
}

function getLivePage() { return `
<div class="alert-banner" id="alert-banner"><div class="alert-icon">🔥</div><div><div class="alert-label">High Tip Moment</div><div class="alert-text">3 whales in chat — launch a goal now</div></div><button class="alert-cta">Act Now</button></div>
<div class="stats-row">
  <div class="stat-card tips"><div class="stat-label">Earnings</div><div class="stat-value">$0<span>/hr</span></div><div class="stat-change"></div></div>
  <div class="stat-card viewers"><div class="stat-label">Viewers</div><div class="stat-value">1.2<span>k</span></div><div class="stat-change">↑ peak</div></div>
  <div class="stat-card conv"><div class="stat-label">Conv.</div><div class="stat-value">4.7<span>%</span></div><div class="stat-change">↑ 1.2%</div></div>
</div>
<div class="whale-section">
  <div class="section-hdr"><div class="section-ttl">🐋 Whale Tracker</div><span class="section-lnk">3 in room</span></div>
  <div class="whale-table">
    <div class="whale-thead"><div class="whale-th">Viewer</div><div class="whale-th" style="text-align:right">Tips</div><div class="whale-th c">In</div><div class="whale-th c">Out</div></div>
    <div class="whale-row"><div class="whale-id"><div class="av t1">🐋<div class="sd on"></div></div><div><div class="wname">BigSpender99</div><div class="wrank">#1 · Gold</div></div></div><div class="wtips">$248</div><div class="wc">4</div><div class="wc">3</div></div>
    <div class="whale-row"><div class="whale-id"><div class="av t2">💎<div class="sd on"></div></div><div><div class="wname">RichViewer42</div><div class="wrank">#2 · Silver</div></div></div><div class="wtips">$115</div><div class="wc">2</div><div class="wc">1</div></div>
    <div class="whale-row"><div class="whale-id"><div class="av t1">🔥<div class="sd on"></div></div><div><div class="wname">KingTipper</div><div class="wrank">#3 · Gold</div></div></div><div class="wtips">$90</div><div class="wc">3</div><div class="wc">2</div></div>
    <div class="whale-row left"><div class="whale-id"><div class="av t3">👑<div class="sd off"></div></div><div><div class="wname">CryptoWhale7</div><div class="wrank">Left 4m ago</div></div></div><div class="wtips">$55</div><div class="wc">1</div><div class="wc">1</div></div>
  </div>
  <div class="whale-footer"><span class="wftl">Session total</span><span class="wftv">$508</span></div>
</div>
<div class="divider"></div>
<div class="section">
  <div class="section-hdr"><div class="section-ttl">Monetization Prompts</div><span class="section-lnk">See all</span></div>
  <div id="prompt-cards"><div class="prompt-card hot"><div class="pe">💰</div><div><div class="pa">Announce exclusive 1-on-1 slot</div><div class="pm">Highest ROI • 3 buyers likely</div></div><div class="pv">+$80</div></div>
  <div class="prompt-card medium"><div class="pe">🎯</div><div><div class="pa">Drop tip menu reminder</div><div class="pm">Viewer attention spike</div></div><div class="pv">+$45</div></div>
  <div class="prompt-card"><div class="pe">✨</div><div><div class="pa">Engage lurkers with a poll</div><div class="pm">Converts passive → active</div></div><div class="pv">+$22</div></div></div>
</div>
<div class="divider"></div>
<div class="section">
  <div class="section-hdr"><div class="section-ttl">Viewer Engagement Heat</div></div>
  <div class="heat-wrap" id="heat-wrap">
    <div class="hlr"><span id="heat-label-low">Low activity</span><span id="heat-label-peak" style="color:var(--gold)">⚡ Watching…</span></div>
    <div class="hbars" id="heat-bars">
      <div class="hbar" style="height:30%;background:linear-gradient(to top,#2a2a3a,#3a3a50)"></div>
      <div class="hbar" style="height:40%;background:linear-gradient(to top,#2a2a3a,#4a3a60)"></div>
      <div class="hbar" style="height:55%;background:linear-gradient(to top,#3a2a4a,#7c4a9a)"></div>
      <div class="hbar" style="height:70%;background:linear-gradient(to top,#4a1a3a,#c0306e)"></div>
      <div class="hbar" style="height:85%;background:linear-gradient(to top,#5a1a2a,#e03060)"></div>
      <div class="hbar" style="height:100%;background:linear-gradient(to top,#6a0a20,#ff3f6c);box-shadow:0 0 10px rgba(255,63,108,0.5)"></div>
      <div class="hbar" style="height:90%;background:linear-gradient(to top,#5a1a2a,#e03060)"></div>
      <div class="hbar" style="height:75%;background:linear-gradient(to top,#4a1a3a,#c0306e)"></div>
      <div class="hbar" style="height:50%;background:linear-gradient(to top,#2a2a3a,#6a4a8a)"></div>
    </div>
    <div class="htime" id="heat-time"></div>
  </div>
</div>
<div class="section" style="padding-bottom:14px">
  <div class="section-hdr"><div class="section-ttl">AI Price Recommendation</div></div>
  <div class="pricing-card" id="pricing-card">
    <div class="pr-row">
      <div class="pr-item"><div class="pr-type">Current</div><div class="pr-amt cur" id="pr-current">—</div></div>
      <div class="pr-div"></div>
      <div class="pr-item"><div class="pr-type">Recommended</div><div class="pr-amt rec" id="pr-recommended">—</div></div>
      <div class="pr-div"></div>
      <div class="pr-item"><div class="pr-type">Max Tested</div><div class="pr-amt max" id="pr-max">—</div></div>
    </div>
    <div class="ai-box"><div class="ai-ic">🤖</div><div class="ai-tx" id="pr-insight">Analyzing your session…</div></div>
  </div>
</div>`; }

function getFansPage() { return `
<div class="fans-hdr">
  <div class="fans-tr">
    <div><div class="fans-title">Fan Leaderboard</div><div class="fans-sub" id="fans-sub-label">Ranked by session tips</div></div>
    <div style="text-align:right"><div class="fans-sv" id="fans-total">$0</div><div class="fans-sl" id="fans-total-label">Session tips</div></div>
  </div>
  <div class="fchips">
    <div class="fchip active" data-filter="all">All</div>
    <div class="fchip" data-filter="inroom">In Room</div>
    <div class="fchip" data-filter="top30">Top 30d</div>
    <div class="fchip" data-filter="new">New Viewers</div>
  </div>
</div>
<div class="fans-list" id="fans-list">
  <div class="fans-empty">Loading fan data…</div>
</div>`; }

function getHelpPage() { return `

<div class="hp-hdr">
  <div class="hp-title">Help & Support</div>
  <div class="hp-sub">Everything you need to maximize earnings</div>
</div>

<div class="hp-sec">
  <div class="hp-sec-lbl">Invite a Creator</div>
  <div class="hp-invite-card">
    <div class="hp-invite-header">
      <div class="hp-invite-ic">🎁</div>
      <div>
        <div class="hp-invite-ttl">Earn Together</div>
        <div class="hp-invite-tx">Invite another creator to Apex Revenue. Share your personal link via SMS or email.</div>
      </div>
    </div>
    <div class="hp-invite-link-row" id="hp-invite-top-link-row" style="display:none">
      <div class="hp-invite-link-box" id="hp-invite-top-link-text"></div>
      <button class="hp-invite-copy-btn" id="hp-invite-top-copy-btn">Copy</button>
    </div>
    <div class="hp-invite-actions" id="hp-invite-top-actions">
      <button class="hp-invite-btn hp-invite-btn-gen" id="hp-invite-top-gen-btn">
        <span>Get My Invite Link</span>
      </button>
    </div>
    <div class="hp-invite-share-row" id="hp-invite-top-share-row" style="display:none">
      <button class="hp-invite-share-btn hp-invite-sms" id="hp-invite-top-sms-btn">📱 Share via SMS</button>
      <button class="hp-invite-share-btn hp-invite-email" id="hp-invite-top-email-btn">✉️ Share via Email</button>
    </div>
    <div id="hp-referral-stats" style="margin-top:10px;display:none">
      <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;font-weight:600">Your Referrals</div>
      <div style="display:flex;gap:8px">
        <div style="flex:1;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px 10px;text-align:center">
          <div id="hp-ref-total" style="font-size:18px;font-weight:700;color:var(--text)">—</div>
          <div style="font-size:9px;color:var(--muted)">Total</div>
        </div>
        <div style="flex:1;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px 10px;text-align:center">
          <div id="hp-ref-active" style="font-size:18px;font-weight:700;color:var(--green,#22c55e)">—</div>
          <div style="font-size:9px;color:var(--muted)">Active</div>
        </div>
        <div style="flex:1;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px 10px;text-align:center">
          <div id="hp-ref-pending" style="font-size:18px;font-weight:700;color:var(--accent,#e83e8c)">—</div>
          <div style="font-size:9px;color:var(--muted)">Pending</div>
        </div>
      </div>
      <div id="hp-ref-recent" style="margin-top:8px"></div>
    </div>
  </div>
</div>

<div class="hp-divider"></div>

<div class="hp-sec">
  <div class="hp-sec-lbl">Live Session Stats</div>
  <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:6px">
    <div class="hp-stat-row">
      <div><div class="hp-stat-val" id="hp-viewers">—</div><div class="hp-stat-lbl">Viewers</div></div>
      <div><div class="hp-stat-val" id="hp-tippers">—</div><div class="hp-stat-lbl">Tippers</div></div>
      <div><div class="hp-stat-val" id="hp-whales">—</div><div class="hp-stat-lbl">Whales</div></div>
      <div><div class="hp-stat-val" id="hp-total">—</div><div class="hp-stat-lbl">Total tk</div></div>
    </div>
  </div>
</div>

<div class="hp-sec">
  <div class="hp-sec-lbl">Feature Guide</div>
  <div class="hp-card"><div class="hp-card-ic">⚡</div><div><div class="hp-card-ttl">Live Tab</div><div class="hp-card-tx">Real-time stats, whale tracker, AI monetization prompts, engagement heat map, and dynamic pricing recommendations — all updated as tips come in.</div></div></div>
  <div class="hp-card"><div class="hp-card-ic">📊</div><div><div class="hp-card-ttl">Analytics</div><div class="hp-card-tx">Session totals, conversion rate, avg tip size, tips/hr pace, and a ranked bar chart of your top tippers this session.</div></div></div>
  <div class="hp-card"><div class="hp-card-ic">💜</div><div><div class="hp-card-ttl">Fans</div><div class="hp-card-tx">Full fan leaderboard with In Room, Top 30d, and New filters. 30-day tip history persists across sessions automatically.</div></div></div>
  <div class="hp-card"><div class="hp-card-ic">⚙️</div><div><div class="hp-card-ttl">Settings</div><div class="hp-card-tx">Configure whale threshold, prompt frequency, overlay opacity, and manage your 30-day history data.</div></div></div>
</div>

<div class="hp-divider"></div>

<div class="hp-sec">
  <div class="hp-sec-lbl">Viewer Badge Legend</div>
  <div class="hp-badge-grid">
    <div class="hp-badge-item"><div class="hp-badge-em">🐋</div><div><div class="hp-badge-name">Whale</div><div class="hp-badge-desc">Tipped tons recently</div></div></div>
    <div class="hp-badge-item"><div class="hp-badge-em">🔥</div><div><div class="hp-badge-name">Hot Tipper</div><div class="hp-badge-desc">Tipped a lot recently</div></div></div>
    <div class="hp-badge-item"><div class="hp-badge-em">💎</div><div><div class="hp-badge-name">Has Tokens</div><div class="hp-badge-desc">Token balance present</div></div></div>
    <div class="hp-badge-item"><div class="hp-badge-em">🥇</div><div><div class="hp-badge-name">Top Tipper</div><div class="hp-badge-desc">#1 this session</div></div></div>
    <div class="hp-badge-item"><div class="hp-badge-em">🔁</div><div><div class="hp-badge-name">Loyal</div><div class="hp-badge-desc">Joined 3+ times</div></div></div>
    <div class="hp-badge-item"><div class="hp-badge-em">↩</div><div><div class="hp-badge-name">Left Room</div><div class="hp-badge-desc">No longer present</div></div></div>
  </div>
</div>

<div class="hp-divider"></div>

<div class="hp-contact">
  <div class="hp-contact-ic">💬</div>
  <div>
    <div class="hp-contact-ttl">Need help or have feedback?</div>
    <div class="hp-contact-tx">Email us at <span class="hp-contact-email">support@apexrevenue.works</span></div>
  </div>
</div>

<div class="hp-sec">
  <div class="hp-sec-lbl">Send Us a Message</div>
  <div class="hp-form-card">
    <select class="hp-form-select" id="hp-form-type">
      <option value="bug">🐛 Bug Report</option>
      <option value="feature">💡 Feature Idea</option>
      <option value="general">💬 General Feedback</option>
    </select>
    <textarea class="hp-form-textarea" id="hp-form-msg" placeholder="Describe the issue or idea…" rows="4"></textarea>
    <div class="hp-form-footer">
      <div class="hp-form-status" id="hp-form-status"></div>
      <button class="hp-form-submit" id="hp-form-submit-btn">Send</button>
    </div>
  </div>
</div>

<div class="hp-divider"></div>

<div class="hp-sec">
  <div class="hp-sec-lbl">Invite a Creator</div>
  <div class="hp-invite-card">
    <div class="hp-invite-header">
      <div class="hp-invite-ic">🎁</div>
      <div>
        <div class="hp-invite-ttl">Earn Together</div>
        <div class="hp-invite-tx">Invite another creator to Apex Revenue. Share your personal link via SMS or email.</div>
      </div>
    </div>
    <div class="hp-invite-link-row" id="hp-invite-link-row" style="display:none">
      <div class="hp-invite-link-box" id="hp-invite-link-text"></div>
      <button class="hp-invite-copy-btn" id="hp-invite-copy-btn">Copy</button>
    </div>
    <div class="hp-invite-actions" id="hp-invite-actions">
      <button class="hp-invite-btn hp-invite-btn-gen" id="hp-invite-gen-btn">
        <span>Get My Invite Link</span>
      </button>
    </div>
    <div class="hp-invite-share-row" id="hp-invite-share-row" style="display:none">
      <button class="hp-invite-share-btn hp-invite-sms" id="hp-invite-sms-btn">📱 Share via SMS</button>
      <button class="hp-invite-share-btn hp-invite-email" id="hp-invite-email-btn">✉️ Share via Email</button>
    </div>
  </div>
</div>

<div id="hp-admin-invite-section" style="display:none">
  <div class="hp-divider"></div>
  <div class="hp-sec">
    <div class="hp-sec-lbl">Admin: Universal Invite Links</div>
    <div class="hp-invite-card" style="border-color:rgba(124,92,252,.3)">
      <div class="hp-invite-header">
        <div class="hp-invite-ic">👑</div>
        <div>
          <div class="hp-invite-ttl">Universal Referral Link</div>
          <div class="hp-invite-tx">Generate shareable invite links not tied to any user. Use for campaigns, social posts, or mass outreach.</div>
        </div>
      </div>
      <input class="hp-form-textarea" id="hp-admin-invite-label" placeholder="Label (optional) e.g. Twitter Campaign March" style="min-height:0;height:32px;margin-bottom:8px;font-size:11px;padding:6px 10px;resize:none">
      <div class="hp-invite-link-row" id="hp-admin-invite-link-row" style="display:none">
        <div class="hp-invite-link-box" id="hp-admin-invite-link-text"></div>
        <button class="hp-invite-copy-btn" id="hp-admin-invite-copy-btn">Copy</button>
      </div>
      <div class="hp-invite-actions" id="hp-admin-invite-actions">
        <button class="hp-invite-btn hp-invite-btn-gen" id="hp-admin-invite-gen-btn" style="background:linear-gradient(135deg,#7c5cfc,#5b3fd9)">
          <span>Generate Universal Link</span>
        </button>
      </div>
      <div class="hp-invite-share-row" id="hp-admin-invite-share-row" style="display:none">
        <button class="hp-invite-share-btn hp-invite-sms" id="hp-admin-invite-sms-btn">📱 SMS</button>
        <button class="hp-invite-share-btn hp-invite-email" id="hp-admin-invite-email-btn">✉️ Email</button>
      </div>
      <div id="hp-admin-invite-history" style="margin-top:8px"></div>
    </div>
    <div id="hp-admin-stats" style="margin-top:12px">
      <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;font-weight:600">Global Overview</div>
      <div style="display:flex;gap:8px;margin-bottom:10px">
        <div style="flex:1;background:var(--surface);border:1px solid rgba(124,92,252,.2);border-radius:8px;padding:8px 10px;text-align:center">
          <div id="hp-admin-total-users" style="font-size:18px;font-weight:700;color:#7c5cfc">—</div>
          <div style="font-size:9px;color:var(--muted)">Users</div>
        </div>
        <div style="flex:1;background:var(--surface);border:1px solid rgba(124,92,252,.2);border-radius:8px;padding:8px 10px;text-align:center">
          <div id="hp-admin-total-referrals" style="font-size:18px;font-weight:700;color:#7c5cfc">—</div>
          <div style="font-size:9px;color:var(--muted)">Referrals</div>
        </div>
        <div style="flex:1;background:var(--surface);border:1px solid rgba(124,92,252,.2);border-radius:8px;padding:8px 10px;text-align:center">
          <div id="hp-admin-total-codes" style="font-size:18px;font-weight:700;color:#7c5cfc">—</div>
          <div style="font-size:9px;color:var(--muted)">Codes</div>
        </div>
      </div>
      <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;font-weight:600">Universal Code Performance</div>
      <div id="hp-admin-code-list" style="font-size:11px"></div>
    </div>
  </div>
</div>

<div class="hp-ver">Apex Revenue v0.6.1 · Creator Intelligence Engine</div>`; }

function updateHelp(data) {
  if (currentPage !== 'help') return;
  var viewers  = data.viewers  || 0;
  var fans     = data.fans     || [];
  var whales   = data.whales   || [];
  var tippers  = fans.filter(function(f){ return f.tips > 0; });
  var total    = data.totalTips || 0;
  function set(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }
  set('hp-viewers',  viewers);
  set('hp-tippers',  tippers.length);
  set('hp-whales',   whales.filter(function(w){ return w.present !== false; }).length);
  set('hp-total',    total > 0 ? total : '—');
}

// ── Referral / Invite ─────────────────────────────────────────────────────────

var _apexInviteUrl = null;

function initHelp() {
  // Top invite section
  var topGen   = document.getElementById('hp-invite-top-gen-btn');
  var topCopy  = document.getElementById('hp-invite-top-copy-btn');
  var topSms   = document.getElementById('hp-invite-top-sms-btn');
  var topEmail = document.getElementById('hp-invite-top-email-btn');
  if (topGen)   topGen.addEventListener('click',   apexGetInviteLink);
  if (topCopy)  topCopy.addEventListener('click',  apexCopyInviteLink);
  if (topSms)   topSms.addEventListener('click',   apexShareInviteSMS);
  if (topEmail) topEmail.addEventListener('click', apexShareInviteEmail);

  // Bottom invite section
  var botGen   = document.getElementById('hp-invite-gen-btn');
  var botCopy  = document.getElementById('hp-invite-copy-btn');
  var botSms   = document.getElementById('hp-invite-sms-btn');
  var botEmail = document.getElementById('hp-invite-email-btn');
  if (botGen)   botGen.addEventListener('click',   apexGetInviteLink);
  if (botCopy)  botCopy.addEventListener('click',  apexCopyInviteLink);
  if (botSms)   botSms.addEventListener('click',   apexShareInviteSMS);
  if (botEmail) botEmail.addEventListener('click', apexShareInviteEmail);

  // Support form
  var submitBtn = document.getElementById('hp-form-submit-btn');
  if (submitBtn) submitBtn.addEventListener('click', apexSubmitSupportForm);

  // If a link was already generated this session, restore it
  if (_apexInviteUrl) apexShowInviteLink(_apexInviteUrl);

  // Admin universal invite section — only show for admins
  chrome.storage.local.get([APEX_ADMIN_KEY], function(r) {
    if (r[APEX_ADMIN_KEY] === true) {
      var adminSection = document.getElementById('hp-admin-invite-section');
      if (adminSection) adminSection.style.display = 'block';

      var adminGen   = document.getElementById('hp-admin-invite-gen-btn');
      var adminCopy  = document.getElementById('hp-admin-invite-copy-btn');
      var adminSms   = document.getElementById('hp-admin-invite-sms-btn');
      var adminEmail = document.getElementById('hp-admin-invite-email-btn');
      if (adminGen)   adminGen.addEventListener('click',   apexGetUniversalInviteLink);
      if (adminCopy)  adminCopy.addEventListener('click',  apexCopyAdminInviteLink);
      if (adminSms)   adminSms.addEventListener('click',   apexShareAdminInviteSMS);
      if (adminEmail) adminEmail.addEventListener('click',  apexShareAdminInviteEmail);
    }
  });

  // Fetch referral stats on page load
  apexLoadReferralStats();
}

// ── Referral stats loader ────────────────────────────────────────────────────

async function apexLoadReferralStats() {
  try {
    var session = await apexGetSession();
    if (!session || !session.access_token) return;
    var refreshed = await apexRefreshSession();
    var token = (refreshed && refreshed.access_token) || session.access_token;
    var data = await apexEdgeFetch('/functions/v1/referral-stats', { access_token: token });

    // Personal stats
    if (data.personal && data.personal.code) {
      var statsEl = document.getElementById('hp-referral-stats');
      if (statsEl) statsEl.style.display = 'block';

      var totalEl   = document.getElementById('hp-ref-total');
      var activeEl  = document.getElementById('hp-ref-active');
      var pendingEl = document.getElementById('hp-ref-pending');
      if (totalEl)   totalEl.textContent   = data.personal.totalReferrals;
      if (activeEl)  activeEl.textContent  = data.personal.activeReferrals;
      if (pendingEl) pendingEl.textContent = data.personal.pendingReferrals;

      // Show recent referrals list
      var recentEl = document.getElementById('hp-ref-recent');
      if (recentEl && data.personal.referrals.length > 0) {
        var html = '<div style="font-size:10px;color:var(--muted);margin-top:6px;margin-bottom:4px;font-weight:600">Recent</div>';
        data.personal.referrals.slice(0, 5).forEach(function(r) {
          var date = new Date(r.date).toLocaleDateString();
          var statusColor = r.status === 'active' ? 'var(--green,#22c55e)' : 'var(--accent,#e83e8c)';
          var statusDot = '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:' + statusColor + ';margin-right:6px"></span>';
          html += '<div style="font-size:11px;color:var(--text);padding:4px 0;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">';
          html += '<span>' + statusDot + r.status + '</span>';
          html += '<span style="color:var(--muted);font-size:10px">' + date + '</span>';
          html += '</div>';
        });
        recentEl.innerHTML = html;
      }
    }

    // Admin stats
    if (data.admin) {
      var totalUsersEl    = document.getElementById('hp-admin-total-users');
      var totalRefsEl     = document.getElementById('hp-admin-total-referrals');
      var totalCodesEl    = document.getElementById('hp-admin-total-codes');
      if (totalUsersEl) totalUsersEl.textContent = data.admin.globalStats.totalUsers;
      if (totalRefsEl)  totalRefsEl.textContent  = data.admin.globalStats.totalReferrals;
      if (totalCodesEl) totalCodesEl.textContent = data.admin.globalStats.totalCodes;

      // Universal code performance list
      var codeListEl = document.getElementById('hp-admin-code-list');
      if (codeListEl && data.admin.universalCodes.length > 0) {
        var html = '';
        data.admin.universalCodes.forEach(function(uc) {
          var label = uc.label ? '<span style="color:var(--text);font-weight:600">' + uc.label + '</span>' : '<span style="color:var(--muted);font-style:italic">No label</span>';
          var date = new Date(uc.created_at).toLocaleDateString();
          html += '<div style="background:var(--surface);border:1px solid rgba(124,92,252,.15);border-radius:8px;padding:8px 10px;margin-bottom:6px">';
          html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">';
          html += label;
          html += '<span style="font-size:9px;color:var(--muted)">' + date + '</span>';
          html += '</div>';
          html += '<div style="font-family:monospace;font-size:10px;color:#7c5cfc;margin-bottom:4px">' + uc.code + '</div>';
          html += '<div style="display:flex;gap:12px;font-size:10px;color:var(--muted)">';
          html += '<span><strong style="color:var(--text)">' + uc.totalReferrals + '</strong> signups</span>';
          html += '<span><strong style="color:var(--green,#22c55e)">' + uc.activeReferrals + '</strong> active</span>';
          html += '</div>';
          html += '</div>';
        });
        codeListEl.innerHTML = html;
      } else if (codeListEl) {
        codeListEl.innerHTML = '<div style="color:var(--muted);font-size:11px;font-style:italic;padding:6px 0">No universal codes generated yet</div>';
      }
    }
  } catch(e) {
    console.log('[ApexReferral] Could not load referral stats:', e.message);
  }
}

// ── Edge Function fetch helper ──────────────────────────────────────────────
// Uses the anon key for gateway auth and passes the user token in the body.
// This avoids 401s from the Supabase Edge Function gateway when the user JWT
// format doesn't match what the gateway expects.
async function apexEdgeFetch(path, bodyObj) {
  var url = APEX_SUPABASE_URL + path;
  console.log('[ApexEdge] fetch ->', url);
  var res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': APEX_SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + APEX_SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bodyObj || {})
  });
  var text = await res.text();
  var data = {};
  try { data = text ? JSON.parse(text) : {}; } catch(e) { data = { raw: text }; }
  console.log('[ApexEdge] response', res.status, data);
  if (!res.ok) {
    var msg = data.error || data.message || data.msg || ('HTTP ' + res.status);
    throw new Error(msg);
  }
  return data;
}

async function apexGetInviteLink() {
  var btns = ['hp-invite-top-gen-btn', 'hp-invite-gen-btn'].map(function(id) {
    return document.getElementById(id);
  }).filter(Boolean);
  btns.forEach(function(b) { b.disabled = true; b.querySelector('span').textContent = 'Generating…'; });
  try {
    // Force a fresh token before calling the Edge Function
    var session = await apexGetSession();
    if (!session || !session.refresh_token) {
      throw new Error('Session expired. Please sign out and sign back in.');
    }
    var refreshed = await apexRefreshSession();
    if (!refreshed || !refreshed.access_token) {
      throw new Error('Session expired. Please sign out and sign back in.');
    }
    var data = await apexEdgeFetch('/functions/v1/invite-link', { access_token: refreshed.access_token });
    _apexInviteUrl = data.url || ('https://apexrevenue.works/join?ref=' + data.code);
    apexShowInviteLink(_apexInviteUrl);
  } catch(e) {
    btns.forEach(function(b) { b.disabled = false; b.querySelector('span').textContent = 'Get My Invite Link'; });
    ['hp-invite-top-actions', 'hp-invite-actions'].forEach(function(id) {
      var actionsEl = document.getElementById(id);
      if (actionsEl) {
        var errEl = actionsEl.querySelector('.hp-invite-err');
        if (!errEl) { errEl = document.createElement('div'); errEl.className = 'hp-invite-err'; actionsEl.appendChild(errEl); }
        errEl.textContent = e.message || 'Could not generate link — try again.';
      }
    });
  }
}

function apexShowInviteLink(url) {
  // Update both top and bottom invite sections
  [
    { link: 'hp-invite-top-link-row', text: 'hp-invite-top-link-text', share: 'hp-invite-top-share-row', actions: 'hp-invite-top-actions' },
    { link: 'hp-invite-link-row',     text: 'hp-invite-link-text',     share: 'hp-invite-share-row',     actions: 'hp-invite-actions'     }
  ].forEach(function(ids) {
    var linkRow   = document.getElementById(ids.link);
    var linkText  = document.getElementById(ids.text);
    var shareRow  = document.getElementById(ids.share);
    var actionsEl = document.getElementById(ids.actions);
    if (linkText)  linkText.textContent   = url;
    if (linkRow)   linkRow.style.display  = 'flex';
    if (shareRow)  shareRow.style.display = 'flex';
    if (actionsEl) actionsEl.style.display = 'none';
  });
}

async function apexSubmitSupportForm() {
  var typeEl    = document.getElementById('hp-form-type');
  var msgEl     = document.getElementById('hp-form-msg');
  var statusEl  = document.getElementById('hp-form-status');
  var submitBtn = document.getElementById('hp-form-submit-btn');
  var msg  = msgEl  ? msgEl.value.trim() : '';
  var type = typeEl ? typeEl.options[typeEl.selectedIndex].text : 'General Feedback';
  if (!msg) {
    if (statusEl) { statusEl.textContent = 'Please enter a message.'; statusEl.style.color = 'var(--accent)'; }
    return;
  }
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }
  if (statusEl)  { statusEl.textContent = ''; }
  try {
    await apexFetch('/functions/v1/submit-support', {
      method: 'POST',
      body: JSON.stringify({ type: type, message: msg })
    });
    if (msgEl)    msgEl.value = '';
    if (statusEl) { statusEl.textContent = 'Message sent!'; statusEl.style.color = 'var(--green)'; }
    setTimeout(function() { if (statusEl) statusEl.textContent = ''; }, 3000);
  } catch(e) {
    if (statusEl) { statusEl.textContent = e.message || 'Failed to send — try again.'; statusEl.style.color = 'var(--accent)'; }
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send'; }
  }
}

// ── Admin universal invite link ──────────────────────────────────────────────

var _apexAdminInviteUrl = null;

async function apexGetUniversalInviteLink() {
  var btn = document.getElementById('hp-admin-invite-gen-btn');
  if (btn) { btn.disabled = true; btn.querySelector('span').textContent = 'Generating…'; }
  try {
    var session = await apexGetSession();
    console.log('[ApexInvite] session before refresh:', session ? 'exists' : 'null', session ? { hasToken: !!session.access_token, hasRefresh: !!session.refresh_token } : '');
    if (!session || !session.refresh_token) {
      throw new Error('Session expired. Please sign out and sign back in.');
    }
    var refreshed = await apexRefreshSession();
    console.log('[ApexInvite] refreshed session:', refreshed ? { hasToken: !!refreshed.access_token, exp: refreshed.expires_at } : 'FAILED');
    // Re-read session after refresh to ensure we have the latest
    session = await apexGetSession();
    console.log('[ApexInvite] stored session after refresh:', session ? { hasToken: !!session.access_token, tokenStart: session.access_token ? session.access_token.substring(0, 20) + '...' : 'none' } : 'NULL');
    if (!session || !session.access_token) {
      throw new Error('Session expired. Please sign out and sign back in.');
    }
    var labelEl = document.getElementById('hp-admin-invite-label');
    var label = labelEl ? labelEl.value.trim() : '';
    var data = await apexEdgeFetch('/functions/v1/invite-link', {
      access_token: session.access_token,
      universal: true,
      label: label || undefined
    });
    _apexAdminInviteUrl = data.url || ('https://apexrevenue.works/join?ref=' + data.code);
    // Show the link
    var linkRow  = document.getElementById('hp-admin-invite-link-row');
    var linkText = document.getElementById('hp-admin-invite-link-text');
    var shareRow = document.getElementById('hp-admin-invite-share-row');
    var actions  = document.getElementById('hp-admin-invite-actions');
    if (linkText) linkText.textContent  = _apexAdminInviteUrl;
    if (linkRow)  linkRow.style.display = 'flex';
    if (shareRow) shareRow.style.display = 'flex';
    if (actions)  actions.style.display  = 'none';
    // Clear label for next generation
    if (labelEl) labelEl.value = '';
  } catch(e) {
    if (btn) { btn.disabled = false; btn.querySelector('span').textContent = 'Generate Universal Link'; }
    var actions = document.getElementById('hp-admin-invite-actions');
    if (actions) {
      var errEl = actions.querySelector('.hp-invite-err');
      if (!errEl) { errEl = document.createElement('div'); errEl.className = 'hp-invite-err'; actions.appendChild(errEl); }
      errEl.textContent = e.message || 'Could not generate link — try again.';
    }
  }
}

function apexCopyAdminInviteLink() {
  if (!_apexAdminInviteUrl) return;
  navigator.clipboard.writeText(_apexAdminInviteUrl).then(function() {
    var btn = document.getElementById('hp-admin-invite-copy-btn');
    if (btn) { btn.textContent = 'Copied!'; setTimeout(function(){ btn.textContent = 'Copy'; }, 2000); }
  }).catch(function() {});
}

function apexShareAdminInviteSMS() {
  if (!_apexAdminInviteUrl) return;
  var msg = encodeURIComponent('Join Apex Revenue — real-time earnings tracking, whale alerts, and AI-powered tip prompts for streamers: ' + _apexAdminInviteUrl);
  window.open('sms:?body=' + msg);
}

function apexShareAdminInviteEmail() {
  if (!_apexAdminInviteUrl) return;
  var subject = encodeURIComponent('Join Apex Revenue');
  var body = encodeURIComponent('Hey!\n\nCheck out Apex Revenue — real-time engagement analytics, AI monetization prompts, and fan leaderboards for live streamers.\n\nSign up here:\n' + _apexAdminInviteUrl + '\n\nSee you there!');
  window.open('mailto:?subject=' + subject + '&body=' + body);
}

// ── Personal invite link ────────────────────────────────────────────────────

function apexCopyInviteLink() {
  if (!_apexInviteUrl) return;
  navigator.clipboard.writeText(_apexInviteUrl).then(function() {
    var btn = document.getElementById('hp-invite-copy-btn');
    if (btn) { btn.textContent = 'Copied!'; setTimeout(function(){ btn.textContent = 'Copy'; }, 2000); }
  }).catch(function() {});
}

function apexShareInviteSMS() {
  if (!_apexInviteUrl) return;
  var msg = encodeURIComponent('Hey! I use Apex Revenue to boost my streaming earnings — real-time engagement tracking, AI prompts, and fan analytics. Join with my link: ' + _apexInviteUrl);
  window.open('sms:?body=' + msg);
}

function apexShareInviteEmail() {
  if (!_apexInviteUrl) return;
  var subject = encodeURIComponent('Join me on Apex Revenue');
  var body = encodeURIComponent('Hey!\n\nI\'ve been using Apex Revenue to boost my streaming earnings — real-time engagement tracking, AI monetization prompts, and fan analytics.\n\nJoin with my invite link:\n' + _apexInviteUrl + '\n\nSee you there!');
  window.open('mailto:?subject=' + subject + '&body=' + body);
}

// Boot
renderPage('live');

// ── Live data updates from content.js ────────────────────────────────────────
var currentPage = 'live';
var lastData = null;

// Track nav changes so we know which page is active
document.querySelectorAll('.nav-item').forEach(function(item) {
  item.addEventListener('click', function() {
    currentPage = item.getAttribute('data-page');
  });
});

// ── Token → USD conversion (streamer rate: 1 tk = $0.05) ────────────────────
function tkUsd(tokens) {
  var usd = (tokens || 0) * 0.05;
  return '$' + (usd >= 10 ? Math.round(usd) : usd.toFixed(2));
}

window.addEventListener('message', function(e) {
  if (!e.data || e.data.source !== 'apex-popout') return;
  if (e.data.type === 'LIVE_UPDATE') {
    applyLiveData(e.data.data);
  } else if (e.data.type === 'START_RECORDING') {
    if (typeof posthog !== 'undefined') posthog.startSessionRecording();
  } else if (e.data.type === 'STOP_RECORDING') {
    if (typeof posthog !== 'undefined') posthog.stopSessionRecording();
  }
});

// Boot order: (1) verify Supabase auth → (2) resolve username → (3) load data
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.local.get(['apexCurrentUser'], function(boot) {
    storageUsername = boot.apexCurrentUser || '';
    verifyOverlayAuth(loadApexData);
  });
}

function applyLiveData(data) {
  if (!data) return;
  lastData = data;
  // Update storage namespace when broadcaster username arrives
  if (data.username && data.username !== storageUsername) {
    storageUsername = data.username;
  }

  // ── Stats row ───────────────────────────────────────────────────────────────
  var tipsEl = document.querySelector('.stat-card.tips .stat-value');
  if (tipsEl) tipsEl.innerHTML = tkUsd(data.tokensPerHour) + '<span>/hr</span>';

  var viewEl = document.querySelector('.stat-card.viewers .stat-value');
  if (viewEl) {
    var v = data.viewers || 0;
    viewEl.innerHTML = v >= 1000 ? (v/1000).toFixed(1) + '<span>k</span>' : v + '<span></span>';
  }

  var convEl = document.querySelector('.stat-card.conv .stat-value');
  if (convEl) convEl.innerHTML = (data.convRate || 0) + '<span>%</span>';

  // ── Whale tracker ───────────────────────────────────────────────────────────
  var whaleTable = document.querySelector('.whale-table');
  if (whaleTable) {
    var tierEmoji = ['👑','🐋','🔥','💎','👤'];
    var tierClass = ['t1','t1','t1','t2','t3'];
    var whales    = (data.whales && data.whales.length > 0) ? data.whales : (data.fans || []);
    var theadHTML = '<div class="whale-thead"><div class="whale-th">Viewer</div><div class="whale-th" style="text-align:right">Tips</div><div class="whale-th c">In</div><div class="whale-th c">Out</div></div>';

    var rowsHTML = whales.slice(0, 5).map(function(w, i) {
      var t = Math.min(w.tier !== undefined ? w.tier : 4, 4);
      var present = w.present !== false;
      var tipLabel = w.tips > 0 ? ('$' + w.tips) : (t===1?'Whale':t===2?'Hot':t===3?'Tokens':'Viewer');
      return '<div class="whale-row' + (present ? '' : ' left') + '">' +
        '<div class="whale-id"><div class="av ' + tierClass[t] + '">' + tierEmoji[t] +
        '<div class="sd ' + (present ? 'on' : 'off') + '"></div></div>' +
        '<div><div class="wname">' + w.username + '</div>' +
        '<div class="wrank">#' + (i+1) + ' · ' + (t===1?'Whale':t===2?'Hot':t===3?'Has Tokens':'Viewer') + '</div></div></div>' +
        '<div class="wtips">' + tipLabel + '</div>' +
        '<div class="wc">' + (w.joins || 0) + '</div>' +
        '<div class="wc">' + (w.leaves || 0) + '</div></div>';
    }).join('');

    if (rowsHTML === '') rowsHTML = '<div style="padding:12px;text-align:center;font-size:10px;color:var(--muted)">Watching for tippers…</div>';

    // Set all at once — no detached node issue
    whaleTable.innerHTML = theadHTML + rowsHTML;

    var footer = document.querySelector('.whale-footer .wftv');
    if (footer) footer.textContent = tkUsd(data.totalTips);

    var lnk = document.querySelector('.section-lnk');
    if (lnk) lnk.textContent = (data.whales ? data.whales.length : 0) + ' active';
  }

  // ── Prompts & heat map ───────────────────────────────────────────────────────
  if (currentPage === 'live') {
    updatePrompts(data);
    updateHeatMap(data);
    updatePricing(data);
  }
  if (currentPage === 'analytics') updateAnalytics(data);
  if (currentPage === 'fans') updateFans(data);
  if (currentPage === 'help')  updateHelp(data);
}


// ── Monetization prompt engine ────────────────────────────────────────────────
function updatePrompts(data) {
  const banner    = document.getElementById('alert-banner');
  const promptSec = document.getElementById('prompt-cards');
  if (!banner || !promptSec) return;

  const now        = Date.now();
  const whales     = data.whales     || [];
  const fans       = data.fans       || [];
  const viewers    = data.viewers    || 0;
  const totalTips  = data.totalTips  || 0;
  const tph        = data.tokensPerHour || 0;
  const convRate   = parseFloat(data.convRate) || 0;
  const tipEvents  = data.tipEvents  || [];
  const startTime  = data.startTime  || (now - 10 * 60000);
  const sessionMin = (now - startTime) / 60000;

  const activeWhales = whales.filter(w => w.present !== false);
  const tippers      = fans.filter(f => f.tips > 0);
  const lurkers      = Math.max(0, viewers - tippers.length);

  // ── Behavioral signals ────────────────────────────────────────────────────
  // Velocity: token volume in last 5 min vs prior 5–15 min window (normalised)
  const tips5m     = tipEvents.filter(e => now - e.timestamp < 5 * 60000);
  const tips5_15m  = tipEvents.filter(e => { const a = now - e.timestamp; return a >= 5*60000 && a < 15*60000; });
  const vol5m      = tips5m.reduce((s, e) => s + e.amount, 0);
  const vol5_15m   = tips5_15m.reduce((s, e) => s + e.amount, 0) / 2; // normalise to same window size
  const accelerating = vol5m > vol5_15m * 1.25 && vol5m > 0;
  const decelerating = vol5_15m > 0 && vol5m < vol5_15m * 0.55;

  // Burst: 2+ tip events in last 90 seconds
  const burst = tipEvents.filter(e => now - e.timestamp < 90000).length >= 2;

  // Whale recency: last tip timestamp per user
  const whaleLast = {};
  tipEvents.forEach(e => { if (!whaleLast[e.username] || e.timestamp > whaleLast[e.username]) whaleLast[e.username] = e.timestamp; });

  // Quiet whales: present but no tip in last 5 min (and they have tipped this session)
  const quietWhales    = activeWhales.filter(w => whaleLast[w.username] && (now - whaleLast[w.username]) > 5*60000);
  // Returning whales: joined more than once (left and came back)
  const returningWhales = activeWhales.filter(w => (w.joins || 0) > 1);

  // ── Session phase ─────────────────────────────────────────────────────────
  // warming  → early session or very low activity  → bias toward whale acquisition
  // building → growing momentum                    → balanced
  // peak     → high rate, burst, strong conv       → bias toward broad audience conversion
  // cooling  → declining velocity, whales quieting → bias toward whale re-engagement
  let phase;
  if (sessionMin < 10 || (tph < 30 && totalTips < 40)) {
    phase = 'warming';
  } else if (decelerating && tph < 90) {
    phase = 'cooling';
  } else if (tph > 120 || (burst && convRate > 3)) {
    phase = 'peak';
  } else {
    phase = 'building';
  }

  // Phase multipliers: prompts scored differently depending on phase
  const pw = {
    warming:  { whale: 1.5, audience: 0.65 },
    building: { whale: 1.0, audience: 1.0  },
    peak:     { whale: 0.75, audience: 1.5 },
    cooling:  { whale: 1.6, audience: 0.5  },
  }[phase];

  const phaseLabel = { warming:'🌅 Warming Up', building:'📈 Building', peak:'🔥 Peak', cooling:'📉 Cooling' }[phase];

  // Inject phase badge into section header
  const phaseLnk = document.querySelector('.section-lnk');
  if (phaseLnk) phaseLnk.textContent = phaseLabel;

  // ── Alert banner ──────────────────────────────────────────────────────────
  let alertIcon = '💡', alertLabel = 'Tip', alertText = 'Watching your room…', alertCTA = null;

  if (burst && phase === 'peak') {
    alertIcon = '🚀'; alertLabel = 'Tip Burst';
    alertText = 'Multiple tips in 90 seconds — peak momentum, act immediately';
    alertCTA = 'Act Now';
  } else if (quietWhales.length >= 1 && phase === 'cooling') {
    alertIcon = '🔔'; alertLabel = 'Whale Gone Quiet';
    alertText = quietWhales[0].username + ' has been silent 5+ min — re-engage before they leave';
    alertCTA = 'Re-engage';
  } else if (activeWhales.length >= 3) {
    alertIcon = '🔥'; alertLabel = 'Hot Moment';
    alertText = activeWhales.length + ' whales in room — launch a goal or special offer now';
    alertCTA = 'Act Now';
  } else if (returningWhales.length >= 1) {
    alertIcon = '👋'; alertLabel = 'Whale Returned';
    alertText = returningWhales[0].username + ' came back — returning whales tip significantly more';
    alertCTA = 'Engage';
  } else if (activeWhales.length === 2) {
    alertIcon = '🐋'; alertLabel = 'Whales Present';
    alertText = activeWhales.slice(0,2).map(w=>w.username).join(' & ') + ' are watching — engage them directly';
    alertCTA = 'Engage';
  } else if (activeWhales.length === 1) {
    alertIcon = '⚡'; alertLabel = 'Whale Alert';
    alertText = activeWhales[0].username + ' is in the room — personalise your next action';
    alertCTA = 'Engage';
  } else if (accelerating) {
    alertIcon = '📈'; alertLabel = 'Momentum Rising';
    alertText = 'Tip rate accelerating — capitalise before it plateaus';
    alertCTA = 'Set Goal';
  } else if (tph > 200) {
    alertIcon = '📈'; alertLabel = 'High Earnings';
    alertText = 'Earning ' + tkUsd(tph) + '/hr — sustain with a countdown goal';
    alertCTA = 'Set Goal';
  } else if (lurkers > viewers * 0.85 && viewers > 10) {
    alertIcon = '👁️'; alertLabel = 'Lurker Heavy';
    alertText = Math.round(lurkers) + ' viewers haven\'t tipped — time to activate them';
    alertCTA = 'Activate';
  } else if (viewers > 50 && tippers.length === 0) {
    alertIcon = '🎯'; alertLabel = 'High Traffic';
    alertText = viewers + ' viewers, no tips yet — drop your tip menu now';
    alertCTA = 'Drop Menu';
  } else if (totalTips > 0) {
    alertIcon = '💰'; alertLabel = 'Session Active';
    alertText = totalTips + ' tk earned · ' + tippers.length + ' tippers · ' + phaseLabel;
    alertCTA = null;
  }

  banner.querySelector('.alert-icon').textContent  = alertIcon;
  banner.querySelector('.alert-label').textContent = alertLabel;
  banner.querySelector('.alert-text').textContent  = alertText;
  var ctaBtn = banner.querySelector('.alert-cta');
  if (alertCTA) { ctaBtn.textContent = alertCTA; ctaBtn.style.display = ''; }
  else { ctaBtn.style.display = 'none'; }

  // ── Prompt cards ──────────────────────────────────────────────────────────
  const prompts = [];

  // ── WHALE-BIASED (high weight in warming + cooling) ───────────────────────
  if (activeWhales.length >= 1) {
    const w = activeWhales[0];
    const reason = phase === 'warming'  ? 'Early whale engagement sets the tip culture for the room'
                 : phase === 'cooling'  ? 'Your top spender is still here — a direct callout re-ignites'
                 : phase === 'building' ? 'Personal attention converts high-value viewers'
                 :                       'Acknowledge your biggest tipper while momentum is hot';
    prompts.push({ heat:'hot', icon:'🎯', action:'Call out ' + w.username + ' by name', reason, value: Math.round(((w.tips||20)*0.55+20)*pw.whale), tag:'whale' });
  }

  if (quietWhales.length >= 1) {
    const qw = quietWhales[0];
    prompts.push({ heat:'hot', icon:'🔔', action:'Re-engage ' + qw.username + ' — they\'ve gone quiet',
      reason: 'Present but silent 5+ min — direct attention often reactivates spending',
      value: Math.round(((qw.tips||30)*0.45+15)*pw.whale), tag:'whale' });
  }

  if (returningWhales.length >= 1) {
    const rw = returningWhales[0];
    prompts.push({ heat:'hot', icon:'🔄', action:'Welcome ' + rw.username + ' back to the room',
      reason: 'Returned ' + rw.joins + ' times — acknowledging return visits drives larger tips',
      value: Math.round(((rw.tips||25)*0.6+12)*pw.whale), tag:'whale' });
  }

  if (activeWhales.length >= 2) {
    const goalType = phase === 'peak' ? 'Launch a timed group goal NOW' : 'Launch a whale-tier exclusive goal';
    const wTotal   = activeWhales.reduce((s,w) => s+(w.tips||20), 0);
    prompts.push({ heat:'hot', icon:'💰', action: goalType,
      reason: activeWhales.length + ' whales in room — ' + (phase === 'peak' ? 'peak momentum, maximize immediately' : 'high-value moment'),
      value: Math.round(wTotal * 0.42 * pw.whale), tag:'whale' });
  }

  if (decelerating && activeWhales.length > 0) {
    prompts.push({ heat:'hot', icon:'🔥', action:'Drop a limited-time exclusive offer',
      reason: 'Tip velocity is declining — urgency resets momentum and re-engages big spenders',
      value: Math.round(tph * 0.22 * pw.whale), tag:'whale' });
  }

  if (phase === 'warming' && sessionMin < 12 && activeWhales.length === 0) {
    prompts.push({ heat:'medium', icon:'🎪', action:'Tease an exclusive unlock goal',
      reason: 'Early session — setting expectations now primes whale spending for later',
      value: Math.round(viewers * 0.025 * 10 * pw.whale), tag:'whale' });
  }

  // ── AUDIENCE-WIDE (high weight in peak + building) ────────────────────────
  if (lurkers > 15) {
    const urgency = phase === 'peak' ? 'Room energy is high — this is the best moment to convert lurkers' : Math.round(lurkers) + ' viewers haven\'t tipped yet';
    prompts.push({ heat: phase === 'peak' ? 'hot' : 'medium', icon:'📢',
      action:'Announce your tip menu out loud', reason: urgency,
      value: Math.round(lurkers * 0.022 * 10 * pw.audience), tag:'audience' });
  }

  if (convRate < 2.5 && viewers > 15) {
    prompts.push({ heat:'medium', icon:'✨', action:'Run a quick viewer poll in chat',
      reason: 'Conv rate ' + convRate + '% — polls shift lurkers from passive to engaged',
      value: Math.round(viewers * 0.016 * 10 * pw.audience), tag:'audience' });
  }

  if ((burst || accelerating) && phase !== 'cooling') {
    const burstReason = burst ? '2+ tips in 90 seconds — capitalise before the window closes' : 'Tip rate accelerating — a timed goal locks in momentum';
    prompts.push({ heat:'hot', icon:'⏱️', action:'Set a 5-minute countdown goal',
      reason: burstReason,
      value: Math.round(tph * 0.17 * (phase === 'peak' ? pw.audience : pw.whale)), tag:'momentum' });
  }

  if (tippers.length >= 3 && totalTips > 40 && phase !== 'warming') {
    const top = tippers[0];
    prompts.push({ heat:'medium', icon:'🏆', action:'Thank ' + top.username + ' as top tipper publicly',
      reason: phase === 'peak' ? 'Public recognition during peak triggers copycat tipping' : 'Social proof drives repeat tips from others',
      value: Math.round((top.tips*0.2+10) * pw.audience), tag:'audience' });
  }

  if (viewers > 80 && tippers.length < 4 && phase !== 'warming') {
    prompts.push({ heat:'hot', icon:'🎪', action:'Tease an exclusive unlock — big room, few tippers',
      reason: 'Large audience with low conversion — urgency prompt converts fence-sitters',
      value: Math.round(viewers * 0.03 * 10 * pw.audience), tag:'audience' });
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  if (prompts.length === 0) {
    if (viewers > 0) {
      prompts.push({ heat:'', icon:'👋', action:'Greet viewers and introduce your tip menu', reason:'Building rapport early converts first-timers', value:10, tag:'audience' });
      prompts.push({ heat:'', icon:'💬', action:'Ask viewers what they want to see', reason:'Engagement question primes tip intent', value:8, tag:'audience' });
    } else {
      prompts.push({ heat:'', icon:'⏳', action:'Waiting for viewers to load…', reason:'Data will appear shortly', value:0, tag:'' });
    }
  }

  // Sort by value, cap at 4
  prompts.sort((a,b) => b.value - a.value);
  promptSec.innerHTML = prompts.slice(0,4).map(function(p) {
    return '<div class="prompt-card ' + (p.heat||'') + '">' +
      '<div class="pe">' + p.icon + '</div>' +
      '<div><div class="pa">' + p.action + '</div><div class="pm">' + p.reason + '</div></div>' +
      (p.value > 0 ? '<div class="pv">+' + p.value + ' tk</div>' : '') +
      '</div>';
  }).join('');
}


// ── Engagement heat map ───────────────────────────────────────────────────────
// Divides the session into 12 equal buckets and shows tip volume per bucket.
// Falls back to viewer-count-based activity if no tips yet.

function updateHeatMap(data) {
  var barsEl  = document.getElementById('heat-bars');
  var timeEl  = document.getElementById('heat-time');
  var peakEl  = document.getElementById('heat-label-peak');
  if (!barsEl || !timeEl) return;

  var tipEvents = data.tipEvents || [];
  var viewers   = data.viewers   || 0;
  var NUM_BARS  = 12;
  var now       = Date.now();

  // Session window: from start of tipEvents or last 2 hours, min 10 min
  var sessionStart = tipEvents.length > 0
    ? Math.min(tipEvents[0].timestamp, now - 600000)
    : now - 600000;
  var windowMs = Math.max(now - sessionStart, 600000); // at least 10 min

  // Build buckets — tip tokens per bar
  var buckets = [];
  for (var i = 0; i < NUM_BARS; i++) buckets.push(0);

  tipEvents.forEach(function(e) {
    var age    = now - e.timestamp;
    if (age > windowMs) return;
    var idx    = Math.floor(((windowMs - age) / windowMs) * NUM_BARS);
    idx        = Math.min(idx, NUM_BARS - 1);
    buckets[idx] += e.amount || 1;
  });

  // If no tips, use viewer count as a flat baseline pulse
  var hasRealData = tipEvents.length > 0;
  if (!hasRealData && viewers > 0) {
    // Simulate gentle viewer-presence baseline
    for (var j = 0; j < NUM_BARS; j++) {
      buckets[j] = viewers * (0.3 + 0.1 * Math.sin(j * 0.8));
    }
  }

  var maxVal = Math.max.apply(null, buckets.concat([1]));
  var peakIdx = buckets.indexOf(maxVal);

  // Determine activity level label
  var totalTips = data.totalTips || 0;
  var tph = data.tokensPerHour || 0;
  var peakLabel;
  if (!hasRealData && viewers === 0) {
    peakLabel = '⏳ Waiting…';
  } else if (!hasRealData) {
    peakLabel = '👁️ ' + viewers + ' watching';
  } else if (peakIdx === NUM_BARS - 1) {
    peakLabel = '⚡ Peak now!';
  } else if (tph > 150) {
    peakLabel = '🔥 Hot session';
  } else {
    peakLabel = '📊 ' + tkUsd(totalTips) + ' session';
  }
  if (peakEl) peakEl.textContent = peakLabel;

  // Render bars
  var barColors = [
    ['#2a2a3a','#3a3a50'], ['#2a2a3a','#4a3a60'], ['#3a2a4a','#6a3a80'],
    ['#3a2a4a','#7c4a9a'], ['#4a1a3a','#a03070'], ['#4a1a3a','#c0306e'],
    ['#5a1a2a','#e03060'], ['#6a0a20','#ff3f6c']
  ];

  barsEl.innerHTML = buckets.map(function(val, i) {
    var pct     = Math.max(Math.round((val / maxVal) * 100), 4);
    var isPeak  = (i === peakIdx && hasRealData);
    var colorIdx = Math.min(Math.floor((val / maxVal) * (barColors.length - 1)), barColors.length - 1);
    var bg      = 'linear-gradient(to top,' + barColors[colorIdx][0] + ',' + barColors[colorIdx][1] + ')';
    var shadow  = isPeak ? ';box-shadow:0 0 10px rgba(255,63,108,0.6)' : '';
    return '<div class="hbar" style="height:' + pct + '%;background:' + bg + shadow + '"></div>';
  }).join('');

  // Time labels — show real clock times for each bucket boundary
  var labelCount = 5;
  var labels = [];
  for (var k = 0; k < labelCount; k++) {
    var ts = sessionStart + (windowMs / (labelCount - 1)) * k;
    var d  = new Date(ts);
    var h  = d.getHours(), m = d.getMinutes();
    var ampm = h >= 12 ? 'pm' : 'am';
    h = h % 12 || 12;
    labels.push((k === labelCount - 1 ? 'Now' : h + (m > 0 ? ':' + (m<10?'0'+m:m) : '') + ampm));
  }
  timeEl.innerHTML = labels.map(function(l) { return '<span>' + l + '</span>'; }).join('');
}


// ── AI Price Recommendation engine ────────────────────────────────────────────
// Derives a tip floor recommendation from session behaviour signals.

function updatePricing(data) {
  var curEl     = document.getElementById('pr-current');
  var recEl     = document.getElementById('pr-recommended');
  var maxEl     = document.getElementById('pr-max');
  var insightEl = document.getElementById('pr-insight');
  if (!curEl || !recEl || !maxEl || !insightEl) return;

  var viewers   = data.viewers    || 0;
  var totalTips = data.totalTips  || 0;
  var tph       = data.tokensPerHour || 0;
  var convRate  = parseFloat(data.convRate) || 0;
  var fans      = data.fans       || [];
  var whales    = data.whales     || [];
  var tipEvents = data.tipEvents  || [];
  var tippers   = fans.filter(function(f) { return f.tips > 0; });

  // ── Derive average tip size ────────────────────────────────────────────────
  var avgTip = 0;
  if (tipEvents.length > 0) {
    avgTip = Math.round(tipEvents.reduce(function(s, e) { return s + e.amount; }, 0) / tipEvents.length);
  }

  // ── Derive median tip (more robust than avg for skewed distributions) ──────
  var sorted = tipEvents.map(function(e) { return e.amount; }).sort(function(a,b){return a-b;});
  var medTip = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;

  // ── Max single tip seen this session ──────────────────────────────────────
  var maxTip = sorted.length > 0 ? sorted[sorted.length - 1] : 0;

  // ── Current effective floor = smallest tip seen (or avg if no tips) ───────
  var minTip = sorted.length > 0 ? sorted[0] : 0;
  var currentFloor = minTip > 0 ? minTip : (avgTip > 0 ? avgTip : null);

  // ── Demand score 0-100 ────────────────────────────────────────────────────
  // Combines: viewer count, conv rate, whale presence, tph
  var demandScore = 0;
  demandScore += Math.min(viewers / 5, 20);          // up to 20pts for viewers
  demandScore += Math.min(convRate * 4, 20);          // up to 20pts for conv rate
  demandScore += Math.min(whales.length * 10, 20);   // up to 20pts for whales
  demandScore += Math.min(tph / 20, 20);             // up to 20pts for tph
  demandScore += tipEvents.length > 0 ? 20 : 0;      // 20pts if any tips exist
  demandScore = Math.min(Math.round(demandScore), 100);

  // ── Recommended floor logic ───────────────────────────────────────────────
  var recommended, maxRecommended, insight;

  if (tipEvents.length === 0 && viewers === 0) {
    // No data at all
    curEl.textContent = '—';
    recEl.textContent = '—';
    maxEl.textContent = '—';
    insightEl.textContent = 'Waiting for session data to load…';
    return;
  }

  if (tipEvents.length === 0) {
    // Have viewers but no tips yet
    var baseRec = viewers > 100 ? 15 : viewers > 50 ? 10 : viewers > 20 ? 8 : 5;
    recommended    = baseRec;
    maxRecommended = Math.round(baseRec * 1.8);
    insight = 'You have ' + viewers + ' people watching but no one has tipped yet. Post your tip menu in chat and tell viewers the smallest tip you\'ll accept is ' + recommended + ' tokens — giving people a clear number to act on is what gets the first tip.';
    curEl.textContent = 'None yet';
  } else {
    // Have real tip data
    // Recommended = median tip rounded to nearest 5, adjusted up for demand
    var demandMultiplier = 1 + (demandScore / 200); // 1.0x to 1.5x
    recommended    = Math.max(Math.round((medTip * demandMultiplier) / 5) * 5, 5);
    maxRecommended = Math.max(Math.round((maxTip * 0.7) / 5) * 5, recommended + 5);
    curEl.textContent = currentFloor ? currentFloor + ' tk' : avgTip + ' tk avg';

    // Build insight message
    if (demandScore >= 70 && recommended > (currentFloor || 0)) {
      insight = 'Your room is active and tips are coming in. This is a good moment to raise your minimum tip — say out loud or type in chat: "minimum tip is now ' + recommended + ' tokens." Viewers are engaged right now and more likely to go along with it.';
    } else if (whales.length >= 2 && avgTip < 50) {
      insight = 'You have ' + whales.length + ' big spenders in the room right now. Try announcing a special one-time offer — say something like: "First person to tip ' + recommended + ' tokens gets [something exclusive]." Big spenders respond well to limited offers aimed at them.';
    } else if (convRate > 5) {
      insight = convRate + '% of your viewers have already tipped — that\'s a strong, generous crowd. You can safely raise your minimum tip to ' + recommended + ' tokens. Say in chat: "Raising my tip menu — minimum is now ' + recommended + ' tokens, thank you all!"';
    } else if (convRate < 2 && tippers.length > 0) {
      insight = 'Most viewers haven\'t tipped yet. Keep your minimum tip low at ' + recommended + ' tokens to make it easy for people to start. Post your tip menu in chat and say: "Even a small tip means a lot!" — once someone tips once, they almost always tip again.';
    } else if (tph > 200) {
      insight = 'Tips are coming in quickly — great momentum. While the room is active, type in chat: "tip ' + recommended + ' tokens to [something you offer]!" Posting a specific number while people are already tipping gets more people to join in.';
    } else {
      insight = 'Based on ' + tipEvents.length + ' tips so far (average tip: ' + avgTip + ' tokens), ' + recommended + ' tokens fits what your viewers are willing to spend. Post your tip menu in chat now to remind people what they can tip for — most viewers need a reminder to act.';
    }
  }

  recEl.textContent = recommended + ' tk';
  maxEl.textContent = maxRecommended + ' tk';
  insightEl.textContent = insight;

  // Highlight recommended if meaningfully higher than current
  var card = document.getElementById('pricing-card');
  if (card && currentFloor && recommended > currentFloor * 1.2) {
    recEl.style.color = 'var(--gold)';
    recEl.style.textShadow = '0 0 12px rgba(255,209,102,0.4)';
  } else {
    recEl.style.color = '';
    recEl.style.textShadow = '';
  }
}


// ── Analytics page ────────────────────────────────────────────────────────────
function getAnalyticsPage() {
  return `
<div class="an-hdr">
  <div class="an-title">Analytics</div>
  <div class="an-sub" id="an-session-time">Session started just now</div>
</div>
<div class="an-grid">
  <div class="an-card c1"><div class="an-card-lbl">Total Tokens Earned</div><div class="an-card-val" id="an-total">0<span> tk</span></div><div class="an-card-sub" id="an-total-sub">session token total</div></div>
  <div class="an-card c2"><div class="an-card-lbl">Current Viewers</div><div class="an-card-val" id="an-viewers">0</div><div class="an-card-sub" id="an-viewers-sub">in room right now</div></div>
  <div class="an-card c3"><div class="an-card-lbl">Conversion</div><div class="an-card-val" id="an-conv">0<span>%</span></div><div class="an-card-sub" id="an-conv-sub">viewers who tipped</div></div>
  <div class="an-card c4"><div class="an-card-lbl">Avg Tip</div><div class="an-card-val" id="an-avg">—<span></span></div><div class="an-card-sub" id="an-avg-sub">per transaction</div></div>
  <div class="an-card c5"><div class="an-card-lbl">Earnings</div><div class="an-card-val" id="an-tph">$0<span>/hr</span></div><div class="an-card-sub" id="an-tph-sub">at $0.05/tk</div></div>
  <div class="an-card c6"><div class="an-card-lbl">Tippers</div><div class="an-card-val" id="an-tippers">0</div><div class="an-card-sub" id="an-tippers-sub">unique this session</div></div>
</div>
<div class="an-divider"></div>
<div class="an-sec">
  <div class="an-sec-lbl">Top Tippers</div>
  <div id="an-top-tippers"><div class="an-empty">No tips yet this session</div></div>
</div>
<div class="an-divider"></div>
<div class="an-sec" style="padding-bottom:14px">
  <div class="an-sec-lbl">Session Pace</div>
  <div id="an-pace">
    <div class="an-pace-row"><span class="an-pace-lbl">Largest tip</span><span class="an-pace-val" id="an-max-tip">—</span></div>
    <div class="an-pace-row"><span class="an-pace-lbl">Smallest tip</span><span class="an-pace-val" id="an-min-tip">—</span></div>
    <div class="an-pace-row"><span class="an-pace-lbl">Tips per minute</span><span class="an-pace-val" id="an-tpm">—</span></div>
    <div class="an-pace-row"><span class="an-pace-lbl">Whales in room</span><span class="an-pace-val" id="an-whale-count">0</span></div>
    <div class="an-pace-row" style="border:none"><span class="an-pace-lbl">Session status</span><span class="an-pace-val" id="an-status">Watching…</span></div>
  </div>
</div>`;
}

function updateAnalytics(data) {
  // Only update if analytics page is active
  if (currentPage !== 'analytics') return;

  var viewers   = data.viewers    || 0;
  var totalTips = data.totalTips  || 0;
  var tph       = data.tokensPerHour || 0;
  var convRate  = parseFloat(data.convRate) || 0;
  var fans      = data.fans       || [];
  var whales    = data.whales     || [];
  var tipEvents = data.tipEvents  || [];
  var tippers   = fans.filter(function(f) { return f.tips > 0; });

  var amounts   = tipEvents.map(function(e){ return e.amount; });
  var avgTip    = amounts.length ? Math.round(amounts.reduce(function(s,a){return s+a;},0) / amounts.length) : 0;
  var maxTip    = amounts.length ? Math.max.apply(null, amounts) : 0;
  var minTip    = amounts.length ? Math.min.apply(null, amounts) : 0;

  // Session duration
  var sessionStart = tipEvents.length > 0 ? tipEvents[0].timestamp : Date.now();
  var elapsedMs    = Date.now() - sessionStart;
  var elapsedMin   = Math.round(elapsedMs / 60000);
  var elapsedStr   = elapsedMin < 2 ? 'just started' : elapsedMin < 60
    ? elapsedMin + ' min ago'
    : Math.floor(elapsedMin/60) + 'h ' + (elapsedMin%60) + 'm ago';
  var tpm = elapsedMin > 0 ? (tipEvents.length / elapsedMin).toFixed(2) : '—';

  // Session status
  var activeWhales = whales.filter(function(w){ return w.present !== false; });
  var status, statusClass;
  if (activeWhales.length >= 3 && tph > 150) { status = '🔥 On Fire'; statusClass = 'hot'; }
  else if (activeWhales.length >= 2)          { status = '🐋 Whale Room'; statusClass = 'up'; }
  else if (tph > 100)                         { status = '📈 Strong'; statusClass = 'up'; }
  else if (tph > 0)                           { status = '✅ Active'; statusClass = 'up'; }
  else if (viewers > 50)                      { status = '👁️ Building'; statusClass = 'warn'; }
  else                                        { status = '⏳ Warming up'; statusClass = ''; }

  function set(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }
  function cls(id, cn)  { var el = document.getElementById(id); if (el) el.className = 'an-pace-val ' + cn; }

  set('an-session-time',  'Session started ' + elapsedStr);
  set('an-total',         totalTips);
  set('an-viewers',       viewers);
  set('an-conv',          convRate);
  set('an-avg',           avgTip > 0 ? avgTip : '—');
  set('an-tph',           tkUsd(tph));
  set('an-tippers',       tippers.length);
  set('an-viewers-sub',   viewers === 1 ? '1 person in room right now' : viewers + ' people in room right now');
  set('an-conv-sub',      tippers.length + ' of ' + viewers + ' tipped');
  set('an-avg-sub',       amounts.length + ' transactions');
  set('an-tph-sub',       tph > 100 ? '🔥 Hot pace' : tph > 0 ? 'Good pace' : 'No tips yet');
  set('an-tippers-sub',   tippers.length + ' unique tippers');
  set('an-max-tip',       maxTip > 0 ? maxTip + ' tk' : '—');
  set('an-min-tip',       minTip > 0 ? minTip + ' tk' : '—');
  set('an-tpm',           tpm);
  set('an-whale-count',   activeWhales.length);
  set('an-status',        status);
  cls('an-status',        statusClass);
  cls('an-tph',           tph > 150 ? 'hot' : tph > 50 ? 'up' : '');
  cls('an-conv',          convRate > 5 ? 'up' : convRate > 2 ? 'warn' : '');

  // Top tippers bar chart
  var tipperEl = document.getElementById('an-top-tippers');
  if (tipperEl) {
    var top = tippers.slice(0, 6);
    if (top.length === 0) {
      tipperEl.innerHTML = '<div class="an-empty">No tips yet this session</div>';
    } else {
      var topMax = top[0].tips;
      tipperEl.innerHTML = top.map(function(f) {
        var pct = Math.round((f.tips / topMax) * 100);
        return '<div class="an-tip-row">' +
          '<div class="an-tip-user">' + f.username + '</div>' +
          '<div class="an-tip-bar-wrap"><div class="an-tip-bar" style="width:' + pct + '%"></div></div>' +
          '<div class="an-tip-amt">' + f.tips + '</div>' +
        '</div>';
      }).join('');
    }
  }
}


// ── Fan leaderboard with filters + 30-day history ────────────────────────────
var fanFilter = 'all';
var thirtyDayHistory = {}; // { username: totalTips30d } — persisted in storage
var storageUsername = ''; // current broadcaster — used to namespace storage keys
function getHistoryKey()  { return storageUsername ? 'apex_' + storageUsername + '_30dHistory' : 'apex30dHistory'; }
function getSettingsKey() { return storageUsername ? 'apex_' + storageUsername + '_settings'   : 'apexSettings'; }

// ── Overlay Auth UI ────────────────────────────────────────────────────────────
// Full sign-in / sign-up / link-account flow rendered directly in the overlay.

function injectOverlayAuthStyles() {
  if (document.getElementById('apex-auth-styles')) return;
  var s = document.createElement('style');
  s.id = 'apex-auth-styles';
  s.textContent =
    '.oa-wrap{position:fixed;inset:0;background:#0f0f13;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;font-family:Manrope,sans-serif;overflow-y:auto}'
  + '.oa-logo{display:flex;justify-content:center;margin-bottom:4px}'
  + '.oa-logo img{width:260px;height:auto;object-fit:contain}'
  + '.oa-brand{font-family:Syne,sans-serif;font-weight:800;font-size:17px;color:#e5e7eb;letter-spacing:.5px;margin-bottom:3px;text-align:center}'
  + '.oa-tagline{font-size:11px;color:#6b7280;margin-bottom:20px;text-align:center}'
  + '.oa-card{background:#1a1a24;border:1px solid #2a2a38;border-radius:16px;padding:22px;width:100%;max-width:290px}'
  + '.oa-tabs{display:flex;margin-bottom:18px;background:#0f0f13;border-radius:8px;padding:3px}'
  + '.oa-tab{flex:1;padding:8px 4px;text-align:center;font-size:12px;font-weight:600;color:#6b7280;cursor:pointer;border-radius:6px;transition:all .2s;user-select:none}'
  + '.oa-tab.active{background:#7c5cfc;color:#fff}'
  + '.oa-label{font-size:11px;color:#9ca3af;margin-bottom:5px;font-weight:500}'
  + '.oa-input{width:100%;background:#0f0f13;border:1px solid #2a2a38;border-radius:8px;padding:10px 12px;color:#e5e7eb;font-size:13px;font-family:Manrope,sans-serif;box-sizing:border-box;outline:none;margin-bottom:10px}'
  + '.oa-input:focus{border-color:#7c5cfc}'
  + '.oa-btn{width:100%;background:#7c5cfc;border:none;border-radius:8px;padding:11px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:Manrope,sans-serif;margin-top:4px;transition:background .2s}'
  + '.oa-btn:hover:not(:disabled){background:#9a7aff}'
  + '.oa-btn:disabled{background:#3a3a50;color:#6b7280;cursor:not-allowed}'
  + '.oa-btn.sec{background:transparent;border:1px solid #2a2a38;color:#9ca3af;margin-top:8px}'
  + '.oa-btn.sec:hover:not(:disabled){background:#1e1e2a;color:#e5e7eb;border-color:#3a3a50}'
  + '.oa-err{font-size:11px;color:#ef4444;text-align:center;min-height:16px;margin-bottom:8px;line-height:1.4}'
  + '.oa-ok{font-size:11px;color:#10b981;text-align:center;min-height:16px;margin-bottom:8px}'
  + '.oa-sec-lbl{font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px}'
  + '.oa-plat-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:12px}'
  + '.oa-plat{padding:9px 6px;background:#0f0f13;border:1px solid #2a2a38;border-radius:8px;text-align:center;cursor:pointer;font-size:11px;color:#9ca3af;transition:all .2s;user-select:none;line-height:1.4}'
  + '.oa-plat.sel{border-color:#7c5cfc;color:#c4b5fd;background:#1a1030}'
  + '.oa-match-box{background:#1a1030;border:1px solid rgba(124,92,252,.3);border-radius:10px;padding:14px;margin-bottom:14px;text-align:center}'
  + '.oa-match-user{font-size:15px;font-weight:700;color:#c4b5fd;margin-bottom:3px}'
  + '.oa-match-sub{font-size:11px;color:#6b7280}'
  + '.oa-hint{font-size:11px;color:#6b7280;text-align:center;margin-bottom:14px;line-height:1.5;padding:0 4px}'
  + '.oa-code-box{display:flex;align-items:center;gap:10px;background:#0f0f13;border:1px solid #7c5cfc;border-radius:10px;padding:12px 14px;margin:10px 0 4px}'
  + '.oa-code-txt{flex:1;font-family:"DM Mono",monospace;font-size:18px;font-weight:600;color:#c4b5fd;letter-spacing:2px;user-select:all}'
  + '.oa-copy-btn{background:transparent;border:1px solid #3a3a50;border-radius:6px;color:#9ca3af;font-size:11px;font-weight:600;padding:6px 10px;cursor:pointer;font-family:Manrope,sans-serif;transition:all .2s;white-space:nowrap}'
  + '.oa-copy-btn:hover{background:#1e1e2a;color:#e5e7eb;border-color:#4a4a60}'
  + '.oa-step-hint{font-size:11px;color:#6b7280;line-height:1.5;margin-bottom:14px;padding:10px 12px;background:#0f0f13;border-radius:8px;border:1px solid #2a2a38}'
  + '.oa-step-hint strong{color:#c4b5fd}'
  + '.oa-admin-link{text-align:center;margin-top:14px}'
  + '.oa-admin-link a{font-size:10px;color:#3a3a50;text-decoration:none;cursor:pointer;font-weight:600;letter-spacing:.3px;transition:color .2s}'
  + '.oa-admin-link a:hover{color:#7c5cfc}'
  + '.oa-admin-mode{display:flex;align-items:center;justify-content:center;gap:6px;background:#1a1030;border:1px solid rgba(124,92,252,.3);border-radius:8px;padding:7px 12px;margin-bottom:14px;font-size:11px;color:#c4b5fd;font-weight:600}'
  + '.oa-admin-mode-dot{width:6px;height:6px;border-radius:50%;background:#7c5cfc;flex-shrink:0}';
  document.head.appendChild(s);
}

function removeOverlayAuthWrap() {
  var el = document.getElementById('apex-auth-wrap');
  if (el) el.remove();
}

function apexLogoHTML() {
  return '<div class="oa-logo"><img src="' + chrome.runtime.getURL('icons/apex-logo.png') + '" alt="Apex Revenue"></div>';
}

// Called after a successful sign-in to route to the correct next step
function overlayAuthProceed(onVerified) {
  chrome.storage.local.get(['apexLinkedAccounts', 'apexCurrentUser', 'apexIsAdmin'], function(r) {
    // ── Admin bypass ────────────────────────────────────────────────────────
    if (r.apexIsAdmin === true) {
      removeOverlayAuthWrap();
      showAdminBadge();
      onVerified();
      return;
    }
    var linked = r.apexLinkedAccounts || [];
    var detectedUser = r.apexCurrentUser || storageUsername || '';
    if (linked.length === 0) {
      showOverlayLinkStep(null, onVerified);
      return;
    }
    if (detectedUser) {
      var dn = detectedUser.toLowerCase();
      var matched = linked.some(function(a) { return a.username === dn; });
      if (!matched) {
        showOverlayMismatchScreen(detectedUser, onVerified);
        return;
      }
    }
    removeOverlayAuthWrap();
    onVerified();
  });
}

// ── Step 1: Sign In / Create Account ─────────────────────────────────────────
function showOverlayLoginForm(hint, onVerified) {
  injectOverlayAuthStyles();
  removeOverlayAuthWrap();
  var wrap = document.createElement('div');
  wrap.id = 'apex-auth-wrap';
  wrap.className = 'oa-wrap';
  wrap.innerHTML =
    apexLogoHTML() +
    '<div class="oa-tagline">Creator Intelligence Engine</div>' +
    '<div class="oa-card">' +
      '<div id="oa-admin-mode-banner" style="display:none" class="oa-admin-mode">' +
        '<div class="oa-admin-mode-dot"></div>Admin Login' +
      '</div>' +
      '<div class="oa-tabs">' +
        '<div class="oa-tab active" id="oa-tab-in">Sign In</div>' +
        '<div class="oa-tab" id="oa-tab-up">Create Account</div>' +
      '</div>' +
      (hint ? '<div class="oa-hint">' + hint + '</div>' : '') +
      '<div class="oa-label">Email</div>' +
      '<input class="oa-input" id="oa-email" type="email" placeholder="your@email.com" autocomplete="email">' +
      '<div class="oa-label">Password</div>' +
      '<input class="oa-input" id="oa-pass" type="password" placeholder="Min 6 characters" autocomplete="current-password">' +
      '<div class="oa-err" id="oa-err"></div>' +
      '<button class="oa-btn" id="oa-submit">Sign In</button>' +
      '<div id="oa-forgot-wrap" style="display:block;text-align:center;margin-top:10px">' +
        '<a id="oa-forgot-link" href="#" style="font-size:11px;color:#6b7280;text-decoration:none;font-weight:500;transition:color .2s">Forgot password?</a>' +
      '</div>' +
    '</div>' +
    '<div class="oa-admin-link"><a id="oa-admin-link" href="#">Admin Login</a></div>';
  document.body.appendChild(wrap);

  var tabIn       = document.getElementById('oa-tab-in');
  var tabUp       = document.getElementById('oa-tab-up');
  var submit      = document.getElementById('oa-submit');
  var errEl       = document.getElementById('oa-err');
  var emailEl     = document.getElementById('oa-email');
  var passEl      = document.getElementById('oa-pass');
  var adminLink   = document.getElementById('oa-admin-link');
  var adminBanner = document.getElementById('oa-admin-mode-banner');
  var forgotWrap  = document.getElementById('oa-forgot-wrap');
  var forgotLink  = document.getElementById('oa-forgot-link');
  var mode = 'signin';
  var adminMode = false;

  // Toggle admin mode on link click
  adminLink.addEventListener('click', function(e) {
    e.preventDefault();
    adminMode = !adminMode;
    adminBanner.style.display = adminMode ? 'flex' : 'none';
    adminLink.textContent = adminMode ? 'Cancel Admin Login' : 'Admin Login';
    // Admin accounts already exist — lock to Sign In tab
    if (adminMode) { tabIn.click(); tabUp.style.display = 'none'; }
    else           { tabUp.style.display = ''; }
    errEl.textContent = '';
  });

  // Forgot password — sends a Supabase reset email
  forgotLink.addEventListener('click', function(e) {
    e.preventDefault();
    var email = emailEl.value.trim();
    if (!email) {
      errEl.textContent = 'Enter your email above first.';
      return;
    }
    forgotLink.textContent = 'Sending…';
    forgotLink.style.pointerEvents = 'none';
    apexFetch('/auth/v1/recover', {
      method: 'POST',
      body: JSON.stringify({ email: email, redirect_to: 'chrome-extension://epmkaajhfgphamjilpdmfnlchicgdpom/recovery.html' })
    }).then(function() {
      errEl.style.color = '#10b981';
      errEl.textContent = 'Reset link sent — check your email.';
      forgotLink.textContent = 'Forgot password?';
      forgotLink.style.pointerEvents = '';
    }).catch(function(err) {
      console.error('[ApexRevenue] recover error:', err);
      errEl.style.color = '#ef4444';
      errEl.textContent = 'Error: ' + (err && err.message ? err.message : String(err));
      forgotLink.textContent = 'Forgot password?';
      forgotLink.style.pointerEvents = '';
    });
  });

  tabIn.addEventListener('click', function() {
    mode = 'signin'; tabIn.classList.add('active'); tabUp.classList.remove('active');
    submit.textContent = 'Sign In'; errEl.textContent = '';
    passEl.setAttribute('autocomplete', 'current-password');
    forgotWrap.style.display = 'block';
  });
  tabUp.addEventListener('click', function() {
    mode = 'signup'; tabUp.classList.add('active'); tabIn.classList.remove('active');
    submit.textContent = 'Create Account'; errEl.textContent = '';
    passEl.setAttribute('autocomplete', 'new-password');
    forgotWrap.style.display = 'none';
  });

  function setLoading(on) {
    submit.disabled = on;
    if (on) {
      submit.textContent = adminMode ? 'Verifying admin…' : (mode === 'signin' ? 'Signing in…' : 'Creating account…');
    } else {
      submit.textContent = adminMode ? 'Sign In as Admin' : (mode === 'signin' ? 'Sign In' : 'Create Account');
    }
  }

  function handleSubmit() {
    var email = emailEl.value.trim();
    var pass  = passEl.value;
    errEl.textContent = '';
    if (!email || !pass) { errEl.textContent = 'Please enter your email and password.'; return; }
    if (pass.length < 6)  { errEl.textContent = 'Password must be at least 6 characters.'; return; }
    setLoading(true);

    if (adminMode) {
      // Admin path: sign in then explicitly await admin status check before proceeding
      apexSignIn(email, pass).then(function(data) {
        var token = (data && data.access_token) || (data && data.session && data.session.access_token);
        if (!token) {
          errEl.textContent = 'Sign in failed. Check your email and password.';
          setLoading(false);
          return;
        }
        // Explicitly await admin status — no race condition
        return apexFetchAdminStatus().then(function(isAdmin) {
          if (!isAdmin) {
            errEl.textContent = 'This account does not have admin access.';
            setLoading(false);
            return;
          }
          removeOverlayAuthWrap();
          showAdminBadge();
          onVerified();
        });
      }).catch(function(err) {
        console.error('[ApexAuth] admin login error ->', err);
        errEl.textContent = err.message || 'Something went wrong. Please try again.';
        setLoading(false);
      });
      return;
    }

    // Normal path
    var authPromise = mode === 'signin' ? apexSignIn(email, pass) : apexSignUp(email, pass);
    authPromise.then(function(data) {
      // Supabase v2 may nest the token under data.session
      var token = (data && data.access_token) || (data && data.session && data.session.access_token);
      if (!token) {
        // Signup succeeded but email confirmation is required
        if (mode === 'signup' && data && (data.user || data.id || data.email)) {
          errEl.style.color = '#10b981';
          errEl.textContent = 'Account created! Check your email to confirm it, then sign in.';
          tabIn.click(); // switch to Sign In tab
          setLoading(false);
        } else {
          errEl.textContent = mode === 'signin'
            ? 'Sign in failed. Check your email and password, or create an account.'
            : 'Sign up failed. This email may already be registered — try signing in.';
          setLoading(false);
        }
        return;
      }
      return apexGetLinkedAccounts().then(function(accounts) {
        var obj = {}; obj[APEX_LINKED_KEY] = accounts;
        chrome.storage.local.set(obj, function() { overlayAuthProceed(onVerified); });
      });
    }).catch(function(err) {
      console.error('[ApexAuth] handleSubmit error ->', err);
      var msg = err.message || 'Something went wrong. Please try again.';
      errEl.textContent = msg;
      setLoading(false);
    });
  }

  submit.addEventListener('click', handleSubmit);
  [emailEl, passEl].forEach(function(inp) {
    inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') handleSubmit(); });
  });
}

// ── Step 2: Link your streaming account ──────────────────────────────────────
function showOverlayLinkStep(hint, onVerified) {
  injectOverlayAuthStyles();
  removeOverlayAuthWrap();

  var detectedUser     = storageUsername || '';
  var selectedPlatform = 'chaturbate';
  var platforms = [
    { id: 'chaturbate', label: 'Chaturbate' },
    { id: 'stripchat',  label: 'Stripchat'  },
    { id: 'xtease',     label: 'XTease'     },
    { id: 'myfreecams', label: 'MyFreeCams' },
  ];

  var wrap = document.createElement('div');
  wrap.id = 'apex-auth-wrap';
  wrap.className = 'oa-wrap';
  document.body.appendChild(wrap);

  // Returns the public profile URL for a given platform + username
  function profileUrl(platform, username) {
    var u = encodeURIComponent(username);
    if (platform === 'chaturbate') return 'https://chaturbate.com/' + u + '/';
    if (platform === 'stripchat')  return 'https://stripchat.com/' + u;
    if (platform === 'xtease')     return 'https://xtease.com/' + u;
    if (platform === 'myfreecams') return 'https://profiles.myfreecams.com/' + u;
    return 'https://' + platform + '.com/' + u;
  }

  // ── View 1: Enter platform + username ──────────────────────────────────────
  function renderEnterView() {
    var platHTML = platforms.map(function(p) {
      return '<div class="oa-plat' + (p.id === selectedPlatform ? ' sel' : '') + '" data-plat="' + p.id + '">' + p.label + '</div>';
    }).join('');

    wrap.innerHTML =
      apexLogoHTML() +
      '<div class="oa-tagline">Verify your streaming account</div>' +
      '<div class="oa-card">' +
        '<div class="oa-sec-lbl">Your Platform</div>' +
        '<div class="oa-plat-grid">' + platHTML + '</div>' +
        '<div class="oa-label">Your streaming username</div>' +
        '<input class="oa-input" id="oa-uname" type="text" placeholder="e.g. yourname" value="' + detectedUser + '">' +
        '<div class="oa-err" id="oa-err"></div>' +
        '<button class="oa-btn" id="oa-next-btn">Get Verification Code</button>' +
      '</div>';

    wrap.querySelectorAll('.oa-plat').forEach(function(el) {
      el.addEventListener('click', function() {
        wrap.querySelectorAll('.oa-plat').forEach(function(x) { x.classList.remove('sel'); });
        el.classList.add('sel');
        selectedPlatform = el.getAttribute('data-plat');
      });
    });

    var unameEl = document.getElementById('oa-uname');
    var errEl   = document.getElementById('oa-err');
    var nextBtn = document.getElementById('oa-next-btn');

    nextBtn.addEventListener('click', function() {
      var username = (unameEl.value || '').trim().toLowerCase().replace(/^@/, '');
      errEl.textContent = '';
      if (!username) { errEl.textContent = 'Please enter your streaming username.'; return; }
      nextBtn.disabled = true; nextBtn.textContent = 'Generating code…';
      apexGenerateVerificationCode(selectedPlatform, username).then(function(code) {
        renderVerifyView(code, username, selectedPlatform);
      }).catch(function(err) {
        errEl.textContent = err.message || 'Failed to generate code. Please try again.';
        nextBtn.disabled = false; nextBtn.textContent = 'Get Verification Code';
      });
    });

    unameEl.addEventListener('keydown', function(e) { if (e.key === 'Enter') nextBtn.click(); });
  }

  // ── View 2: Show code + verify against bio ─────────────────────────────────
  function renderVerifyView(code, username, platform) {
    wrap.innerHTML =
      apexLogoHTML() +
      '<div class="oa-tagline">Add code to your bio</div>' +
      '<div class="oa-card">' +
        '<div class="oa-step-hint">Paste this code into your <strong>' + platform + '</strong> bio for <strong>@' + username + '</strong>, save your profile, then tap Verify.</div>' +
        '<div class="oa-code-box">' +
          '<div class="oa-code-txt" id="oa-code-txt">' + code + '</div>' +
          '<button class="oa-copy-btn" id="oa-copy-btn">Copy</button>' +
        '</div>' +
        '<div class="oa-hint" style="margin-top:8px">Expires in 10 minutes. You can remove it from your bio after verifying.</div>' +
        '<div class="oa-err" id="oa-err"></div>' +
        '<button class="oa-btn" id="oa-verify-btn">Verify Now</button>' +
        '<button class="oa-btn sec" id="oa-back-btn">← Back</button>' +
      '</div>';

    var errEl     = document.getElementById('oa-err');
    var copyBtn   = document.getElementById('oa-copy-btn');
    var verifyBtn = document.getElementById('oa-verify-btn');
    var backBtn   = document.getElementById('oa-back-btn');

    copyBtn.addEventListener('click', function() {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(function() {
          copyBtn.textContent = 'Copied ✓'; copyBtn.style.color = '#10b981';
          setTimeout(function() { copyBtn.textContent = 'Copy'; copyBtn.style.color = ''; }, 2000);
        });
      } else {
        // Fallback: select the text so user can copy manually
        var range = document.createRange();
        range.selectNode(document.getElementById('oa-code-txt'));
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
      }
    });

    backBtn.addEventListener('click', renderEnterView);

    verifyBtn.addEventListener('click', function() {
      errEl.textContent = '';
      verifyBtn.disabled = true; verifyBtn.textContent = 'Checking your bio…';

      // Step 1: fetch the public profile page and look for the code in the HTML
      fetch(profileUrl(platform, username), { credentials: 'omit' })
        .then(function(res) { return res.text(); })
        .then(function(html) {
          if (html.indexOf(code) === -1) {
            errEl.textContent = 'Code not found in your bio. Make sure you saved your profile and try again.';
            verifyBtn.disabled = false; verifyBtn.textContent = 'Verify Now';
            return;
          }
          // Step 2: validate + consume the code server-side (checks user_id binding + expiry)
          verifyBtn.textContent = 'Confirming…';
          return apexConsumeVerificationCode(code, platform, username)
            .then(function() {
              return apexLinkPlatformAccount(platform, username);
            })
            .then(function(accounts) {
              var obj = {}; obj[APEX_LINKED_KEY] = accounts;
              chrome.storage.local.set(obj, function() {
                removeOverlayAuthWrap();
                onVerified();
              });
            });
        })
        .catch(function(err) {
          errEl.textContent = err.message || 'Verification failed. Please try again.';
          verifyBtn.disabled = false; verifyBtn.textContent = 'Verify Now';
        });
    });
  }

  renderEnterView();
}

// ── Mismatch: logged in but stream not linked ─────────────────────────────────
function showOverlayMismatchScreen(detectedUser, onVerified) {
  injectOverlayAuthStyles();
  removeOverlayAuthWrap();
  var wrap = document.createElement('div');
  wrap.id = 'apex-auth-wrap';
  wrap.className = 'oa-wrap';
  wrap.innerHTML =
    apexLogoHTML() +
    '<div class="oa-tagline">Account not linked</div>' +
    '<div class="oa-card">' +
      '<div class="oa-match-box">' +
        '<div class="oa-match-user">@' + detectedUser + '</div>' +
        '<div class="oa-match-sub">This stream isn\'t linked to your account yet</div>' +
      '</div>' +
      '<div class="oa-hint">Add this username to unlock the overlay, or sign in with a different account.</div>' +
      '<div class="oa-err" id="oa-err"></div>' +
      '<button class="oa-btn" id="oa-add-btn">Add @' + detectedUser + ' to My Account</button>' +
      '<button class="oa-btn sec" id="oa-out-btn">Sign Out</button>' +
    '</div>';
  document.body.appendChild(wrap);

  var errEl  = document.getElementById('oa-err');
  var addBtn = document.getElementById('oa-add-btn');
  var outBtn = document.getElementById('oa-out-btn');

  addBtn.addEventListener('click', function() {
    errEl.textContent = '';
    addBtn.disabled = true; addBtn.textContent = 'Adding…';
    apexLinkPlatformAccount('chaturbate', detectedUser).then(function(accounts) {
      var obj = {}; obj[APEX_LINKED_KEY] = accounts;
      chrome.storage.local.set(obj, function() { removeOverlayAuthWrap(); onVerified(); });
    }).catch(function(err) {
      errEl.textContent = err.message || 'Failed to add account. Please try again.';
      addBtn.disabled = false; addBtn.textContent = 'Add @' + detectedUser + ' to My Account';
    });
  });

  outBtn.addEventListener('click', function() {
    outBtn.disabled = true; outBtn.textContent = 'Signing out…';
    apexSignOut().then(function() { showOverlayLoginForm(null, onVerified); })
                 .catch(function() { showOverlayLoginForm(null, onVerified); });
  });
}

// Fallback for any generic auth error (redirects to login form)
function showOverlayAuthWall(message) {
  showOverlayLoginForm(message, loadApexData);
}

// Shows a small floating badge so you know admin mode is active during dev
function showAdminBadge() {
  if (document.getElementById('apex-admin-badge')) return;
  var badge = document.createElement('div');
  badge.id = 'apex-admin-badge';
  badge.textContent = 'ADMIN';
  badge.style.cssText = [
    'position:fixed',
    'bottom:12px',
    'right:14px',
    'background:linear-gradient(135deg,#7c5cfc,#a855f7)',
    'color:#fff',
    'font-size:9px',
    'font-weight:800',
    'letter-spacing:1.5px',
    'padding:4px 10px',
    'border-radius:20px',
    'z-index:2147483647',
    'font-family:Manrope,sans-serif',
    'pointer-events:none',
    'opacity:.75',
    'box-shadow:0 2px 8px rgba(124,92,252,.4)'
  ].join(';');
  document.body.appendChild(badge);
}

function verifyOverlayAuth(onVerified) {
  chrome.storage.local.get(['apexSession', 'apexLinkedAccounts', 'apexCurrentUser', 'apexIsAdmin'], function(r) {
    if (!r.apexSession || !r.apexSession.access_token) {
      showOverlayLoginForm(null, onVerified);
      return;
    }
    // ── Admin bypass: skip all linking/mismatch checks ──────────────────────
    if (r.apexIsAdmin === true) {
      removeOverlayAuthWrap();
      showAdminBadge();
      onVerified();
      return;
    }
    var linked = r.apexLinkedAccounts || [];
    var detectedUser = r.apexCurrentUser || storageUsername || '';
    if (linked.length === 0) {
      showOverlayLinkStep(null, onVerified);
      return;
    }
    if (linked.length > 0 && detectedUser) {
      var dn = detectedUser.toLowerCase();
      var matched = linked.some(function(a){ return a.username === dn; });
      if (!matched) {
        showOverlayMismatchScreen(detectedUser, onVerified);
        return;
      }
    }
    onVerified();
  });
}

// Load data after auth
function loadApexData() {
  var histKey = getHistoryKey();
  chrome.storage.local.get([histKey, 'apexLiveData'], function(result) {
    if (result[histKey]) {
      thirtyDayHistory = result[histKey];
      Object.keys(thirtyDayHistory).forEach(function(u) {
        thirtyDayHistory[u].sessionSnapshot = 0;
      });
    }
    if (result.apexLiveData) applyLiveData(result.apexLiveData);
  });
  setInterval(function() {
    chrome.storage.local.get(['apexLiveData'], function(result) {
      if (result.apexLiveData) applyLiveData(result.apexLiveData);
    });
  }, 3000);
}

// 30d history is loaded together with live data below (see boot load block)

// Merge session tips into 30-day history and prune entries older than 30 days
function merge30dHistory(fans) {
  var now = Date.now();
  var THIRTY_DAYS = 30 * 24 * 3600 * 1000;
  fans.forEach(function(f) {
    // Track ALL fans — create entry if not exists, always refresh lastSeen
    if (!thirtyDayHistory[f.username]) {
      thirtyDayHistory[f.username] = { total: 0, lastSeen: now };
    }
    thirtyDayHistory[f.username].lastSeen = now;
    // Only accumulate tip totals for users who have actually tipped
    if (f.tips > 0 && f.tips > (thirtyDayHistory[f.username].sessionSnapshot || 0)) {
      var delta = f.tips - (thirtyDayHistory[f.username].sessionSnapshot || 0);
      thirtyDayHistory[f.username].total += delta;
      thirtyDayHistory[f.username].sessionSnapshot = f.tips;
    }
  });
  // Prune entries not seen in 30 days
  Object.keys(thirtyDayHistory).forEach(function(u) {
    if (now - thirtyDayHistory[u].lastSeen > THIRTY_DAYS) delete thirtyDayHistory[u];
  });
  var _hk = getHistoryKey(); var _obj = {}; _obj[_hk] = thirtyDayHistory; chrome.storage.local.set(_obj);
}

function renderFanRows(list, label) {
  var fanListEl = document.getElementById('fans-list');
  var subEl     = document.getElementById('fans-sub-label');
  if (!fanListEl) return;
  if (subEl) subEl.textContent = label;

  if (!list || list.length === 0) {
    fanListEl.innerHTML = '<div class="fans-empty">No fans match this filter yet</div>';
    return;
  }

  var avColors = [
    'linear-gradient(135deg,#ffd166,#ff9f3a)',
    'linear-gradient(135deg,#ff3f6c,#ff8c42)',
    'linear-gradient(135deg,#4a9eff,#7c5cfc)',
    'linear-gradient(135deg,#06d6a0,#4affb0)',
    'linear-gradient(135deg,#7c5cfc,#b48aff)',
    'linear-gradient(135deg,#ff63a5,#ffb3d1)',
  ];
  var rankColors = ['g','s','b'];
  var thead = '<div class="fthead"><div class="fth c">#</div><div class="fth">User</div><div class="fth r">Tips</div><div class="fth c">In</div><div class="fth c">Out</div></div>';

  var rows = list.map(function(f, i) {
    var present = f.present !== false;
    var rank    = i < 3 ? rankColors[i] : '';
    var t       = Math.min(f.tier !== undefined ? f.tier : 4, 4);
    var tipAmt  = f.displayTips !== undefined ? f.displayTips : f.tips;
    return '<div class="fan-row' + (present ? '' : ' faded') + '">' +
      '<div><span class="rn ' + rank + '">' + (i+1) + '</span></div>' +
      '<div class="fuser">' +
        '<div class="fav" style="background:' + avColors[i % avColors.length] + ';color:#fff">' + f.username[0].toUpperCase() + '</div>' +
        '<div class="finfo">' +
          '<div class="fname">' + f.username + '</div>' +
          '<div class="fbadges">' +
            (t===1 ? '<span class="badge bw">🐋</span>' : t===2 ? '<span class="badge bg">🔥</span>' : '') +
            (i===0 ? '<span class="badge bg">🥇</span>' : i===1 ? '<span class="badge bs">🥈</span>' : i===2 ? '<span class="badge bb">🥉</span>' : '') +
            (f.joins > 2 ? '<span class="badge bl">🔁</span>' : '') +
            (!present ? '<span class="badge bx">↩</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="fp ' + (present ? 'on' : 'off') + '"></div>' +
      '</div>' +
      '<div><span class="ta' + (i < 3 ? ' top' : '') + '">' + (tipAmt > 0 ? tipAmt + ' tk' : '—') + '</span></div>' +
      '<div><span class="tc">' + (f.joins  || 0) + '</span></div>' +
      '<div><span class="tc">' + (f.leaves || 0) + '</span></div>' +
    '</div>';
  }).join('');

  fanListEl.innerHTML = thead + rows;
}

function updateFans(data) {
  var fans      = data.fans      || [];
  var totalTips = data.totalTips || 0;
  var viewers   = data.viewers   || 0;
  var tippers   = fans.filter(function(f){ return f.tips > 0; });

  // Merge session tips into 30d history
  merge30dHistory(fans);

  // Update header totals
  var totalEl = document.getElementById('fans-total');
  var totalLbl = document.getElementById('fans-total-label');
  var hist30total = Object.values(thirtyDayHistory).reduce(function(s,v){return s+v.total;},0);
  if (fanFilter === 'inroom') {
    if (totalEl)  totalEl.textContent  = totalTips + ' tk';
    if (totalLbl) totalLbl.textContent = 'Session total';
  } else {
    if (totalEl)  totalEl.textContent  = hist30total + ' tk';
    if (totalLbl) totalLbl.textContent = '30-day total';
  }

  // Apply active filter
  var list, label;

  // Shared helper: build a merged map of 30d history + current session fans
  function build30dList(filterFn) {
    var allUsers = {};
    // Seed from 30d history
    Object.entries(thirtyDayHistory).forEach(function(entry) {
      var u = entry[0], v = entry[1];
      allUsers[u] = { username: u, displayTips: v.total, tips: 0, joins: 0, leaves: 0, present: false, tier: 4 };
    });
    // Merge / add current session fans
    fans.forEach(function(f) {
      if (allUsers[f.username]) {
        allUsers[f.username].tips   = f.tips   || 0;
        allUsers[f.username].joins  = f.joins  || 0;
        allUsers[f.username].leaves = f.leaves || 0;
        allUsers[f.username].present = f.present !== false;
        if (f.tier !== undefined) allUsers[f.username].tier = f.tier;
      } else {
        allUsers[f.username] = {
          username:    f.username,
          displayTips: f.tips || 0,
          tips:        f.tips || 0,
          joins:       f.joins  || 0,
          leaves:      f.leaves || 0,
          present:     f.present !== false,
          tier:        f.tier !== undefined ? f.tier : 4,
        };
      }
    });
    var result = Object.values(allUsers);
    if (filterFn) result = result.filter(filterFn);
    return result.sort(function(a,b) {
      return b.displayTips !== a.displayTips
        ? b.displayTips - a.displayTips
        : (a.tier || 9) - (b.tier || 9);
    });
  }

  if (fanFilter === 'inroom') {
    // Use presentFans (all present users, uncapped) — tippers only
    var roomList = (data.presentFans && data.presentFans.length > 0)
              ? data.presentFans
              : fans.filter(function(f){ return f.present !== false; }).sort(function(a,b){ return b.tips - a.tips; });
    list  = roomList.filter(function(f){ return f.tips > 0; });
    label = 'Tippers currently in room';
  } else if (fanFilter === 'top30') {
    // Only fans with a positive 30d tip total
    list  = build30dList(function(f){ return thirtyDayHistory[f.username] && thirtyDayHistory[f.username].total > 0; });
    label = 'Top tippers — last 30 days';
  } else if (fanFilter === 'new') {
    list = fans.filter(function(f){
      return f.present !== false && f.tips === 0 && !thirtyDayHistory[f.username];
    });
    label = 'New viewers (no prior tips)';
  } else {
    // All — tippers only, ranked by 30-day total
    list  = build30dList(function(f){ return f.displayTips > 0; });
    label = 'Ranked by 30-day tips';
  }

  renderFanRows(list, label);

  // Wire filter chips (re-attach after each render)
  document.querySelectorAll('.fchip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      fanFilter = chip.getAttribute('data-filter') || 'all';
      document.querySelectorAll('.fchip').forEach(function(c){ c.classList.remove('active'); });
      chip.classList.add('active');
      updateFans(data);
    });
  });
}


// ── Settings page ─────────────────────────────────────────────────────────────
function getSettingsPage() {
  return `
<div class="set-hdr">
  <div class="set-title">Settings</div>
  <div class="set-sub">Customize Apex Revenue for your room</div>
</div>

<div class="set-sec">
  <div class="set-sec-lbl">Whale Detection</div>
  <div class="set-row">
    <div class="set-row-info"><div class="set-row-lbl">Whale threshold</div><div class="set-row-sub">Minimum tokens to classify a viewer as a whale</div></div>
    <input class="set-input" id="set-whale-threshold" type="number" min="10" max="500" value="50">
  </div>
  <div class="set-row">
    <div class="set-row-info"><div class="set-row-lbl">Whale alert</div><div class="set-row-sub">Flash alert when a whale enters the room</div></div>
    <label class="set-toggle"><input type="checkbox" id="set-whale-alert" checked><span class="set-slider"></span></label>
  </div>
</div>

<div class="set-divider"></div>

<div class="set-sec">
  <div class="set-sec-lbl">Monetization Prompts</div>
  <div class="set-row">
    <div class="set-row-info"><div class="set-row-lbl">Prompt frequency</div><div class="set-row-sub">How often to surface new suggestions</div></div>
    <select class="set-select" id="set-prompt-freq">
      <option value="30">30s</option>
      <option value="60" selected>1 min</option>
      <option value="120">2 min</option>
      <option value="300">5 min</option>
    </select>
  </div>
  <div class="set-row">
    <div class="set-row-info"><div class="set-row-lbl">Show estimated value</div><div class="set-row-sub">Display +$ value on each prompt card</div></div>
    <label class="set-toggle"><input type="checkbox" id="set-show-value" checked><span class="set-slider"></span></label>
  </div>
</div>

<div class="set-divider"></div>

<div class="set-sec">
  <div class="set-sec-lbl">Overlay</div>
  <div class="set-row">
    <div class="set-row-info"><div class="set-row-lbl">Overlay opacity</div><div class="set-row-sub">Transparency of the floating panel</div></div>
    <select class="set-select" id="set-opacity">
      <option value="0.85">85%</option>
      <option value="0.92" selected>92%</option>
      <option value="1.0">100%</option>
    </select>
  </div>
  <div class="set-row">
    <div class="set-row-info"><div class="set-row-lbl">Auto-minimise on stream start</div><div class="set-row-sub">Collapse overlay when broadcast begins</div></div>
    <label class="set-toggle"><input type="checkbox" id="set-auto-min"><span class="set-slider"></span></label>
  </div>
</div>

<div class="set-divider"></div>

<div class="set-sec">
  <div class="set-sec-lbl">Data</div>
  <div class="set-row">
    <div class="set-row-info"><div class="set-row-lbl">Save 30-day history</div><div class="set-row-sub">Persist fan tip history across sessions</div></div>
    <label class="set-toggle"><input type="checkbox" id="set-save-history" checked><span class="set-slider"></span></label>
  </div>
</div>

<div class="set-divider"></div>

<div class="set-sec" style="padding-bottom:14px">
  <div class="set-saved" id="set-saved-msg">✓ Settings saved</div>
  <button class="set-btn" id="set-save-btn">Save Settings</button>
  <button class="set-btn ghost" id="set-clear-btn">Clear 30-day History</button>
</div>

<div class="set-divider"></div>

<div class="set-sec">
  <div class="set-sec-lbl">Account</div>
  <div id="set-account-email" style="font-size:11px;color:var(--muted);margin-bottom:10px;padding:0 2px"></div>
  <button class="set-btn ghost" id="set-logout-btn" style="color:#e83e5a;border-color:rgba(232,62,90,.25)">Sign Out</button>
</div>

<div class="set-ver">Apex Revenue v0.6.1 · Creator Intelligence Engine</div>
</div>`;
}

function initSettings() {
  // Load saved settings
  if (typeof chrome !== 'undefined' && chrome.storage) {
    var _sk = getSettingsKey();
    chrome.storage.local.get([_sk], function(r) {
      var s = r[_sk] || {};
      if (s.whaleThreshold) document.getElementById('set-whale-threshold').value = s.whaleThreshold;
      if (s.whaleAlert    !== undefined) document.getElementById('set-whale-alert').checked   = s.whaleAlert;
      if (s.promptFreq)    document.getElementById('set-prompt-freq').value    = s.promptFreq;
      if (s.showValue     !== undefined) document.getElementById('set-show-value').checked    = s.showValue;
      if (s.opacity)       document.getElementById('set-opacity').value        = s.opacity;
      if (s.autoMin       !== undefined) document.getElementById('set-auto-min').checked      = s.autoMin;
      if (s.saveHistory   !== undefined) document.getElementById('set-save-history').checked  = s.saveHistory;
    });
  }

  // Save button
  var saveBtn = document.getElementById('set-save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      var settings = {
        whaleThreshold: parseInt(document.getElementById('set-whale-threshold').value) || 50,
        whaleAlert:     document.getElementById('set-whale-alert').checked,
        promptFreq:     parseInt(document.getElementById('set-prompt-freq').value) || 60,
        showValue:      document.getElementById('set-show-value').checked,
        opacity:        parseFloat(document.getElementById('set-opacity').value) || 0.92,
        autoMin:        document.getElementById('set-auto-min').checked,
        saveHistory:    document.getElementById('set-save-history').checked,
      };
      var _saveKey = getSettingsKey(); var _saveObj = {}; _saveObj[_saveKey] = settings; chrome.storage.local.set(_saveObj);

      // Apply opacity immediately to parent frame
      window.parent.postMessage({ source: 'apex-overlay', type: 'SET_OPACITY', value: settings.opacity }, '*');

      var msg = document.getElementById('set-saved-msg');
      if (msg) { msg.classList.add('show'); setTimeout(function(){ msg.classList.remove('show'); }, 2000); }
    });
  }

  // Clear history button
  var clearBtn = document.getElementById('set-clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      thirtyDayHistory = {};
      chrome.storage.local.remove([getHistoryKey()]);
      clearBtn.textContent = '✓ History cleared';
      clearBtn.style.color = 'var(--green)';
      setTimeout(function(){ clearBtn.textContent = 'Clear 30-day History'; clearBtn.style.color = ''; }, 2000);
    });
  }

  // Show logged-in email
  var accountEmail = document.getElementById('set-account-email');
  if (accountEmail) {
    apexGetSession().then(function(session) {
      if (session && session.user && session.user.email) {
        accountEmail.textContent = 'Signed in as ' + session.user.email;
      } else {
        accountEmail.textContent = 'Not signed in';
      }
    });
  }

  // Logout button
  var logoutBtn = document.getElementById('set-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      logoutBtn.disabled = true;
      logoutBtn.textContent = 'Signing out…';
      apexSignOut().then(function() {
        // Clear invite URL cache
        _apexInviteUrl = null;
        _apexAdminInviteUrl = null;
        // Reload the overlay to show the auth screen
        window.location.reload();
      }).catch(function() {
        window.location.reload();
      });
    });
  }

}
