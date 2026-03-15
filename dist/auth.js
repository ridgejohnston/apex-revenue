// ── Apex Revenue — auth.js v1.0 ──────────────────────────────────────────────
// Supabase auth client for the Chrome extension.
// Handles sign-up, sign-in, session refresh, platform account linking,
// and cloud fan-history sync.
//
// ─────────────────────────────────────────────────────────────────────────────

var APEX_SUPABASE_URL      = 'https://ylqpsjwdsgtqdeqetkbt.supabase.co';
var APEX_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlscXBzandkc2d0cWRlcWV0a2J0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NDgwNjYsImV4cCI6MjA4OTAyNDA2Nn0._S3ZdFIodfPvpzy-r9CrqIkF5eSxhCW_2uylxETWYNA';
var APEX_SESSION_KEY       = 'apexSession';
var APEX_LINKED_KEY        = 'apexLinkedAccounts';
var APEX_ADMIN_KEY         = 'apexIsAdmin';

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
    chrome.storage.local.remove([APEX_SESSION_KEY, APEX_LINKED_KEY, APEX_ADMIN_KEY], resolve);
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
  // Always set Authorization — use session token if available, otherwise anon key.
  // Newer Supabase requires Bearer <anon-key> even for unauthenticated requests.
  headers['Authorization'] = 'Bearer ' + (
    (session && session.access_token) ? session.access_token : APEX_SUPABASE_ANON_KEY
  );
  var url = APEX_SUPABASE_URL + path;
  console.log('[ApexAuth] fetch ->', options.method || 'GET', url);
  var res;
  try {
    res = await fetch(url, Object.assign({}, options, { headers: headers }));
  } catch(netErr) {
    console.error('[ApexAuth] network error ->', netErr);
    throw new Error('Network error — could not reach Apex Revenue servers. (' + netErr.message + ')');
  }
  var text = await res.text();
  var data = {};
  try { data = text ? JSON.parse(text) : {}; } catch(e) { data = { raw: text }; }
  console.log('[ApexAuth] response', res.status, data);
  if (!res.ok) {
    // Supabase uses different field names across versions:
    // v1: { error, error_description }
    // v2: { message }
    // newer: { msg, error_code, code }
    var msg = data.error_description
           || data.message
           || data.msg
           || data.error
           || data.error_code
           || ('HTTP ' + res.status + (text ? ': ' + text.slice(0, 120) : ''));
    console.error('[ApexAuth] API error ->', res.status, msg, data);
    throw new Error(msg);
  }
  return data;
}

// ── Auth operations ───────────────────────────────────────────────────────────

// Normalise Supabase v1/v2 response: v2 may nest session under data.session
function apexNormaliseAuthData(data) {
  if (!data) return data;
  // v2 format: { user, session: { access_token, ... } }
  if (!data.access_token && data.session && data.session.access_token) {
    return Object.assign({}, data.session, { user: data.user || data.session.user });
  }
  return data;
}

async function apexSignUp(email, password) {
  var raw = await apexFetch('/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify({ email: email, password: password })
  });
  var data = apexNormaliseAuthData(raw);
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
  var raw = await apexFetch('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email: email, password: password })
  });
  var data = apexNormaliseAuthData(raw);
  if (data.access_token) {
    await apexSetSession(data);
    // Fetch and cache admin status so the overlay can bypass checks instantly
    apexFetchAdminStatus().catch(function(){});
  }
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
  var session = await apexGetSession();
  var userId = session && session.user && session.user.id;
  if (!userId) throw new Error('Not signed in — please sign in again.');
  await apexFetch('/rest/v1/platform_accounts', {
    method: 'POST',
    headers: { 'Prefer': 'return=minimal,resolution=ignore-duplicates' },
    body: JSON.stringify({ user_id: userId, platform: platform, username: username.toLowerCase().trim() })
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

// ── Admin status ──────────────────────────────────────────────────────────────
// Fetches is_admin from the profiles table and caches it in chrome.storage.
// Called automatically after sign-in; result is read synchronously by the overlay.

async function apexFetchAdminStatus() {
  try {
    var session = await apexGetSession();
    var userId = session && session.user && session.user.id;
    if (!userId) {
      var obj = {}; obj[APEX_ADMIN_KEY] = false;
      chrome.storage.local.set(obj);
      return false;
    }
    var data = await apexFetch(
      '/rest/v1/profiles?id=eq.' + encodeURIComponent(userId) + '&select=is_admin'
    );
    var isAdmin = Array.isArray(data) && data.length > 0 && data[0].is_admin === true;
    var obj = {}; obj[APEX_ADMIN_KEY] = isAdmin;
    chrome.storage.local.set(obj);
    return isAdmin;
  } catch(e) {
    console.error('[ApexAuth] apexFetchAdminStatus error:', e);
    return false;
  }
}

// ── Fan history cloud sync ────────────────────────────────────────────────────

// Push local thirtyDayHistory to Supabase (upsert by fan_username + platform)
async function apexSyncFanHistory(thirtyDayHistory, platform) {
  platform = platform || 'chaturbate';
  var session = await apexGetSession();
  var userId = session && session.user && session.user.id;
  if (!userId) return; // not signed in, skip sync
  var now = new Date().toISOString();
  var rows = Object.entries(thirtyDayHistory)
    .filter(function(e){ return e[1].total > 0; })
    .map(function(e){
      return {
        user_id: userId,
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

// ── Account ownership verification (bio code challenge) ──────────────────────
// Generates a short unique code bound to this user_id and stores it in Supabase.
// The user pastes it into their streaming profile bio; the extension then checks
// the bio page for the code before consuming it (single-use, 10-min expiry).

async function apexGenerateVerificationCode(platform, username) {
  var session = await apexGetSession();
  var userId = session && session.user && session.user.id;
  if (!userId) throw new Error('Not signed in — please sign in again.');

  // Delete any previous codes for this user so there's never more than one active
  try {
    await apexFetch('/rest/v1/verification_codes?user_id=eq.' + encodeURIComponent(userId), { method: 'DELETE' });
  } catch(e) { /* ignore */ }

  // Build a readable 6-char code — exclude confusable chars (0/O, 1/I/L)
  var chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  var suffix = '';
  for (var i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  var code = 'APEX-' + suffix;

  await apexFetch('/rest/v1/verification_codes', {
    method: 'POST',
    headers: { 'Prefer': 'return=minimal' },
    body: JSON.stringify({
      user_id:  userId,
      platform: platform,
      username: username.toLowerCase().trim(),
      code:     code
    })
  });

  return code;
}

// Validates the code server-side (checks user_id binding + expiry) then deletes it.
// Call only AFTER the bio check has already confirmed the code is visible on the profile.
async function apexConsumeVerificationCode(code, platform, username) {
  var session = await apexGetSession();
  var userId = session && session.user && session.user.id;
  if (!userId) throw new Error('Not signed in — please sign in again.');

  var data = await apexFetch(
    '/rest/v1/verification_codes' +
    '?user_id=eq.'  + encodeURIComponent(userId) +
    '&code=eq.'     + encodeURIComponent(code) +
    '&platform=eq.' + encodeURIComponent(platform) +
    '&username=eq.' + encodeURIComponent(username.toLowerCase().trim()) +
    '&expires_at=gte.' + new Date().toISOString() +
    '&select=id'
  );

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Code not found or has expired. Please request a new one.');
  }

  // Consume (delete) the code — single-use
  await apexFetch(
    '/rest/v1/verification_codes?user_id=eq.' + encodeURIComponent(userId) +
    '&code=eq.' + encodeURIComponent(code),
    { method: 'DELETE' }
  );

  return true;
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
