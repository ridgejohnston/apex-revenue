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
  if (page === 'live')      c.innerHTML = getLivePage();
  else if (page === 'fans') c.innerHTML = getFansPage();
  else if (page === 'help') c.innerHTML = getHelpPage();
  else if (page === 'analytics') c.innerHTML = getAnalyticsPage();
  else if (page === 'settings') { c.innerHTML = getSettingsPage(); initSettings(); }
}

function getPlaceholder(icon, label, sub) {
  return '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:260px;gap:10px;padding:40px"><div style="font-size:36px;opacity:0.4">'+icon+'</div><div style="font-family:Syne,sans-serif;font-weight:800;font-size:16px;color:var(--muted)">'+label+'</div><div style="font-size:11px;color:var(--muted);opacity:0.6;text-align:center">'+sub+'</div></div>';
}

function getLivePage() { return `
<div class="alert-banner" id="alert-banner"><div class="alert-icon">🔥</div><div><div class="alert-label">High Tip Moment</div><div class="alert-text">3 whales in chat — launch a goal now</div></div><button class="alert-cta">Act Now</button></div>
<div class="stats-row">
  <div class="stat-card tips"><div class="stat-label">Tokens</div><div class="stat-value">$342<span>/hr</span></div><div class="stat-change">↑ 28%</div></div>
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
    <div class="fchip" data-filter="new">New</div>
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

<div class="hp-ver">Apex Revenue v0.5.1 · Creator Intelligence Engine</div>`; }

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

window.addEventListener('message', function(e) {
  // popout.js forwards content.js messages with source rewritten to 'apex-popout'
  if (!e.data || e.data.source !== 'apex-popout') return;
  if (e.data.type === 'LIVE_UPDATE') {
    applyLiveData(e.data.data);
  }
});

// Load 30d history + live data together so history is ready before first render
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.local.get(['apexLiveData', 'apex30dHistory'], function(result) {
    // Populate history first, resetting sessionSnapshot so new-session tips
    // are correctly accumulated (don't compare against last session's snapshot)
    if (result.apex30dHistory) {
      thirtyDayHistory = result.apex30dHistory;
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

function applyLiveData(data) {
  if (!data) return;
  lastData = data;

  // ── Stats row ───────────────────────────────────────────────────────────────
  var tipsEl = document.querySelector('.stat-card.tips .stat-value');
  if (tipsEl) tipsEl.innerHTML = '$' + (data.tokensPerHour || 0) + '<span>/hr</span>';

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
    if (footer) footer.textContent = '$' + (data.totalTips || 0);

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

  const whales     = data.whales     || [];
  const fans       = data.fans       || [];
  const viewers    = data.viewers    || 0;
  const totalTips  = data.totalTips  || 0;
  const tph        = data.tokensPerHour || 0;
  const convRate   = parseFloat(data.convRate) || 0;
  const activeWhales = whales.filter(w => w.present !== false);
  const tippers    = fans.filter(f => f.tips > 0);
  const lurkers    = viewers - tippers.length;

  // ── Generate alert banner ──────────────────────────────────────────────────
  let alertIcon = '💡', alertLabel = 'Tip', alertText = 'Watching your room…', alertCTA = null;

  if (activeWhales.length >= 3) {
    alertIcon  = '🔥'; alertLabel = 'Hot Moment';
    alertText  = activeWhales.length + ' whales in room — launch a goal or special offer now';
    alertCTA   = 'Act Now';
  } else if (activeWhales.length === 2) {
    alertIcon  = '🐋'; alertLabel = 'Whales Present';
    alertText  = activeWhales.slice(0,2).map(w=>w.username).join(' & ') + ' are watching — engage them directly';
    alertCTA   = 'Engage';
  } else if (activeWhales.length === 1) {
    alertIcon  = '⚡'; alertLabel = 'Whale Alert';
    alertText  = activeWhales[0].username + ' is in the room — personalise your next action';
    alertCTA   = 'Engage';
  } else if (tph > 200) {
    alertIcon  = '📈'; alertLabel = 'High Earnings';
    alertText  = 'You\'re earning $' + tph + '/hr — keep momentum with a countdown goal';
    alertCTA   = 'Set Goal';
  } else if (lurkers > viewers * 0.85 && viewers > 10) {
    alertIcon  = '👁️'; alertLabel = 'Lurker Heavy';
    alertText  = Math.round(lurkers) + ' viewers haven\'t tipped — time to activate them';
    alertCTA   = 'Activate';
  } else if (viewers > 50 && tippers.length === 0) {
    alertIcon  = '🎯'; alertLabel = 'High Traffic';
    alertText  = viewers + ' viewers with no tips yet — drop your tip menu now';
    alertCTA   = 'Drop Menu';
  } else if (totalTips > 0) {
    alertIcon  = '💰'; alertLabel = 'Session Active';
    alertText  = '$' + totalTips + ' earned · ' + tippers.length + ' tippers · keep engagement high';
    alertCTA   = null;
  }

  banner.querySelector('.alert-icon').textContent = alertIcon;
  banner.querySelector('.alert-label').textContent = alertLabel;
  banner.querySelector('.alert-text').textContent  = alertText;
  var ctaBtn = banner.querySelector('.alert-cta');
  if (alertCTA) { ctaBtn.textContent = alertCTA; ctaBtn.style.display = ''; }
  else { ctaBtn.style.display = 'none'; }

  // ── Generate prompt cards ──────────────────────────────────────────────────
  const prompts = [];

  // Prompt logic — scored by expected value
  if (activeWhales.length >= 2) {
    prompts.push({ heat:'hot', icon:'💰', action:'Launch an exclusive group show goal', reason: activeWhales.length + ' whales likely to tip big', value: Math.round(activeWhales.reduce((s,w)=>s+(w.tips||20),0)*0.4) });
  }

  if (activeWhales.length >= 1 && tph < 100) {
    const w = activeWhales[0];
    prompts.push({ heat:'hot', icon:'🎯', action:'Call out ' + w.username + ' by name', reason: 'Personal attention converts whales', value: Math.round((w.tips || 10) * 0.5 + 15) });
  }

  if (tippers.length > 0 && lurkers > 20) {
    prompts.push({ heat:'medium', icon:'📢', action:'Announce your tip menu out loud', reason: Math.round(lurkers) + ' lurkers need activation', value: Math.round(lurkers * 0.02 * 10) });
  }

  if (convRate < 2 && viewers > 20) {
    prompts.push({ heat:'medium', icon:'✨', action:'Run a quick viewer poll in chat', reason: 'Low conv rate (' + convRate + '%) — polls activate lurkers', value: Math.round(viewers * 0.015 * 10) });
  }

  if (tph > 150) {
    prompts.push({ heat:'hot', icon:'⏱️', action:'Set a 5-minute countdown goal', reason: 'Momentum is high — capitalize now', value: Math.round(tph * 0.15) });
  }

  if (tippers.length >= 3 && totalTips > 50) {
    const top = tippers[0];
    prompts.push({ heat:'medium', icon:'🏆', action:'Thank ' + top.username + ' as top tipper', reason: 'Public recognition drives repeat tips', value: Math.round(top.tips * 0.2 + 10) });
  }

  if (viewers > 100 && tippers.length < 5) {
    prompts.push({ heat:'hot', icon:'🎪', action:'Tease an exclusive unlock goal', reason: 'Large room with few tippers — create urgency', value: Math.round(viewers * 0.03 * 10) });
  }

  if (prompts.length === 0) {
    if (viewers > 0) {
      prompts.push({ heat:'', icon:'👋', action:'Greet new viewers and mention your tip menu', reason: 'Building rapport converts first-timers', value: 10 });
      prompts.push({ heat:'', icon:'💬', action:'Ask viewers what they want to see', reason: 'Engagement question boosts tip intent', value: 8 });
    } else {
      prompts.push({ heat:'', icon:'⏳', action:'Waiting for viewers to load…', reason: 'Data will appear shortly', value: 0 });
    }
  }

  // Sort by value descending, cap at 4
  prompts.sort((a,b) => b.value - a.value);
  const top4 = prompts.slice(0, 4);

  promptSec.innerHTML = top4.map(function(p) {
    return '<div class="prompt-card ' + (p.heat||'') + '">' +
      '<div class="pe">' + p.icon + '</div>' +
      '<div><div class="pa">' + p.action + '</div><div class="pm">' + p.reason + '</div></div>' +
      (p.value > 0 ? '<div class="pv">+$' + p.value + '</div>' : '') +
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
    peakLabel = '📊 $' + totalTips + ' session';
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
    insight = viewers + ' viewers in room — set your tip floor to ' + recommended + ' tokens to start converting';
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
      insight = 'High demand (' + demandScore + '/100) — raise your floor to ' + recommended + ' tokens now';
    } else if (whales.length >= 2 && avgTip < 50) {
      insight = whales.length + ' whales present — consider a ' + recommended + ' token floor or exclusive offer';
    } else if (convRate > 5) {
      insight = 'Strong ' + convRate + '% conversion — your audience will support a ' + recommended + ' token floor';
    } else if (convRate < 2 && tippers.length > 0) {
      insight = 'Low conversion at ' + convRate + '% — keep floor at ' + recommended + ' tokens to encourage more tippers';
    } else if (tph > 200) {
      insight = 'Earning $' + tph + '/hr — demand supports a ' + recommended + ' token floor';
    } else {
      insight = 'Based on ' + tipEvents.length + ' tips averaging ' + avgTip + ' tokens — ' + recommended + ' token floor recommended';
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
  <div class="an-card c1"><div class="an-card-lbl">Total Earned</div><div class="an-card-val" id="an-total">0<span> tk</span></div><div class="an-card-sub" id="an-total-sub">this session</div></div>
  <div class="an-card c2"><div class="an-card-lbl">Viewers</div><div class="an-card-val" id="an-viewers">0</div><div class="an-card-sub" id="an-viewers-sub">in room now</div></div>
  <div class="an-card c3"><div class="an-card-lbl">Conversion</div><div class="an-card-val" id="an-conv">0<span>%</span></div><div class="an-card-sub" id="an-conv-sub">viewers who tipped</div></div>
  <div class="an-card c4"><div class="an-card-lbl">Avg Tip</div><div class="an-card-val" id="an-avg">—<span></span></div><div class="an-card-sub" id="an-avg-sub">per transaction</div></div>
  <div class="an-card c5"><div class="an-card-lbl">Tip Rate</div><div class="an-card-val" id="an-tph">0<span>/hr</span></div><div class="an-card-sub" id="an-tph-sub">tokens per hour</div></div>
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
  set('an-tph',           tph);
  set('an-tippers',       tippers.length);
  set('an-viewers-sub',   viewers === 1 ? '1 viewer now' : viewers + ' viewers now');
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

// 30d history is loaded together with live data below (see boot load block)

// Merge session tips into 30-day history and prune entries older than 30 days
function merge30dHistory(fans) {
  var now = Date.now();
  var THIRTY_DAYS = 30 * 24 * 3600 * 1000;
  fans.forEach(function(f) {
    if (f.tips <= 0) return;
    if (!thirtyDayHistory[f.username]) {
      thirtyDayHistory[f.username] = { total: 0, lastSeen: now };
    }
    // Update if session tip is higher (avoids double-counting across page reloads)
    if (f.tips > (thirtyDayHistory[f.username].sessionSnapshot || 0)) {
      var delta = f.tips - (thirtyDayHistory[f.username].sessionSnapshot || 0);
      thirtyDayHistory[f.username].total += delta;
      thirtyDayHistory[f.username].sessionSnapshot = f.tips;
      thirtyDayHistory[f.username].lastSeen = now;
    }
  });
  // Prune stale entries
  Object.keys(thirtyDayHistory).forEach(function(u) {
    if (now - thirtyDayHistory[u].lastSeen > THIRTY_DAYS) delete thirtyDayHistory[u];
  });
  chrome.storage.local.set({ apex30dHistory: thirtyDayHistory });
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
    list  = fans.filter(function(f){ return f.present !== false; })
                .sort(function(a,b){ return b.tips - a.tips; });
    label = 'Viewers currently in room';
  } else if (fanFilter === 'top30') {
    // Only fans who appear in 30d history
    list  = build30dList(function(f){ return thirtyDayHistory[f.username]; });
    label = 'Top tippers — last 30 days';
  } else if (fanFilter === 'new') {
    list = fans.filter(function(f){
      return f.present !== false && f.tips === 0 && !thirtyDayHistory[f.username];
    });
    label = 'New viewers (no prior tips)';
  } else {
    // All — 30-day rank: history fans + current session fans, sorted by 30d total
    list  = build30dList(null);
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
  <div class="set-ver">Apex Revenue v0.5.1 · Creator Intelligence Engine</div>
</div>`;
}

function initSettings() {
  // Load saved settings
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['apexSettings'], function(r) {
      var s = r.apexSettings || {};
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
      chrome.storage.local.set({ apexSettings: settings });

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
      chrome.storage.local.remove(['apex30dHistory']);
      clearBtn.textContent = '✓ History cleared';
      clearBtn.style.color = 'var(--green)';
      setTimeout(function(){ clearBtn.textContent = 'Clear 30-day History'; clearBtn.style.color = ''; }, 2000);
    });
  }
}
