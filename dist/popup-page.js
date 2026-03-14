
let liveData = null;
let thirtyDayHistory = {};
let storageUsername = '';

function getPopupHistoryKey()  { return storageUsername ? 'apex_' + storageUsername + '_30dHistory' : 'apex30dHistory'; }
function getPopupSettingsKey() { return storageUsername ? 'apex_' + storageUsername + '_settings'   : 'apexSettings'; }
let settings = { autoOpen: true, opacity: 90, whaleAlert: true, prompts: true, whaleThreshold: 50, aiPrice: true };
let currentPage = 'live';
let currentFilter = 'all';
let isOnPlatform = false;
let peakViewers = 0;

const PLATFORMS = { 'chaturbate.com': 'Chaturbate', 'stripchat.com': 'Stripchat', 'myfreecams.com': 'MyFreeCams', 'xtease.com': 'XTease' };

// ── Auth state ─────────────────────────────────────────────────────────────────
let authUser = null;         // logged-in Supabase user object or null
let linkedAccounts = [];     // [{platform, username}] from Supabase
let selectedAuthPlatform = 'chaturbate';   // platform picker in step 2
let selectedAddPlatform  = 'chaturbate';   // platform picker in step 3
let authMode = 'signin';     // 'signin' or 'register'


// ── Auth gate controller ──────────────────────────────────────────────────────

function showAuthGate(step) {
  var gate = document.getElementById('auth-gate');
  if (gate) gate.classList.remove('hidden');
  ['auth-step-1','auth-step-2','auth-step-3','auth-step-mismatch'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  var target = document.getElementById(step || 'auth-step-1');
  if (target) target.classList.add('active');
}

function hideAuthGate() {
  var gate = document.getElementById('auth-gate');
  if (gate) gate.classList.add('hidden');
}

function setAuthError(elId, msg) {
  var el = document.getElementById(elId);
  if (el) el.textContent = msg || '';
}

function setAuthBtnLoading(btnId, loading, label) {
  var btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? 'Please wait...' : (label || btn.textContent);
}

// Render the linked accounts list in step 3
function renderLinkedAccounts() {
  var list = document.getElementById('auth-linked-list');
  if (!list) return;
  if (!linkedAccounts.length) {
    list.innerHTML = '<div style="font-size:12px;color:var(--muted);text-align:center;padding:10px 0">No accounts linked yet</div>';
    return;
  }
  list.innerHTML = linkedAccounts.map(function(a) {
    var platLabel = a.platform.charAt(0).toUpperCase() + a.platform.slice(1);
    return '<div class="auth-linked-row">' +
      '<div><div class="auth-linked-name">@' + escHtml(a.username) + '</div>' +
      '<div class="auth-linked-platform">' + platLabel + '</div></div>' +
      '<button class="auth-linked-remove" data-platform="' + a.platform + '" data-username="' + escHtml(a.username) + '">Remove</button>' +
    '</div>';
  }).join('');
  list.querySelectorAll('.auth-linked-remove').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      var p = this.getAttribute('data-platform');
      var u = this.getAttribute('data-username');
      this.textContent = '...';
      try {
        linkedAccounts = await apexUnlinkPlatformAccount(p, u);
        renderLinkedAccounts();
      } catch(e) { this.textContent = 'Remove'; }
    });
  });
}

// Called after successful sign-in or sign-up
async function onAuthSuccess(user) {
  authUser = user;
  var emailLabel = document.getElementById('auth-user-email-label');
  if (emailLabel) emailLabel.textContent = user.email || '';
  try { linkedAccounts = await apexGetLinkedAccounts(); } catch(e) { linkedAccounts = []; }
  chrome.storage.local.set({ apexLinkedAccounts: linkedAccounts });
  loadCloudFanHistory();
  if (linkedAccounts.length === 0) {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        var url = (tabs[0] && tabs[0].url) || '';
        var autoUser = '';
        for (var domain in PLATFORMS) {
          if (url.includes(domain)) {
            try { var pu = new URL(url); autoUser = (pu.pathname.split('/')[1] || '').toLowerCase(); } catch(e) {}
            break;
          }
        }
        if (autoUser) {
          var inp = document.getElementById('auth-platform-username');
          if (inp) inp.value = autoUser;
        }
        showAuthGate('auth-step-2');
      });
    } else { showAuthGate('auth-step-2'); }
  } else {
    checkAccountMatch(function(match, detectedUser) {
      if (!match && detectedUser) {
        var msg = document.getElementById('auth-mismatch-msg');
        if (msg) msg.textContent = 'The stream page you opened (@' + detectedUser + ') is not linked to this account. Add it in account settings or sign in with the correct account.';
        showAuthGate('auth-step-mismatch');
      } else {
        hideAuthGate();
        unlockApp();
      }
    });
  }
}

// Check if the current active tab matches a linked account
function checkAccountMatch(callback) {
  if (typeof chrome === 'undefined' || !chrome.tabs) { callback(true, null); return; }
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var url = (tabs[0] && tabs[0].url) || '';
    var detectedUser = '';
    var detectedPlatform = '';
    for (var domain in PLATFORMS) {
      if (url.includes(domain)) {
        detectedPlatform = domain.replace('.com', '');
        try { var pu2 = new URL(url); detectedUser = (pu2.pathname.split('/')[1] || '').toLowerCase(); } catch(e) {}
        break;
      }
    }
    if (!detectedUser) { callback(true, null); return; }
    var match = apexIsPlatformLinked(detectedUser, linkedAccounts, detectedPlatform || 'chaturbate');
    callback(match, detectedUser);
  });
}

// Unlock the main app UI
function unlockApp() {
  hideAuthGate();
  var cbAccount = linkedAccounts.find(function(a){ return a.platform === 'chaturbate'; });
  if (cbAccount && !storageUsername) {
    storageUsername = cbAccount.username;
    chrome.storage.local.set({ apexCurrentUser: storageUsername });
  }
  chrome.storage.local.get([getPopupHistoryKey(), getPopupSettingsKey()], function(r) {
    thirtyDayHistory = r[getPopupHistoryKey()] || {};
    if (r[getPopupSettingsKey()]) { settings = Object.assign({}, settings, r[getPopupSettingsKey()]); applySettings(); }
    updateOfflineAccountDisplay();
    initPlatformDetection();
  });
}

// Load fan history from Supabase and merge with local
async function loadCloudFanHistory() {
  try {
    var cbAccount = linkedAccounts.find(function(a){ return a.platform === 'chaturbate'; });
    if (!cbAccount) return;
    var cloudHistory = await apexLoadFanHistory('chaturbate');
    Object.keys(cloudHistory).forEach(function(u) {
      if (!thirtyDayHistory[u] || thirtyDayHistory[u].total < cloudHistory[u].total) {
        thirtyDayHistory[u] = cloudHistory[u];
      }
    });
    var obj = {}; obj[getPopupHistoryKey()] = thirtyDayHistory;
    chrome.storage.local.set(obj);
    updateOfflineAccountDisplay();
    if (currentPage === 'fans') renderFans();
  } catch(e) { /* cloud sync is optional */ }
}

// Periodically sync fan history to cloud (every 5 minutes when active)
function startCloudSyncInterval() {
  setInterval(async function() {
    if (!authUser) return;
    var cbAccount = linkedAccounts.find(function(a){ return a.platform === 'chaturbate'; });
    if (!cbAccount) return;
    try { await apexSyncFanHistory(thirtyDayHistory, 'chaturbate'); } catch(e) { /* silent */ }
  }, 5 * 60 * 1000);
}

// ── Auth gate event bindings ───────────────────────────────────────────────────
function initAuthGate() {
  ['auth-logo-img','auth-logo-img2','auth-logo-img3'].forEach(function(id) {
    var img = document.getElementById(id);
    if (img && typeof chrome !== 'undefined' && chrome.runtime) {
      img.src = chrome.runtime.getURL('icons/icon128.png');
    }
  });

  document.getElementById('tab-signin').addEventListener('click', function() {
    authMode = 'signin';
    document.getElementById('tab-signin').classList.add('active');
    document.getElementById('tab-register').classList.remove('active');
    document.getElementById('auth-submit-btn').textContent = 'Sign In';
    document.getElementById('auth-password').setAttribute('autocomplete','current-password');
    setAuthError('auth-error','');
  });
  document.getElementById('tab-register').addEventListener('click', function() {
    authMode = 'register';
    document.getElementById('tab-register').classList.add('active');
    document.getElementById('tab-signin').classList.remove('active');
    document.getElementById('auth-submit-btn').textContent = 'Create Account';
    document.getElementById('auth-password').setAttribute('autocomplete','new-password');
    setAuthError('auth-error','');
  });

  ['auth-email','auth-password'].forEach(function(id) {
    document.getElementById(id).addEventListener('keydown', function(e) {
      if (e.key === 'Enter') document.getElementById('auth-submit-btn').click();
    });
  });

  document.getElementById('auth-submit-btn').addEventListener('click', async function() {
    var email = (document.getElementById('auth-email').value || '').trim();
    var pass  = (document.getElementById('auth-password').value || '');
    setAuthError('auth-error','');
    if (!email || !pass) { setAuthError('auth-error','Email and password are required'); return; }
    if (authMode === 'register' && pass.length < 8) { setAuthError('auth-error','Password must be at least 8 characters'); return; }
    setAuthBtnLoading('auth-submit-btn', true);
    try {
      var data = authMode === 'register' ? await apexSignUp(email, pass) : await apexSignIn(email, pass);
      if (data.user || data.access_token) {
        var user = data.user || await apexGetUser();
        await onAuthSuccess(user);
      } else {
        setAuthError('auth-error', data.error_description || data.message || 'Authentication failed');
      }
    } catch(e) {
      setAuthError('auth-error', e.message || 'Authentication failed. Check your credentials.');
    } finally {
      setAuthBtnLoading('auth-submit-btn', false, authMode === 'register' ? 'Create Account' : 'Sign In');
    }
  });

  document.querySelectorAll('#auth-step-2 .platform-opt').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('#auth-step-2 .platform-opt').forEach(function(b){ b.classList.remove('active'); });
      this.classList.add('active');
      selectedAuthPlatform = this.getAttribute('data-platform');
    });
  });

  document.getElementById('auth-link-btn').addEventListener('click', async function() {
    var username = (document.getElementById('auth-platform-username').value || '').trim();
    setAuthError('auth-link-error','');
    if (!username) { setAuthError('auth-link-error','Enter your streaming username'); return; }
    setAuthBtnLoading('auth-link-btn', true);
    try {
      linkedAccounts = await apexLinkPlatformAccount(selectedAuthPlatform, username);
      hideAuthGate();
      unlockApp();
    } catch(e) {
      setAuthError('auth-link-error', e.message || 'Failed to link account');
    } finally {
      setAuthBtnLoading('auth-link-btn', false, 'Link Account & Continue');
    }
  });

  document.getElementById('auth-link-skip').addEventListener('click', function() {
    hideAuthGate();
    unlockApp();
  });

  document.getElementById('auth-signout-btn').addEventListener('click', async function() {
    await apexSignOut();
    authUser = null; linkedAccounts = [];
    chrome.storage.local.remove(['apexLinkedAccounts']);
    showAuthGate('auth-step-1');
  });

  document.querySelectorAll('#auth-add-platform-grid .platform-opt').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('#auth-add-platform-grid .platform-opt').forEach(function(b){ b.classList.remove('active'); });
      this.classList.add('active');
      selectedAddPlatform = this.getAttribute('data-platform');
    });
  });

  document.getElementById('auth-add-btn').addEventListener('click', async function() {
    var username = (document.getElementById('auth-add-username').value || '').trim();
    setAuthError('auth-add-error','');
    if (!username) { setAuthError('auth-add-error','Enter your streaming username'); return; }
    setAuthBtnLoading('auth-add-btn', true);
    try {
      linkedAccounts = await apexLinkPlatformAccount(selectedAddPlatform, username);
      document.getElementById('auth-add-username').value = '';
      renderLinkedAccounts();
      var addErr = document.getElementById('auth-add-error');
      if (addErr) { addErr.style.color='var(--green)'; addErr.textContent='Account linked successfully'; setTimeout(function(){ addErr.textContent=''; addErr.style.color=''; },2500); }
    } catch(e) {
      setAuthError('auth-add-error', e.message || 'Failed to link account');
    } finally {
      setAuthBtnLoading('auth-add-btn', false, 'Link Account');
    }
  });

  document.getElementById('auth-back-btn').addEventListener('click', function() { hideAuthGate(); });

  document.getElementById('auth-mismatch-switch').addEventListener('click', async function() {
    await apexSignOut(); authUser = null; linkedAccounts = [];
    chrome.storage.local.remove(['apexLinkedAccounts']);
    showAuthGate('auth-step-1');
  });

  document.getElementById('auth-mismatch-link-btn').addEventListener('click', function() {
    showAuthGate('auth-step-3');
    renderLinkedAccounts();
    if (authUser) { var el = document.getElementById('auth-user-email-label'); if (el) el.textContent = authUser.email || ''; }
  });
}


function escHtml(str) { return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function setEl(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pageEl = document.getElementById('page-' + pageId);
  if (pageEl) pageEl.classList.add('active');
  const navEl = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (navEl) navEl.classList.add('active');
  currentPage = pageId;
  if (pageId === 'analytics') renderAnalytics();
  if (pageId === 'fans') renderFans();
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const page = item.getAttribute('data-page');
    if (!isOnPlatform && page !== 'settings' && page !== 'help' && page !== 'fans' && page !== 'analytics') {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById('page-offplatform').classList.add('active');
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
    } else { showPage(page); }
  });
});

function detectPlatform(url) {
  for (const [domain, name] of Object.entries(PLATFORMS)) { if (url && url.includes(domain)) return name; }
  return null;
}

function initPlatformDetection() {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const url = (tabs[0] && tabs[0].url) || '';
      const platform = detectPlatform(url);
      if (platform) {
        isOnPlatform = true;
        const badge = document.getElementById('live-badge');
        badge.className = 'live-badge is-live';
        document.getElementById('live-badge-text').textContent = platform.toUpperCase();
        document.getElementById('settings-platform-dot').className = 'platform-dot active';
        document.getElementById('settings-platform-name').textContent = platform;
        document.getElementById('settings-platform-sub').textContent = 'Apex Revenue is active on this tab';
        loadLiveData();
        showPage('live');
      } else { showPage('offplatform'); }
    });
  } else {
    // Dev preview
    isOnPlatform = true;
    showPage('live');
  }
}

function loadLiveData() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['apexLiveData'], result => {
      if (result.apexLiveData) { liveData = result.apexLiveData; renderLive(); }
    });
    chrome.storage.onChanged.addListener(changes => {
      if (changes.apexLiveData) {
        liveData = changes.apexLiveData.newValue;
        if (currentPage === 'live') renderLive();
        if (currentPage === 'analytics') renderAnalytics();
        if (currentPage === 'fans') renderFans();
      }
    });
  }
}

function renderLive() {
  if (!liveData) return;
  const { viewers = 0, tokensPerHour = 0, convRate = 0, fans = [], tipEvents = [] } = liveData;
  if (viewers > peakViewers) peakViewers = viewers;
  setEl('stat-tokens', tokensPerHour > 0 ? `$${tokensPerHour}<span>/hr</span>` : `—<span></span>`);
  setEl('stat-viewers', viewers > 999 ? `${(viewers/1000).toFixed(1)}<span>k</span>` : `${viewers || '—'}<span></span>`);
  setEl('stat-conv', `${convRate || '—'}<span>%</span>`);
  const whaleList = fans.filter(f => f.tips >= settings.whaleThreshold).slice(0, 8);
  renderWhales(whaleList);
  renderHeatBars(tipEvents);
  renderPriceRecommendation(tokensPerHour);
  updateAlertBanner(whaleList, tokensPerHour);
}

function renderWhales(whaleList) {
  const rowsEl = document.getElementById('whale-rows');
  const footerEl = document.getElementById('whale-footer');
  const inRoom = whaleList.filter(w => w.present);
  document.getElementById('whale-count-label').textContent = `${inRoom.length} in room`;
  if (whaleList.length === 0) {
    rowsEl.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🐋</div><div class="empty-state-text">No high-value tippers yet this session</div></div>`;
    footerEl.style.display = 'none'; return;
  }
  const totalWhale = whaleList.reduce((s, w) => s + w.tips, 0);
  document.getElementById('whale-total').textContent = `$${totalWhale}`;
  footerEl.style.display = 'flex';
  rowsEl.innerHTML = whaleList.map((w, i) => {
    const tier = w.tier <= 1 ? 1 : w.tier <= 2 ? 2 : w.tier <= 3 ? 3 : 4;
    const emoji = tier === 1 ? '🐋' : tier === 2 ? '💎' : '🔥';
    const tierLabel = tier === 1 ? 'Gold' : tier === 2 ? 'Silver' : 'Bronze';
    return `<div class="whale-row ${w.present ? '' : 'left'}">
      <div class="whale-identity">
        <div class="whale-avatar tier-${tier}">${emoji}<div class="whale-status-dot ${w.present ? 'online' : 'offline'}"></div></div>
        <div><div class="whale-name">${escHtml(w.username)}</div><div class="whale-rank">#${i+1} tipper · ${tierLabel}</div></div>
      </div>
      <div class="whale-tips">$${w.tips}</div>
      <div class="whale-count joins"><span class="whale-count-val">${w.joins||0}</span></div>
      <div class="whale-count leaves"><span class="whale-count-val">${w.leaves||0}</span></div>
    </div>`;
  }).join('');
}

function renderHeatBars(tipEvents) {
  const barsEl = document.getElementById('heat-bars');
  const timeEl = document.getElementById('heat-time');
  const now = Date.now(); const bucketMs = 15*60*1000; const n = 12;
  const buckets = Array(n).fill(0);
  tipEvents.forEach(ev => { const idx = n-1-Math.floor((now-ev.timestamp)/bucketMs); if(idx>=0&&idx<n) buckets[idx]+=ev.amount; });
  const max = Math.max(...buckets, 1);
  barsEl.innerHTML = buckets.map((val, i) => {
    const pct = Math.max(5, Math.round((val/max)*100));
    const isCur = i===n-1;
    const bg = isCur ? `background:linear-gradient(to top,rgba(255,63,108,0.6),var(--accent));box-shadow:0 0 8px var(--glow)` : val>0 ? `background:linear-gradient(to top,rgba(155,124,255,0.3),rgba(255,63,108,0.5))` : `background:var(--surface2)`;
    return `<div class="heat-bar" style="height:${pct}%;${bg}" title="$${val}"></div>`;
  }).join('');
  const labels = [];
  for (let i=0;i<5;i++) { const idx=Math.round(i*(n-1)/4); const t=new Date(now-(n-1-idx)*bucketMs); labels.push(i===4?'Now':`${t.getHours()}:${String(t.getMinutes()).padStart(2,'0')}`); }
  timeEl.innerHTML = labels.map(l=>`<span${l==='Now'?' style="color:var(--gold)"':''}>${l}</span>`).join('');
}

function renderPriceRecommendation(tokensPerHour) {
  if (tokensPerHour === 0) { setEl('price-current','—'); setEl('price-recommended','—'); setEl('price-max','—'); setEl('ai-insight-text','Analyzing session data to build your price recommendation…'); return; }
  const current=8, demand=tokensPerHour/100, rec=Math.round(current*(1+demand*0.4)), max=Math.round(rec*1.5);
  setEl('price-current',`$${current}`); setEl('price-recommended',`$${rec}`); setEl('price-max',`$${max}`);
  setEl('ai-insight-text', demand>2 ? `Demand is very high — you could push to $${rec} right now.` : demand>1 ? `Session is performing well. $${rec} is a safe increase.` : `Activity is moderate. Test $${rec} with a small announcement.`);
}

function updateAlertBanner(whaleList, tokensPerHour) {
  const banner = document.getElementById('alert-banner');
  const inRoom = whaleList.filter(w => w.present);
  if (inRoom.length >= 2 && tokensPerHour > 50) {
    document.getElementById('alert-icon').textContent='🔥'; document.getElementById('alert-label').textContent='High Tip Moment';
    document.getElementById('alert-text').textContent=`${inRoom.length} whales in chat — launch a goal now`; banner.classList.remove('hidden');
  } else if (inRoom.length >= 1) {
    document.getElementById('alert-icon').textContent='🐋'; document.getElementById('alert-label').textContent='Whale Alert';
    document.getElementById('alert-text').textContent=`${inRoom[0].username} is in the room — engage them`; banner.classList.remove('hidden');
  } else { banner.classList.add('hidden'); }
}

function renderAnalytics() {
  if (!liveData) return;
  const { totalTips=0, viewers=0, fans=[], tipEvents=[], startTime } = liveData;
  setEl('an-total',`<span>$</span>${totalTips}`);
  setEl('an-peak-viewers', Math.max(peakViewers, viewers));
  setEl('an-tippers', fans.filter(f=>f.tips>0).length);
  setEl('an-tip-events', tipEvents.length);
  const elapsed = startTime ? Math.round((Date.now()-startTime)/60000) : 0;
  setEl('analytics-session-time', elapsed<1?'Just started':`${elapsed}m into session`);
  const now=Date.now(), numB=12, bucketMs=15*60*1000;
  const buckets=Array(numB).fill(0);
  tipEvents.forEach(ev=>{ const idx=Math.min(numB-1,Math.floor((ev.timestamp-(startTime||now))/bucketMs)); if(idx>=0) buckets[idx]+=ev.amount; });
  const maxB=Math.max(...buckets,1);
  document.getElementById('tl-bars').innerHTML=buckets.map(v=>`<div class="tl-bar ${v>0?'has-tips':''}" style="height:${Math.max(3,Math.round((v/maxB)*100))}%" title="$${v}"></div>`).join('');
  const st=new Date(startTime||now);
  document.getElementById('tl-labels').innerHTML=`<span>${st.getHours()}:${String(st.getMinutes()).padStart(2,'0')}</span><span>Now</span>`;
  if (tipEvents.length>0) {
    const top=tipEvents.reduce((a,b)=>a.amount>b.amount?a:b);
    const t=new Date(top.timestamp);
    document.getElementById('top-moment-section').style.display='block';
    setEl('moment-title',`$${top.amount} tip by ${escHtml(top.username)}`);
    setEl('moment-detail',`Largest single tip at ${t.getHours()}:${String(t.getMinutes()).padStart(2,'0')} — announce goals right after big tips.`);
  }
}

function renderFans() {
  // ── Offline: render 30-day history when no live session active ─────────────
  if (!liveData) {
    const rowsEl = document.getElementById('fans-rows');
    const histEntries = Object.entries(thirtyDayHistory).filter(([, d]) => d.total > 0).sort(([,a],[,b]) => b.total - a.total);
    const subEl = document.querySelector('#page-fans .fans-subtitle');
    if (subEl) subEl.textContent = '30-day history (offline)';
    if (!histEntries.length) {
      rowsEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💜</div><div class="empty-state-text">No fan history yet — start streaming to begin tracking</div></div>';
      return;
    }
    const totalHist = histEntries.reduce((s,[,d])=>s+d.total, 0);
    setEl('fans-total', totalHist + ' tk');
    rowsEl.innerHTML = histEntries.map(([username, d], i) => {
      const rank = i+1;
      const rankClass = rank===1?'gold-rank':rank===2?'silver-rank':rank===3?'bronze-rank':'';
      const init = username ? username[0].toUpperCase() : '?';
      const isWhale = d.total >= 200;
      return '<div class="fan-row offline">' +
        '<div><span class="rank-num ' + rankClass + '">' + rank + '</span></div>' +
        '<div class="fan-identity">' +
          '<div class="fan-avatar tier-' + (isWhale?1:4) + '">' + escHtml(init) + '<div class="fan-presence-dot offline"></div></div>' +
          '<div class="fan-info"><div class="fan-name">' + escHtml(username) + '</div>' +
          '<div class="fan-badges"><span class="badge badge-new">30-day history</span>' + (isWhale?'<span class="badge badge-whale">🐋 Whale</span>':'') + '</div></div>' +
        '</div>' +
        '<div class="fan-tip-amt ' + (isWhale?'top':'mid') + '">' + d.total + ' tk</div>' +
        '<div><span class="cnt-val in">—</span></div>' +
        '<div><span class="cnt-val out">—</span></div>' +
      '</div>';
    }).join('');
    return;
  }
  // ── Live: original filter logic ────────────────────────────────────────────
  if (document.querySelector('#page-fans .fans-subtitle')) document.querySelector('#page-fans .fans-subtitle').textContent = 'Ranked by session tips';
  const { fans=[], totalTips=0 } = liveData;
  setEl('fans-total',`$${totalTips}`);
  let filtered = fans.filter(f=>f.tips>0);
  if (currentFilter==='inroom') filtered=filtered.filter(f=>f.present);
  else if (currentFilter==='tippers') filtered=filtered.filter(f=>f.tips>=settings.whaleThreshold);
  else if (currentFilter==='new') filtered=filtered.filter(f=>f.joins===1&&f.tips>0);
  const rowsEl=document.getElementById('fans-rows');
  if (!filtered.length) { rowsEl.innerHTML=`<div class="empty-state"><div class="empty-state-icon">💜</div><div class="empty-state-text">No tippers match this filter</div></div>`; return; }
  rowsEl.innerHTML=filtered.map((fan,i)=>{
    const rank=i+1, rankClass=rank===1?'gold-rank':rank===2?'silver-rank':rank===3?'bronze-rank':'';
    const tier=fan.tier<=1?1:fan.tier<=2?2:fan.tier<=3?3:4;
    const init=fan.username?fan.username[0].toUpperCase():'?';
    const badges=[];
    if(fan.tips>=settings.whaleThreshold) badges.push(`<span class="badge badge-whale">🐋 Whale</span>`);
    if(tier===1) badges.push(`<span class="badge badge-gold">🥇 Gold</span>`);
    else if(tier===2) badges.push(`<span class="badge badge-silver">🥈 Silver</span>`);
    else if(tier===3) badges.push(`<span class="badge badge-bronze">🥉 Bronze</span>`);
    if(fan.joins>3) badges.push(`<span class="badge badge-loyal">🔁 Loyal</span>`);
    if(fan.joins===1&&fan.tips>0) badges.push(`<span class="badge badge-new">✨ New</span>`);
    if(!fan.present) badges.push(`<span class="badge badge-left">↩ Left</span>`);
    return `<div class="fan-row ${fan.present?'':'offline'}">
      <div><span class="rank-num ${rankClass}">${rank}</span></div>
      <div class="fan-identity">
        <div class="fan-avatar tier-${tier}">${init}<div class="fan-presence-dot ${fan.present?'online':'offline'}"></div></div>
        <div class="fan-info"><div class="fan-name">${escHtml(fan.username)}</div><div class="fan-badges">${badges.slice(0,3).join('')}</div></div>
      </div>
      <div class="fan-tip-amt ${fan.tips>=settings.whaleThreshold?'top':'mid'}">$${fan.tips}</div>
      <div><span class="cnt-val in">${fan.joins||0}</span></div>
      <div><span class="cnt-val out">${fan.leaves||0}</span></div>
    </div>`;
  }).join('');
}

function updateOfflineAccountDisplay() {
  var infoEl = document.getElementById('offline-account-info');
  var histCount = Object.keys(thirtyDayHistory).filter(function(u){ return thirtyDayHistory[u].total > 0; }).length;
  if (infoEl) {
    if (storageUsername) {
      infoEl.innerHTML = '<div class="offline-acct-name">@' + escHtml(storageUsername) + '</div>' +
        '<div class="offline-acct-sub">' + histCount + ' fan' + (histCount===1?'':'s') + ' in 30-day history</div>';
    } else {
      infoEl.innerHTML = '<div class="offline-acct-sub">No account data yet — open your stream and Apex Revenue will begin tracking automatically.</div>';
    }
  }
  var previewEl = document.getElementById('offline-fans-preview');
  if (previewEl) {
    var top5 = Object.entries(thirtyDayHistory).filter(function(e){ return e[1].total>0; }).sort(function(a,b){ return b[1].total-a[1].total; }).slice(0,5);
    if (top5.length === 0) {
      previewEl.innerHTML = '<div style="font-size:12px;color:var(--muted);text-align:center">No fan history yet</div>';
    } else {
      previewEl.innerHTML = top5.map(function(e,i){
        var u=e[0], d=e[1];
        return '<div class="offline-fan-row">' +
          '<span class="offline-fan-rank">' + (i+1) + '</span>' +
          '<span class="offline-fan-name">' + escHtml(u) + '</span>' +
          '<span class="offline-fan-tips">' + d.total + ' tk</span>' +
          '</div>';
      }).join('');
    }
  }
}

function applySettings() {
  const set=(id,val)=>{const el=document.getElementById(id);if(el)el[typeof val==='boolean'?'checked':'value']=val;};
  set('setting-auto-open',settings.autoOpen); set('setting-opacity',settings.opacity);
  set('setting-whale-alert',settings.whaleAlert); set('setting-prompts',settings.prompts);
  set('setting-whale-threshold',settings.whaleThreshold); set('setting-ai-price',settings.aiPrice);
  setEl('opacity-val',settings.opacity+'%'); setEl('whale-threshold-val','$'+settings.whaleThreshold);
}

function saveSettings() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    var _sk = getPopupSettingsKey(); var _obj = {}; _obj[_sk] = settings;
    chrome.storage.local.set(_obj);
  }
}

function initSettings() {
  document.getElementById('setting-auto-open').addEventListener('change',e=>{settings.autoOpen=e.target.checked;saveSettings();});
  document.getElementById('setting-opacity').addEventListener('input',e=>{settings.opacity=+e.target.value;setEl('opacity-val',settings.opacity+'%');saveSettings();});
  document.getElementById('setting-whale-alert').addEventListener('change',e=>{settings.whaleAlert=e.target.checked;saveSettings();});
  document.getElementById('setting-prompts').addEventListener('change',e=>{settings.prompts=e.target.checked;saveSettings();});
  document.getElementById('setting-whale-threshold').addEventListener('input',e=>{settings.whaleThreshold=+e.target.value;setEl('whale-threshold-val','$'+settings.whaleThreshold);saveSettings();if(liveData)renderLive();});
  document.getElementById('setting-ai-price').addEventListener('change',e=>{settings.aiPrice=e.target.checked;saveSettings();});
  var manageBtn = document.getElementById('settings-manage-accounts');
  if (manageBtn) {
    manageBtn.addEventListener('click', function() {
      showAuthGate('auth-step-3');
      renderLinkedAccounts();
      if (authUser) { var el = document.getElementById('auth-user-email-label'); if (el) el.textContent = authUser.email || ''; }
    });
  }

  document.getElementById('settings-reset').addEventListener('click',()=>{
    if(typeof chrome!=='undefined'&&chrome.storage){chrome.storage.local.remove(['apexLiveData'],()=>{liveData=null;const btn=document.getElementById('settings-reset');btn.textContent='✓ Session data cleared';btn.style.color='var(--green)';setTimeout(()=>{btn.textContent='Reset session data';btn.style.color='';},2500);});}
  });
}

document.getElementById('alert-cta').addEventListener('click',function(){this.textContent='✓ Done';this.classList.add('done');setTimeout(()=>{this.textContent='Act Now';this.classList.remove('done');},2500);});

// Offline "View Full Fan Leaderboard" button — navigates to fans page with 30d history
var offlineFansBtn = document.getElementById('offline-view-fans-btn');
if (offlineFansBtn) {
  offlineFansBtn.addEventListener('click', function() {
    showPage('fans');
    document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.remove('active'); });
    var fansNav = document.querySelector('.nav-item[data-page="fans"]');
    if (fansNav) fansNav.classList.add('active');
  });
}

document.querySelectorAll('.fan-chip[data-filter]').forEach(chip=>{
  chip.addEventListener('click',()=>{document.querySelectorAll('.fan-chip[data-filter]').forEach(c=>c.classList.remove('active'));chip.classList.add('active');currentFilter=chip.getAttribute('data-filter');renderFans();});
});

document.querySelectorAll('.feature-chip[data-cat]').forEach(chip=>{
  chip.addEventListener('click',()=>{document.querySelectorAll('.feature-chip[data-cat]').forEach(c=>c.classList.remove('active'));chip.classList.add('active');});
});

document.getElementById('featureSubmit').addEventListener('click',async function(){
  const text=document.getElementById('featureText').value.trim();
  const cat=document.querySelector('.feature-chip.active[data-cat]');
  const category=cat?cat.textContent.trim():'Other';
  if(!text){const ta=document.getElementById('featureText');ta.style.borderColor='rgba(255,63,108,0.6)';ta.placeholder='Please describe your idea first…';setTimeout(()=>{ta.style.borderColor='';},2000);return;}
  this.textContent='Sending…';this.disabled=true;
  try{
    if(typeof emailjs!=='undefined'){await emailjs.send('service_fhx1u18','template_gn0f3ul',{feature_text:text,category,submitted_at:new Date().toLocaleString(),to_email:'support@apexrevenue.works'});}
    document.getElementById('featureText').value='';this.style.display='none';
    document.getElementById('featureSuccess').style.display='flex';document.getElementById('featureError').style.display='none';
    setTimeout(()=>{this.style.display='';this.textContent='Submit Idea';this.disabled=false;document.getElementById('featureSuccess').style.display='none';},4000);
  }catch(e){this.textContent='Submit Idea';this.disabled=false;document.getElementById('featureError').style.display='flex';setTimeout(()=>{document.getElementById('featureError').style.display='none';},4000);}
});

document.addEventListener('DOMContentLoaded', function() {
  initSettings();
  initAuthGate();

  if (typeof chrome === 'undefined' || !chrome.storage) {
    // Dev preview without extension context
    initPlatformDetection();
    return;
  }

  // ── Auth boot sequence ─────────────────────────────────────────────────────
  chrome.storage.local.get(['apexCurrentUser', 'apexLinkedAccounts'], function(bootResult) {
    storageUsername = bootResult.apexCurrentUser || '';
    linkedAccounts  = bootResult.apexLinkedAccounts || [];

    chrome.storage.local.get([getPopupHistoryKey(), getPopupSettingsKey()], function(r) {
      thirtyDayHistory = r[getPopupHistoryKey()] || {};
      if (r[getPopupSettingsKey()]) { settings = Object.assign({}, settings, r[getPopupSettingsKey()]); applySettings(); }
      updateOfflineAccountDisplay();

      // Verify session with Supabase
      apexVerifyAuth().then(function(user) {
        if (!user) {
          showAuthGate('auth-step-1');
          return;
        }
        authUser = user;
        var emailLabel = document.getElementById('auth-user-email-label');
        if (emailLabel) emailLabel.textContent = user.email || '';

        apexGetLinkedAccounts().then(function(accounts) {
          linkedAccounts = accounts;
          chrome.storage.local.set({ apexLinkedAccounts: accounts });

          if (accounts.length === 0) {
            showAuthGate('auth-step-2');
            return;
          }

          checkAccountMatch(function(match, detectedUser) {
            if (!match && detectedUser) {
              var msg = document.getElementById('auth-mismatch-msg');
              if (msg) msg.textContent = 'The stream page you opened (@' + detectedUser + ') is not linked to this account. Add it in account settings or sign in with the correct account.';
              showAuthGate('auth-step-mismatch');
            } else {
              hideAuthGate();
              unlockApp();
              startCloudSyncInterval();
            }
          });
        }).catch(function() {
          // Offline — use cached accounts
          if (linkedAccounts.length > 0) {
            hideAuthGate();
            unlockApp();
          } else {
            showAuthGate('auth-step-2');
          }
        });

      }).catch(function() {
        showAuthGate('auth-step-1');
      });
    });
  });
});
