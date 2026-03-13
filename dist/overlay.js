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
<style>
.alert-banner{margin:12px 12px 0;background:linear-gradient(135deg,rgba(255,63,108,0.12),rgba(255,140,66,0.08));border:1px solid rgba(255,63,108,0.25);border-radius:10px;padding:10px 12px;display:flex;align-items:center;gap:10px}
.alert-icon{font-size:18px;flex-shrink:0}.alert-label{font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--accent);margin-bottom:2px}
.alert-text{font-size:11px;color:var(--text)}.alert-cta{background:var(--accent);color:#fff;border:none;border-radius:6px;padding:5px 10px;font-size:9px;font-weight:700;cursor:pointer;white-space:nowrap;margin-left:auto}
.stats-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;padding:10px 12px}
.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:9px 9px 7px;position:relative;overflow:hidden}
.stat-label{font-size:7px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);margin-bottom:3px}
.stat-value{font-family:'Syne',sans-serif;font-weight:800;font-size:18px;color:var(--text);line-height:1}
.stat-value span{font-size:10px;color:var(--muted)}.stat-change{font-size:8px;font-weight:600;margin-top:3px;color:var(--green)}
.stat-card.tips::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--accent),var(--accent2))}
.stat-card.viewers::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#4a9eff,#7c5cfc)}
.stat-card.conv::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--green),#4affb0)}
.section-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px}
.section-ttl{font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted)}
.section-lnk{font-size:8px;font-weight:600;color:var(--accent);cursor:pointer}
.section{padding:0 12px 10px}.divider{height:1px;background:var(--border);margin:0 12px 10px}
.whale-section{padding:0 12px 10px}.whale-table{background:var(--surface);border:1px solid var(--border);border-radius:10px;overflow:hidden}
.whale-thead{display:grid;grid-template-columns:1fr 70px 38px 38px;padding:6px 10px;gap:4px;border-bottom:1px solid var(--border)}
.whale-th{font-size:7px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted)}.whale-th.c{text-align:center}
.whale-row{display:grid;grid-template-columns:1fr 70px 38px 38px;padding:8px 10px;gap:4px;align-items:center;border-bottom:1px solid rgba(255,255,255,0.03)}
.whale-row.left{opacity:0.4}.whale-id{display:flex;align-items:center;gap:7px;min-width:0}
.av{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;position:relative;flex-shrink:0}
.av.t1{background:linear-gradient(135deg,#ffd166,#ff9f3a)}.av.t2{background:linear-gradient(135deg,#c0c0d0,#8a8aa0)}.av.t3{background:linear-gradient(135deg,#cd7f32,#8b5a2b)}
.sd{position:absolute;bottom:-1px;right:-1px;width:6px;height:6px;border-radius:50%;border:1.5px solid var(--bg)}
.sd.on{background:var(--green)}.sd.off{background:#444}
.wname{font-size:10px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wrank{font-size:8px;color:var(--muted)}.wtips{font-family:'DM Mono',monospace;font-size:11px;font-weight:500;color:var(--gold);text-align:right}
.wc{text-align:center;font-family:'DM Mono',monospace;font-size:10px;color:var(--muted)}
.whale-footer{display:flex;justify-content:space-between;padding:6px 10px 0;font-size:9px}
.wftl{color:var(--muted)}.wftv{font-family:'DM Mono',monospace;font-weight:700;color:var(--gold)}
.prompt-card{display:flex;align-items:center;gap:9px;background:var(--surface);border:1px solid var(--border);border-radius:9px;padding:9px 11px;margin-bottom:6px;cursor:pointer}
.prompt-card.hot{border-color:rgba(255,63,108,0.3);background:rgba(255,63,108,0.06)}.prompt-card.medium{border-color:rgba(255,209,102,0.2)}
.pe{font-size:16px;flex-shrink:0}.pa{font-size:11px;font-weight:600;color:var(--text);margin-bottom:1px}.pm{font-size:8px;color:var(--muted)}
.pv{font-family:'DM Mono',monospace;font-size:12px;font-weight:700;color:var(--green);margin-left:auto;flex-shrink:0}
.heat-wrap{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px}
.hlr{display:flex;justify-content:space-between;margin-bottom:7px;font-size:8px;color:var(--muted);font-weight:600}
.hbars{display:flex;align-items:flex-end;gap:3px;height:32px}.hbar{flex:1;border-radius:3px 3px 0 0;min-height:3px}
.htime{display:flex;justify-content:space-between;margin-top:5px;font-size:7px;color:var(--muted);font-family:'DM Mono',monospace}
.pricing-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;overflow:hidden}
.pr-row{display:flex;align-items:center;justify-content:space-around;padding:10px}.pr-item{text-align:center}
.pr-type{font-size:7px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:3px}
.pr-amt{font-family:'Syne',sans-serif;font-weight:800;font-size:20px}
.pr-amt.cur{color:var(--muted)}.pr-amt.rec{color:var(--gold)}.pr-amt.max{color:var(--accent)}
.pr-div{width:1px;height:26px;background:var(--border)}
.ai-box{display:flex;align-items:flex-start;gap:7px;padding:7px 9px;background:rgba(108,99,255,0.06);border-top:1px solid var(--border)}
.ai-ic{font-size:12px;flex-shrink:0;margin-top:1px}.ai-tx{font-size:9px;color:var(--muted);line-height:1.5}
</style>
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
    <div class="whale-row"><div class="whale-id"><div class="av t1" style="font-size:10px;font-weight:700;color:#fff">B<div class="sd on"></div></div><div><div class="wname">BigSpender99</div><div class="wrank">#1 · Gold</div></div></div><div class="wtips">$248</div><div class="wc">4</div><div class="wc">3</div></div>
    <div class="whale-row"><div class="whale-id"><div class="av t2" style="font-size:10px;font-weight:700;color:#fff">R<div class="sd on"></div></div><div><div class="wname">RichViewer42</div><div class="wrank">#2 · Silver</div></div></div><div class="wtips">$115</div><div class="wc">2</div><div class="wc">1</div></div>
    <div class="whale-row"><div class="whale-id"><div class="av t1" style="font-size:10px;font-weight:700;color:#fff">K<div class="sd on"></div></div><div><div class="wname">KingTipper</div><div class="wrank">#3 · Gold</div></div></div><div class="wtips">$90</div><div class="wc">3</div><div class="wc">2</div></div>
    <div class="whale-row left"><div class="whale-id"><div class="av t3" style="font-size:10px;font-weight:700;color:#fff">C<div class="sd off"></div></div><div><div class="wname">CryptoWhale7</div><div class="wrank">Left room</div></div></div><div class="wtips">$55</div><div class="wc">1</div><div class="wc">1</div></div>
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
<style>
.fans-hdr{padding:12px 12px 0}.fans-tr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:9px}
.fans-title{font-family:'Syne',sans-serif;font-weight:800;font-size:14px;color:var(--text)}.fans-sub{font-size:9px;color:var(--muted);margin-top:2px}
.fans-sv{font-family:'Syne',sans-serif;font-weight:800;font-size:16px;color:var(--gold)}.fans-sl{font-size:8px;color:var(--muted)}
.fchips{display:flex;gap:5px;padding-bottom:10px;overflow-x:auto}
.fchip{background:var(--surface2);border:1px solid var(--border);border-radius:20px;padding:4px 9px;font-size:9px;font-weight:600;color:var(--muted);cursor:pointer;white-space:nowrap;flex-shrink:0}
.fchip.active{background:rgba(255,63,108,0.15);border-color:rgba(255,63,108,0.4);color:var(--accent)}
.fans-list{padding:0 0 12px}.fthead{display:grid;grid-template-columns:28px 1fr 55px 24px 24px;padding:6px 12px;gap:3px;border-bottom:1px solid var(--border)}
.fth{font-size:7px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted)}.fth.r{text-align:right}.fth.c{text-align:center}
.fan-row{display:grid;grid-template-columns:28px 1fr 55px 24px 24px;padding:7px 12px;gap:3px;align-items:center;border-bottom:1px solid rgba(255,255,255,0.03)}
.fan-row.faded{opacity:0.4}.rn{font-family:'DM Mono',monospace;font-size:10px;font-weight:600;color:var(--muted);text-align:center;display:block}
.rn.g{color:var(--gold)}.rn.s{color:#c0c0d0}.rn.b{color:#cd7f32}
.fuser{display:flex;align-items:center;gap:6px;min-width:0}.fav{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0}
.finfo{flex:1;min-width:0}.fname{font-size:10px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fbadges{display:flex;gap:3px;flex-wrap:wrap;margin-top:1px}.fp{width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-left:auto}
.fp.on{background:var(--green)}.fp.off{background:#444}
.badge{font-size:7px;font-weight:700;padding:1px 4px;border-radius:3px;white-space:nowrap}
.bw{background:rgba(255,209,102,0.15);color:var(--gold);border:1px solid rgba(255,209,102,0.25)}
.bg{background:rgba(255,209,102,0.12);color:#e8c060;border:1px solid rgba(255,209,102,0.2)}
.bs{background:rgba(192,192,208,0.12);color:#b0b0c8;border:1px solid rgba(192,192,208,0.2)}
.bb{background:rgba(205,127,50,0.12);color:#cd7f32;border:1px solid rgba(205,127,50,0.2)}
.bl{background:rgba(108,99,255,0.15);color:#9f9bff;border:1px solid rgba(108,99,255,0.25)}
.bn{background:rgba(6,214,160,0.12);color:var(--green);border:1px solid rgba(6,214,160,0.2)}
.bx{background:rgba(255,255,255,0.05);color:var(--muted);border:1px solid var(--border)}
.ta{font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);display:block;text-align:right}.ta.top{color:var(--gold)}
.tc{font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);display:block;text-align:center}
.fans-empty{text-align:center;padding:24px;font-size:10px;color:var(--muted);opacity:0.6}
</style>
<div class="fans-hdr">
  <div class="fans-tr">
    <div><div class="fans-title">Fan Leaderboard</div><div class="fans-sub" id="fans-sub-label">Ranked by session tips</div></div>
    <div style="text-align:right"><div class="fans-sv" id="fans-total">$0</div><div class="fans-sl" id="fans-total-label">Session tips</div></div>
  </div>
  <div class="fchips">
    <div class="fchip active" data-filter="all">All</div>
    <div class="fchip" data-filter="inroom">In Room</div>
    <div class="fchip" data-filter="top30">Top Tippers</div>
    <div class="fchip" data-filter="new">New</div>
  </div>
</div>
<div class="fans-list" id="fans-list">
  <div class="fans-empty">Loading fan data…</div>
</div>`; }

function getHelpPage() { return `
<style>
.hp-hdr{padding:12px 12px 8px}
.hp-title{font-family:'Syne',sans-serif;font-weight:800;font-size:14px;color:var(--text)}
.hp-sub{font-size:9px;color:var(--muted);margin-top:2px}
.hp-sec{padding:6px 12px 4px}
.hp-sec-lbl{font-size:8px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);margin-bottom:8px}
.hp-card{display:flex;align-items:flex-start;gap:10px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:6px}
.hp-card-ic{font-size:18px;flex-shrink:0;margin-top:1px}
.hp-card-ttl{font-size:10px;font-weight:700;color:var(--text);margin-bottom:3px}
.hp-card-tx{font-size:9px;color:var(--muted);line-height:1.5}
.hp-badge-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:6px}
.hp-badge-item{display:flex;align-items:flex-start;gap:7px;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px 9px}
.hp-badge-pill{font-size:8px;font-weight:700;padding:2px 6px;border-radius:4px;white-space:nowrap;flex-shrink:0;margin-top:1px}
.hp-badge-desc{font-size:8px;color:var(--muted);line-height:1.4}
.hp-divider{height:1px;background:var(--border);margin:4px 12px 8px}
.hp-suggest{margin:0 12px 6px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:11px 12px}
.hp-suggest-ttl{font-size:10px;font-weight:700;color:var(--text);margin-bottom:4px}
.hp-suggest-sub{font-size:8px;color:var(--muted);margin-bottom:9px}
.hp-cat-chips{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:9px}
.hp-cat{background:var(--surface2);border:1px solid var(--border);border-radius:20px;padding:4px 9px;font-size:8px;font-weight:600;color:var(--muted);cursor:pointer}
.hp-cat.active{background:rgba(255,63,108,0.15);border-color:rgba(255,63,108,0.4);color:var(--accent)}
.hp-textarea{width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:7px;color:var(--text);font-size:9px;font-family:'Manrope',sans-serif;padding:7px 9px;outline:none;resize:none;box-sizing:border-box;line-height:1.5}
.hp-textarea:focus{border-color:rgba(255,63,108,0.4)}
.hp-textarea::placeholder{color:var(--muted);opacity:0.5}
.hp-submit{width:100%;margin-top:7px;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;border-radius:8px;color:#fff;font-size:10px;font-weight:700;padding:9px;cursor:pointer;letter-spacing:0.5px}
.hp-submit:hover{filter:brightness(1.1)}
.hp-submit:active{transform:scale(0.98)}
.hp-submit-sent{text-align:center;font-size:9px;color:var(--green);padding:4px 0 2px;display:none}
.hp-ver{font-size:8px;color:var(--muted);text-align:center;opacity:0.4;padding:10px 0 14px;letter-spacing:0.5px}
</style>

<div class="hp-hdr">
  <div class="hp-title">Help & Support</div>
  <div class="hp-sub">Everything you need to get started</div>
</div>

<div class="hp-sec">
  <div class="hp-sec-lbl">Quick Start</div>
  <div class="hp-card"><div class="hp-card-ic">⚡</div><div><div class="hp-card-ttl">Live Tab</div><div class="hp-card-tx">Real-time viewer and tip tracking. Watch your whale tracker, heat map, and AI prompts update live as tips come in.</div></div></div>
  <div class="hp-card"><div class="hp-card-ic">🐋</div><div><div class="hp-card-ttl">Whale Tracker</div><div class="hp-card-tx">Identify and track your top spenders. Avatars show initials with Gold, Silver, and Bronze tiers based on tip volume.</div></div></div>
  <div class="hp-card"><div class="hp-card-ic">💜</div><div><div class="hp-card-ttl">Fan Leaderboard</div><div class="hp-card-tx">See who your loyal fans are. Filter by In Room, Top Tippers, or New viewers. 30-day history persists across sessions.</div></div></div>
  <div class="hp-card"><div class="hp-card-ic">🤖</div><div><div class="hp-card-ttl">AI Price Recommendation</div><div class="hp-card-tx">Smart pricing based on your room demand score, conversion rate, whale presence, and live tip patterns.</div></div></div>
</div>

<div class="hp-divider"></div>

<div class="hp-sec">
  <div class="hp-sec-lbl">Badge Legend</div>
  <div class="hp-badge-grid">
    <div class="hp-badge-item"><span class="hp-badge-pill" style="background:rgba(255,209,102,0.15);color:var(--gold);border:1px solid rgba(255,209,102,0.3)">🐋 WHALE</span><div class="hp-badge-desc">$50+ tips this session</div></div>
    <div class="hp-badge-item"><span class="hp-badge-pill" style="background:rgba(255,209,102,0.12);color:#e8c060;border:1px solid rgba(255,209,102,0.2)">🥇 GOLD</span><div class="hp-badge-desc">#1 tipper this session</div></div>
    <div class="hp-badge-item"><span class="hp-badge-pill" style="background:rgba(192,192,208,0.12);color:#b0b0c8;border:1px solid rgba(192,192,208,0.2)">🥈 SILVER</span><div class="hp-badge-desc">#2 tipper this session</div></div>
    <div class="hp-badge-item"><span class="hp-badge-pill" style="background:rgba(205,127,50,0.12);color:#cd7f32;border:1px solid rgba(205,127,50,0.2)">🥉 BRONZE</span><div class="hp-badge-desc">#3 tipper this session</div></div>
    <div class="hp-badge-item"><span class="hp-badge-pill" style="background:rgba(108,99,255,0.15);color:#9f9bff;border:1px solid rgba(108,99,255,0.25)">🔁 LOYAL</span><div class="hp-badge-desc">Joined 3+ times</div></div>
    <div class="hp-badge-item"><span class="hp-badge-pill" style="background:rgba(6,214,160,0.12);color:var(--green);border:1px solid rgba(6,214,160,0.2)">✨ NEW</span><div class="hp-badge-desc">First time in room</div></div>
    <div class="hp-badge-item"><span class="hp-badge-pill" style="background:rgba(255,255,255,0.05);color:var(--muted);border:1px solid var(--border)">↩ LEFT</span><div class="hp-badge-desc">No longer in room</div></div>
  </div>
</div>

<div class="hp-divider"></div>

<div class="hp-suggest">
  <div class="hp-suggest-ttl">Suggest a Feature</div>
  <div class="hp-suggest-sub">Help shape what we build next</div>
  <div class="hp-cat-chips">
    <div class="hp-cat active" data-cat="feature">Feature Request</div>
    <div class="hp-cat" data-cat="bug">Bug Report</div>
    <div class="hp-cat" data-cat="integration">Integration</div>
    <div class="hp-cat" data-cat="other">Other</div>
  </div>
  <textarea class="hp-textarea" id="hp-suggest-text" rows="3" placeholder="Describe your idea or issue…"></textarea>
  <button class="hp-submit" id="hp-submit-btn">Submit Feedback</button>
  <div class="hp-submit-sent" id="hp-submit-sent">✓ Thanks! Feedback received.</div>
</div>

<div class="hp-ver">Apex Revenue v0.6.0 · Creator Intelligence Engine</div>`; }

function updateHelp(data) {
  if (currentPage !== 'help') return;
  // Wire category chip toggles
  document.querySelectorAll('.hp-cat').forEach(function(chip) {
    chip.addEventListener('click', function() {
      document.querySelectorAll('.hp-cat').forEach(function(c){ c.classList.remove('active'); });
      chip.classList.add('active');
    });
  });
  // Wire submit button
  var submitBtn = document.getElementById('hp-submit-btn');
  var sentMsg   = document.getElementById('hp-submit-sent');
  if (submitBtn && !submitBtn._wired) {
    submitBtn._wired = true;
    submitBtn.addEventListener('click', function() {
      var text = (document.getElementById('hp-suggest-text') || {}).value || '';
      if (!text.trim()) return;
      var cat  = (document.querySelector('.hp-cat.active') || {}).getAttribute('data-cat') || 'feature';
      // Store locally since no backend yet
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['apexFeedback'], function(r) {
          var fb = r.apexFeedback || [];
          fb.push({ cat: cat, text: text, ts: Date.now() });
          chrome.storage.local.set({ apexFeedback: fb });
        });
      }
      document.getElementById('hp-suggest-text').value = '';
      if (sentMsg) { sentMsg.style.display = 'block'; setTimeout(function(){ sentMsg.style.display = 'none'; }, 3000); }
    });
  }
}

// Boot
renderPage('live');

// ── Live data updates from content.js ────────────────────────────────────────
var currentPage = 'live';
var lastData = null;
var viewerHistory = []; // [{v, ts}] — rolling viewer count snapshots for audience peak chart

// Track nav changes so we know which page is active
document.querySelectorAll('.nav-item').forEach(function(item) {
  item.addEventListener('click', function() {
    currentPage = item.getAttribute('data-page');
  });
});

window.addEventListener('message', function(e) {
  if (!e.data || e.data.source !== 'apex-content') return;
  if (e.data.type === 'LIVE_UPDATE') {
    applyLiveData(e.data.data);
  }
});

// Also poll chrome.storage in case message was missed
if (typeof chrome !== 'undefined' && chrome.storage) {
  setInterval(function() {
    chrome.storage.local.get(['apexLiveData'], function(result) {
      if (result.apexLiveData) applyLiveData(result.apexLiveData);
    });
  }, 3000);
}

function applyLiveData(data) {
  if (!data) return;
  lastData = data;

  // ── Viewer history snapshot ──────────────────────────────────────────────────
  viewerHistory.push({ v: data.viewers || 0, ts: Date.now() });
  if (viewerHistory.length > 60) viewerHistory.shift();

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
    var tierClass = ['t1','t1','t1','t2','t3'];
    var tierLabel = ['Gold','Gold','Gold','Silver','Bronze'];
    var whales    = (data.whales && data.whales.length > 0) ? data.whales : (data.fans || []);
    var theadHTML = '<div class="whale-thead"><div class="whale-th">Viewer</div><div class="whale-th" style="text-align:right">Tips</div><div class="whale-th c">In</div><div class="whale-th c">Out</div></div>';

    var rowsHTML = whales.slice(0, 5).map(function(w, i) {
      var t = Math.min(w.tier !== undefined ? w.tier : 4, 4);
      var present = w.present !== false;
      var tipLabel = w.tips > 0 ? ('$' + w.tips) : '—';
      var initial = w.username ? w.username[0].toUpperCase() : '?';
      var rankStr = present ? tierLabel[t] : 'Left room';
      return '<div class="whale-row' + (present ? '' : ' left') + '">' +
        '<div class="whale-id"><div class="av ' + tierClass[t] + '" style="font-size:10px;font-weight:700;color:#fff">' + initial +
        '<div class="sd ' + (present ? 'on' : 'off') + '"></div></div>' +
        '<div><div class="wname">' + w.username + '</div>' +
        '<div class="wrank">#' + (i+1) + ' · ' + rankStr + '</div></div></div>' +
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
function getAnalyticsPage() { return `
<style>
.an-hdr{padding:12px 12px 6px}.an-title{font-family:'Syne',sans-serif;font-weight:800;font-size:14px;color:var(--text)}.an-sub{font-size:9px;color:var(--muted);margin-top:2px}
.an-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;padding:0 12px 10px}
.an-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:9px 10px;position:relative;overflow:hidden}
.an-card-lbl{font-size:7px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);margin-bottom:3px}
.an-card-val{font-family:'Syne',sans-serif;font-weight:800;font-size:17px;color:var(--text);line-height:1}.an-card-val span{font-size:9px;color:var(--muted)}
.an-card::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px}
.an-card.c1::after{background:linear-gradient(90deg,var(--accent),var(--accent2))}.an-card.c2::after{background:linear-gradient(90deg,#4a9eff,#7c5cfc)}.an-card.c3::after{background:linear-gradient(90deg,var(--green),#4affb0)}.an-card.c4::after{background:linear-gradient(90deg,var(--gold),#ffaa00)}.an-card.c5::after{background:linear-gradient(90deg,#ff63a5,#ff3f6c)}.an-card.c6::after{background:linear-gradient(90deg,#7c5cfc,#b48aff)}
.an-divider{height:1px;background:var(--border);margin:0 12px 10px}
.an-sec{padding:0 12px 10px}.an-sec-lbl{font-size:8px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);margin-bottom:7px}
.an-peak-wrap{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px}
.an-peak-row{display:flex;justify-content:space-around;margin-bottom:9px}
.an-peak-item{text-align:center}.an-peak-val{font-family:'Syne',sans-serif;font-weight:800;font-size:15px;color:var(--text)}.an-peak-lbl{font-size:7px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-top:2px}
.an-vbars{display:flex;align-items:flex-end;gap:2px;height:36px}.an-vbar{flex:1;border-radius:2px 2px 0 0;min-height:3px}
.an-vtime{display:flex;justify-content:space-between;margin-top:4px;font-size:7px;color:var(--muted);font-family:'DM Mono',monospace}
.an-pace-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
.an-pace-lbl{font-size:9px;color:var(--muted)}.an-pace-val{font-family:'DM Mono',monospace;font-size:10px;font-weight:600;color:var(--text)}
.an-pace-val.up{color:var(--green)}.an-pace-val.warn{color:var(--gold)}.an-pace-val.hot{color:var(--accent)}
.an-tip-row{display:flex;align-items:center;gap:7px;margin-bottom:5px}
.an-tip-bar-wrap{flex:1;height:5px;background:var(--surface2);border-radius:3px;overflow:hidden}.an-tip-bar{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--accent),var(--accent2))}
.an-tip-user{font-size:9px;font-weight:600;color:var(--text);width:72px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.an-tip-amt{font-family:'DM Mono',monospace;font-size:9px;color:var(--gold);width:38px;text-align:right;flex-shrink:0}
.an-table{background:var(--surface);border:1px solid var(--border);border-radius:10px;overflow:hidden}
.an-row{display:grid;padding:7px 10px;border-bottom:1px solid rgba(255,255,255,0.03);align-items:center;gap:5px}
.an-row:last-child{border-bottom:none}.an-row.whale-r{grid-template-columns:18px 1fr 46px 8px}.an-row.fan-r{grid-template-columns:18px 1fr 52px}
.an-rnum{font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);text-align:center}
.an-rinfo{display:flex;flex-direction:column;gap:2px;min-width:0}.an-rname{font-size:10px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.an-rbadge{font-size:7px;font-weight:700;padding:1px 5px;border-radius:3px;align-self:flex-start;white-space:nowrap}
.an-ramt{font-family:'DM Mono',monospace;font-size:10px;color:var(--gold);text-align:right}
.an-rdot{width:6px;height:6px;border-radius:50%;flex-shrink:0}.an-rdot.on{background:var(--green)}.an-rdot.off{background:#444}
.an-empty{text-align:center;padding:14px;font-size:10px;color:var(--muted);opacity:0.6}
</style>
<div class="an-hdr"><div class="an-title">Analytics</div><div class="an-sub" id="an-session-time">Session started just now</div></div>
<div class="an-grid">
  <div class="an-card c1"><div class="an-card-lbl">Total Earned</div><div class="an-card-val" id="an-total">0<span> tk</span></div></div>
  <div class="an-card c2"><div class="an-card-lbl">Viewers</div><div class="an-card-val" id="an-viewers">0</div></div>
  <div class="an-card c3"><div class="an-card-lbl">Conv.</div><div class="an-card-val" id="an-conv">0<span>%</span></div></div>
  <div class="an-card c4"><div class="an-card-lbl">Avg Tip</div><div class="an-card-val" id="an-avg">—</div></div>
  <div class="an-card c5"><div class="an-card-lbl">Tip Rate</div><div class="an-card-val" id="an-tph">0<span>/hr</span></div></div>
  <div class="an-card c6"><div class="an-card-lbl">Tippers</div><div class="an-card-val" id="an-tippers">0</div></div>
</div>
<div class="an-divider"></div>
<div class="an-sec">
  <div class="an-sec-lbl">Audience Peak Tracking</div>
  <div class="an-peak-wrap">
    <div class="an-peak-row">
      <div class="an-peak-item"><div class="an-peak-val" id="an-v-now">0</div><div class="an-peak-lbl">Now</div></div>
      <div class="an-peak-item"><div class="an-peak-val" id="an-v-peak" style="color:var(--gold)">0</div><div class="an-peak-lbl">Peak</div></div>
      <div class="an-peak-item"><div class="an-peak-val" id="an-v-avg">0</div><div class="an-peak-lbl">Avg</div></div>
      <div class="an-peak-item"><div class="an-peak-val" id="an-v-trend" style="font-size:14px">→</div><div class="an-peak-lbl">Trend</div></div>
    </div>
    <div class="an-vbars" id="an-vbars"></div>
    <div class="an-vtime" id="an-vtime"></div>
  </div>
</div>
<div class="an-divider"></div>
<div class="an-sec">
  <div class="an-sec-lbl">Tip Volume</div>
  <div>
    <div class="an-pace-row"><span class="an-pace-lbl">Session total</span><span class="an-pace-val hot" id="an-total2">—</span></div>
    <div class="an-pace-row"><span class="an-pace-lbl">Largest tip</span><span class="an-pace-val" id="an-max-tip">—</span></div>
    <div class="an-pace-row"><span class="an-pace-lbl">Smallest tip</span><span class="an-pace-val" id="an-min-tip">—</span></div>
    <div class="an-pace-row"><span class="an-pace-lbl">Tips per minute</span><span class="an-pace-val" id="an-tpm">—</span></div>
    <div class="an-pace-row" style="border:none"><span class="an-pace-lbl">Session status</span><span class="an-pace-val" id="an-status">Watching…</span></div>
  </div>
  <div style="margin-top:8px" id="an-top-tippers"><div class="an-empty">No tips yet</div></div>
</div>
<div class="an-divider"></div>
<div class="an-sec">
  <div class="an-sec-lbl">🐋 Whale Tracker</div>
  <div class="an-table" id="an-whale-table"><div class="an-empty">Watching for whales…</div></div>
</div>
<div class="an-divider"></div>
<div class="an-sec" style="padding-bottom:14px">
  <div class="an-sec-lbl">30-Day Fan Volume</div>
  <div class="an-table" id="an-30d-fans"><div class="an-empty">No 30-day history yet</div></div>
</div>`; }

function updateAnalytics(data) {
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
    ? elapsedMin + ' min ago' : Math.floor(elapsedMin/60) + 'h ' + (elapsedMin%60) + 'm ago';
  var tpm = elapsedMin > 0 ? (tipEvents.length / elapsedMin).toFixed(2) : '—';

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

  set('an-session-time', 'Session started ' + elapsedStr);
  set('an-total',   totalTips);
  set('an-viewers', viewers);
  set('an-conv',    convRate);
  set('an-avg',     avgTip > 0 ? avgTip : '—');
  set('an-tph',     tph);
  set('an-tippers', tippers.length);
  set('an-total2',  totalTips + ' tk');
  set('an-max-tip', maxTip > 0 ? maxTip + ' tk' : '—');
  set('an-min-tip', minTip > 0 ? minTip + ' tk' : '—');
  set('an-tpm',     tpm);
  set('an-status',  status);
  cls('an-status',  statusClass);
  cls('an-tph',     tph > 150 ? 'hot' : tph > 50 ? 'up' : '');
  cls('an-conv',    convRate > 5 ? 'up' : convRate > 2 ? 'warn' : '');

  // ── Audience peak tracking ────────────────────────────────────────────────
  var vhist = viewerHistory.length > 0 ? viewerHistory : [{ v: viewers, ts: Date.now() }];
  var peakV = Math.max.apply(null, vhist.map(function(h){ return h.v; }));
  var avgV  = Math.round(vhist.reduce(function(s,h){ return s+h.v; }, 0) / vhist.length);
  var trend = '→';
  if (vhist.length >= 6) {
    var recentAvg = vhist.slice(-5).reduce(function(s,h){return s+h.v;},0)/5;
    var oldAvg    = vhist.slice(0,5).reduce(function(s,h){return s+h.v;},0)/5;
    trend = recentAvg > oldAvg * 1.1 ? '↑' : recentAvg < oldAvg * 0.9 ? '↓' : '→';
  }
  set('an-v-now',   viewers);
  set('an-v-peak',  peakV);
  set('an-v-avg',   avgV);
  set('an-v-trend', trend);

  var barsEl = document.getElementById('an-vbars');
  var timeEl = document.getElementById('an-vtime');
  if (barsEl) {
    var NUM = Math.min(vhist.length, 24);
    var slice = vhist.slice(-NUM);
    var maxV2 = Math.max.apply(null, slice.map(function(h){return h.v;})) || 1;
    barsEl.innerHTML = slice.map(function(h, i) {
      var pct = Math.max(Math.round((h.v / maxV2) * 100), 4);
      var isLast = i === slice.length - 1;
      var bg = isLast ? 'linear-gradient(to top,#4a1a3a,#ff3f6c)' : 'linear-gradient(to top,#2a2a3a,#5a4a7a)';
      return '<div class="an-vbar" style="height:'+pct+'%;background:'+bg+'"></div>';
    }).join('');
    if (timeEl && slice.length > 1) {
      var tlabels = [];
      for (var k = 0; k < 5; k++) {
        var idx2 = Math.floor((slice.length - 1) * k / 4);
        if (k === 4) { tlabels.push('Now'); continue; }
        var d = new Date(slice[idx2].ts);
        var hh = d.getHours(), mm = d.getMinutes();
        var ap = hh >= 12 ? 'pm' : 'am'; hh = hh % 12 || 12;
        tlabels.push(hh + (mm > 0 ? ':' + (mm<10?'0'+mm:mm) : '') + ap);
      }
      timeEl.innerHTML = tlabels.map(function(l){ return '<span>'+l+'</span>'; }).join('');
    }
  }

  // ── Top tippers bar chart ──────────────────────────────────────────────────
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
          '<div class="an-tip-amt">' + f.tips + ' tk</div>' +
        '</div>';
      }).join('');
    }
  }

  // ── Whale tracker ──────────────────────────────────────────────────────────
  var tierLabel = ['Gold','Gold','Gold','Silver','Bronze'];
  var tierBadgeStyle = [
    'background:rgba(255,209,102,0.15);color:var(--gold);border:1px solid rgba(255,209,102,0.3)',
    'background:rgba(255,209,102,0.15);color:var(--gold);border:1px solid rgba(255,209,102,0.3)',
    'background:rgba(255,209,102,0.15);color:var(--gold);border:1px solid rgba(255,209,102,0.3)',
    'background:rgba(192,192,208,0.12);color:#b0b0c8;border:1px solid rgba(192,192,208,0.2)',
    'background:rgba(205,127,50,0.12);color:#cd7f32;border:1px solid rgba(205,127,50,0.2)'
  ];
  var whaleEl = document.getElementById('an-whale-table');
  if (whaleEl) {
    var wlist = (whales.length > 0) ? whales : fans.filter(function(f){ return (f.tier||4) <= 3; });
    if (wlist.length === 0) {
      whaleEl.innerHTML = '<div class="an-empty">No whales detected yet</div>';
    } else {
      whaleEl.innerHTML = wlist.slice(0, 8).map(function(w, i) {
        var t = Math.min(w.tier !== undefined ? w.tier : 4, 4);
        var present = w.present !== false;
        return '<div class="an-row whale-r">' +
          '<div class="an-rnum">' + (i+1) + '</div>' +
          '<div class="an-rinfo"><div class="an-rname">' + w.username + '</div>' +
          '<span class="an-rbadge" style="' + tierBadgeStyle[t] + '">' + tierLabel[t] + '</span></div>' +
          '<div class="an-ramt">' + (w.tips > 0 ? '$'+w.tips : '—') + '</div>' +
          '<div class="an-rdot ' + (present?'on':'off') + '"></div>' +
        '</div>';
      }).join('');
    }
  }

  // ── 30-day fan volume ──────────────────────────────────────────────────────
  var fanEl = document.getElementById('an-30d-fans');
  if (fanEl) {
    var hist = Object.entries(thirtyDayHistory).map(function(e) {
      return { username: e[0], total: e[1].total };
    }).sort(function(a,b){ return b.total - a.total; });
    if (hist.length === 0) {
      fanEl.innerHTML = '<div class="an-empty">No 30-day history yet — tips will appear here</div>';
    } else {
      fanEl.innerHTML = hist.slice(0, 12).map(function(f, i) {
        var badge, badgeStyle;
        if (f.total >= 500)      { badge='🐋 WHALE'; badgeStyle='background:rgba(255,209,102,0.15);color:var(--gold);border:1px solid rgba(255,209,102,0.3)'; }
        else if (i === 0)        { badge='🥇 GOLD';  badgeStyle='background:rgba(255,209,102,0.12);color:#e8c060;border:1px solid rgba(255,209,102,0.2)'; }
        else if (i === 1)        { badge='🥈 SILVER'; badgeStyle='background:rgba(192,192,208,0.12);color:#b0b0c8;border:1px solid rgba(192,192,208,0.2)'; }
        else if (i === 2)        { badge='🥉 BRONZE'; badgeStyle='background:rgba(205,127,50,0.12);color:#cd7f32;border:1px solid rgba(205,127,50,0.2)'; }
        else                     { badge='🔁 LOYAL';  badgeStyle='background:rgba(108,99,255,0.15);color:#9f9bff;border:1px solid rgba(108,99,255,0.25)'; }
        return '<div class="an-row fan-r">' +
          '<div class="an-rnum">' + (i+1) + '</div>' +
          '<div class="an-rinfo"><div class="an-rname">' + f.username.toUpperCase() + '</div>' +
          '<span class="an-rbadge" style="' + badgeStyle + '">' + badge + '</span></div>' +
          '<div class="an-ramt">' + f.total + ' tk</div>' +
        '</div>';
      }).join('');
    }
  }
}


// ── Fan leaderboard with filters + 30-day history ────────────────────────────
var fanFilter = 'all';
var thirtyDayHistory = {}; // { username: totalTips30d } — persisted in storage

// Load 30-day history from storage on boot
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.local.get(['apex30dHistory'], function(r) {
    if (r.apex30dHistory) thirtyDayHistory = r.apex30dHistory;
  });
}

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

  var rows = list.slice(0, 12).map(function(f, i) {
    var present = f.present !== false;
    var rank    = i < 3 ? rankColors[i] : '';
    var t       = Math.min(f.tier !== undefined ? f.tier : 4, 4);
    var tipAmt  = f.displayTips !== undefined ? f.displayTips : f.tips;
    return '<div class="fan-row' + (present ? '' : ' faded') + '">' +
      '<div><span class="rn ' + rank + '">' + (i+1) + '</span></div>' +
      '<div class="fuser">' +
        '<div class="fav" style="background:' + avColors[i % avColors.length] + ';color:#fff">' + f.username[0].toUpperCase() + '</div>' +
        '<div class="finfo">' +
          '<div class="fname">' + f.username.toUpperCase() + '</div>' +
          '<div class="fbadges">' +
            (t===1 ? '<span class="badge bw">🐋 WHALE</span>' : '') +
            (i===0 ? '<span class="badge bg">🥇 GOLD</span>' : i===1 ? '<span class="badge bs">🥈 SILVER</span>' : i===2 ? '<span class="badge bb">🥉 BRONZE</span>' : '') +
            (f.joins > 2 ? '<span class="badge bl">🔁 LOYAL</span>' : (f.joins <= 1 && f.tips === 0 && present ? '<span class="badge bn">✨ NEW</span>' : '')) +
            (!present ? '<span class="badge bx">↩ LEFT</span>' : '') +
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
  if (fanFilter === 'top30') {
    var hist30total = Object.values(thirtyDayHistory).reduce(function(s,v){return s+v.total;},0);
    if (totalEl)  totalEl.textContent  = hist30total + ' tk';
    if (totalLbl) totalLbl.textContent = '30-day total';
  } else {
    if (totalEl)  totalEl.textContent  = totalTips + ' tk';
    if (totalLbl) totalLbl.textContent = 'Session total';
  }

  // Apply active filter
  var list, label;
  if (fanFilter === 'inroom') {
    list  = fans.filter(function(f){ return f.present !== false; })
                .sort(function(a,b){ return b.tips - a.tips; });
    label = 'Viewers currently in room';
  } else if (fanFilter === 'top30') {
    // Build list from 30d history merged with current presence
    var presentSet = {};
    fans.forEach(function(f){ presentSet[f.username] = f.present !== false; });
    list = Object.entries(thirtyDayHistory)
      .map(function(entry) {
        var u = entry[0], v = entry[1];
        var sessionFan = fans.find(function(f){ return f.username === u; }) || {};
        return {
          username:    u,
          displayTips: v.total,
          tips:        sessionFan.tips || 0,
          joins:       sessionFan.joins  || 0,
          leaves:      sessionFan.leaves || 0,
          present:     presentSet[u] || false,
          tier:        sessionFan.tier !== undefined ? sessionFan.tier : 4,
        };
      })
      .sort(function(a,b){ return b.displayTips - a.displayTips; });
    label = '30-day tip average';
  } else if (fanFilter === 'new') {
    // New = present in room with no prior tip history
    list = fans.filter(function(f){
      return f.present !== false && f.tips === 0 && !thirtyDayHistory[f.username];
    });
    label = 'New viewers (no prior tips)';
  } else {
    // All — sorted by session tips, then CB tier
    list  = fans.slice();
    label = 'Ranked by session tips';
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
function getSettingsPage() { return `
<style>
.set-hdr{padding:12px 12px 8px}.set-title{font-family:'Syne',sans-serif;font-weight:800;font-size:14px;color:var(--text)}.set-sub{font-size:9px;color:var(--muted);margin-top:2px}
.set-sec{padding:6px 12px 4px}.set-sec-lbl{font-size:8px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);margin-bottom:8px}
.set-row{display:flex;align-items:center;justify-content:space-between;background:var(--surface);border:1px solid var(--border);border-radius:9px;padding:9px 12px;margin-bottom:6px;gap:10px}
.set-row-info{flex:1;min-width:0}.set-row-lbl{font-size:10px;font-weight:600;color:var(--text);margin-bottom:2px}.set-row-sub{font-size:8px;color:var(--muted);line-height:1.4}
.set-toggle{position:relative;width:32px;height:18px;flex-shrink:0}.set-toggle input{opacity:0;width:0;height:0;position:absolute}
.set-slider{position:absolute;inset:0;background:#2a2a3a;border-radius:18px;cursor:pointer;transition:background 0.2s}
.set-slider::before{content:'';position:absolute;width:12px;height:12px;left:3px;top:3px;background:#666;border-radius:50%;transition:transform 0.2s,background 0.2s}
.set-toggle input:checked + .set-slider{background:rgba(255,63,108,0.3);border:1px solid rgba(255,63,108,0.4)}
.set-toggle input:checked + .set-slider::before{transform:translateX(14px);background:var(--accent)}
.set-select{background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:9px;padding:4px 6px;outline:none;cursor:pointer}
.set-input{background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:9px;padding:4px 8px;outline:none;width:60px;text-align:right;font-family:'DM Mono',monospace}
.set-input:focus{border-color:rgba(255,63,108,0.4)}
.set-divider{height:1px;background:var(--border);margin:4px 12px 8px}
.set-btn{width:100%;background:rgba(255,63,108,0.1);border:1px solid rgba(255,63,108,0.25);border-radius:8px;color:var(--accent);font-size:10px;font-weight:700;padding:9px;cursor:pointer;transition:all 0.15s;margin-bottom:6px}
.set-btn:hover{background:rgba(255,63,108,0.2)}.set-btn.ghost{background:transparent;border-color:var(--border);color:var(--muted)}.set-btn.ghost:hover{border-color:rgba(255,255,255,0.15);color:var(--text)}
.set-saved{font-size:8px;color:var(--green);text-align:center;height:14px;margin-bottom:4px;opacity:0;transition:opacity 0.3s}.set-saved.show{opacity:1}
.set-ver{font-size:8px;color:var(--muted);text-align:center;opacity:0.4;padding:10px 0 14px;letter-spacing:0.5px}
</style>
<div class="set-hdr"><div class="set-title">Settings</div><div class="set-sub">Customize Apex Revenue for your room</div></div>

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
      <option value="30">30s</option><option value="60" selected>1 min</option><option value="120">2 min</option><option value="300">5 min</option>
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
      <option value="0.85">85%</option><option value="0.92" selected>92%</option><option value="1.0">100%</option>
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
  <div class="set-ver">Apex Revenue v0.6.0 · Creator Intelligence Engine</div>
</div>`; }

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
