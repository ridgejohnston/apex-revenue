// ── Apex Revenue — auth.js v1.0 ──────────────────────────────────────────────
// Supabase auth client for the Chrome extension.
// Handles sign-up, sign-in, session refresh, platform account linking,
// and cloud fan-history sync.
//
// !! SETUP REQUIRED !!
// Replace the two constants below with your Supabase project values.
// Get them from: https://supabase.com/dashboard → your project → Settings → API
// ─────────────────────────────────────────────────────────────────────────────

var APEX_SUPABASE_URL      = 'https://YOUR_PROJECT_ID.supabase.co';
var APEX_SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
var APEX_SESSION_KEY       = 'apexSession';
var APEX_LINKED_KEY        = 'apexLinkedAccounts';

// ── Session helpers ───────────────────────────────────────────────────────────

function apexGetSession() {
  return new Promise(function(resolve) {
    chrome.storage.local.get([APEX_SESSION_KEY], function(r) {
      resolve(r[APEX_SESSION_KEY] || null);
    });
  });
}

function apexSetSession(session) {
  return new Promise(function(resolve) {
    var obj = {}; obj[APEX_SESSION_KEY] = session;
    chrome.storage.local.set(obj, resolve);
  });
}

function apexClearSession() {
  return new Promise(function(resolve) {
    chrome.storage.local.remove([APEX_SESSION_KEY, APEX_LINKED_KEY], resolve);
  });
}

// ── Low-level Supabase fetch ──────────────────────────────────────────────────

async function apexFetch(path, options) {
  options = options || {};
  var session = await apexGetSession();
  var headers = Object.assign({
    'apikey': APEX_SUPABASE_ANON_KEY,
    'Content-Type': 'application/json'
  }, options.headers || {});
  if (session && session.access_token) {
    headers['Authorization'] = 'Bearer ' + session.access_token;
  }
  var res = await fetch(APEX_SUPABASE_URL + path, Object.assign({}, options, { headers: headers }));
  var text = await res.text();
  var data = {};
  try { data = text ? JSON.parse(text) : {}; } catch(e) { data = { raw: text }; }
  if (!res.ok) {
    var msg = (data.error_description || data.message || data.error || 'Request failed');
    throw new Error(msg);
  }
  return data;
}

// ── Auth operations ───────────────────────────────────────────────────────────

async function apexSignUp(email, password) {
  var data = await apexFetch('/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify({ email: email, password: password })
  });
  if (data.access_token) {
    await apexSetSession(data);
    // Create profile row (ignore if already exists)
    try {
      await apexFetch('/rest/v1/profiles', {
        method: 'POST',
        headers: { 'Prefer': 'return=minimal,resolution=ignore-duplicates' },
        body: JSON.stringify({ id: data.user.id })
      });
    } catch(e) { /* profile may already exist */ }
  }
  return data;
}

async function apexSignIn(email, password) {
  var data = await apexFetch('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email: email, password: password })
  });
  if (data.access_token) await apexSetSession(data);
  return data;
}

async function apexSignOut() {
  var session = await apexGetSession();
  if (session && session.access_token) {
    try {
      await apexFetch('/auth/v1/logout', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + session.access_token }
      });
    } catch(e) { /* ignore signout errors */ }
  }
  await apexClearSession();
}

async function apexGetUser() {
  return await apexFetch('/auth/v1/user');
}

async function apexRefreshSession() {
  var session = await apexGetSession();
  if (!session || !session.refresh_token) return null;
  var data = await apexFetch('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: session.refresh_token })
  });
  if (data.access_token) await apexSetSession(data);
  return data;
}

// Checks session validity, refreshes if needed. Returns user object or null.
async function apexVerifyAuth() {
  var session = await apexGetSession();
  if (!session || !session.access_token) return null;
  // Check expiry
  var exp = session.expires_at || 0;
  if (exp && (Date.now() / 1000) > (exp - 60)) {
    try { await apexRefreshSession(); } catch(e) { await apexClearSession(); return null; }
  }
  try {
    return await apexGetUser();
  } catch(e) {
    try { await apexRefreshSession(); return await apexGetUser(); } catch(e2) {
      await apexClearSession(); return null;
    }
  }
}

// ── Platform account linking ──────────────────────────────────────────────────

async function apexLinkPlatformAccount(platform, username) {
  await apexFetch('/rest/v1/platform_accounts', {
    method: 'POST',
    headers: { 'Prefer': 'return=minimal,resolution=ignore-duplicates' },
    body: JSON.stringify({ platform: platform, username: username.toLowerCase().trim() })
  });
  var accounts = await apexGetLinkedAccounts();
  // Cache in local storage so overlay can check without API call
  var obj = {}; obj[APEX_LINKED_KEY] = accounts;
  chrome.storage.local.set(obj);
  return accounts;
}

async function apexGetLinkedAccounts() {
  var data = await apexFetch('/rest/v1/platform_accounts?select=platform,username&order=linked_at.asc');
  return Array.isArray(data) ? data : [];
}

async function apexUnlinkPlatformAccount(platform, username) {
  await apexFetch('/rest/v1/platform_accounts?platform=eq.' + encodeURIComponent(platform) + '&username=eq.' + encodeURIComponent(username.toLowerCase()), {
    method: 'DELETE'
  });
  var accounts = await apexGetLinkedAccounts();
  var obj = {}; obj[APEX_LINKED_KEY] = accounts;
  chrome.storage.local.set(obj);
  return accounts;
}

// ── Fan history cloud sync ────────────────────────────────────────────────────

// Push local thirtyDayHistory to Supabase (upsert by fan_username + platform)
async function apexSyncFanHistory(thirtyDayHistory, platform) {
  platform = platform || 'chaturbate';
  var now = new Date().toISOString();
  var rows = Object.entries(thirtyDayHistory)
    .filter(function(e){ return e[1].total > 0; })
    .map(function(e){
      return {
        platform: platform,
        fan_username: e[0],
        total_tokens: e[1].total,
        last_seen: new Date(e[1].lastSeen || Date.now()).toISOString(),
        updated_at: now
      };
    });
  if (!rows.length) return;
  // Upsert in batches of 50
  for (var i = 0; i < rows.length; i += 50) {
    await apexFetch('/rest/v1/fan_history', {
      method: 'POST',
      headers: { 'Prefer': 'return=minimal,resolution=merge-duplicates' },
      body: JSON.stringify(rows.slice(i, i + 50))
    });
  }
}

// Pull fan history from Supabase and return in thirtyDayHistory format
async function apexLoadFanHistory(platform) {
  platform = platform || 'chaturbate';
  var data = await apexFetch(
    '/rest/v1/fan_history?platform=eq.' + encodeURIComponent(platform) +
    '&select=fan_username,total_tokens,last_seen&order=total_tokens.desc&limit=2000'
  );
  if (!Array.isArray(data)) return {};
  var result = {};
  data.forEach(function(row) {
    result[row.fan_username] = {
      total: row.total_tokens || 0,
      lastSeen: row.last_seen ? new Date(row.last_seen).getTime() : Date.now(),
      sessionSnapshot: 0
    };
  });
  return result;
}

// ── Platform match check ──────────────────────────────────────────────────────
// Returns true if the detected username matches any linked account on this platform
function apexIsPlatformLinked(detectedUsername, linkedAccounts, platform) {
  if (!detectedUsername || !Array.isArray(linkedAccounts) || !linkedAccounts.length) return false;
  var dn = detectedUsername.toLowerCase();
  var pl = (platform || 'chaturbate').toLowerCase();
  return linkedAccounts.some(function(a) {
    return a.platform === pl && a.username === dn;
  });
}
