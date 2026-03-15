chrome.runtime.onInstalled.addListener(()=>{console.log("Apex Revenue installed."),chrome.storage.local.set({apexLiveData:{tokensPerHour:0,viewers:0,convRate:0,whales:[],fans:[]}})});chrome.runtime.onMessage.addListener((e,a,t)=>{if(e.type==="SESSION_UPDATE"&&(chrome.storage.local.set({apexLiveData:e.data}),t({status:"ok"})),e.type==="GET_SESSION")return chrome.storage.local.get(["apexLiveData"],s=>{t(s.apexLiveData||{})}),!0});

// ── Password Recovery Interceptor ─────────────────────────────────────────────
// Fires on URL change (before page loads) so localhost:3000 not running isn't an issue.
// Stores the token and redirects the tab to the extension's recovery page.
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo) {
  var url = changeInfo.url || '';
  if (!url.includes('type=recovery') || !url.includes('access_token=')) return;

  var hashIndex = url.indexOf('#');
  if (hashIndex === -1) return;
  var hash = url.slice(hashIndex + 1);
  var params = {};
  hash.split('&').forEach(function(pair) {
    var eq = pair.indexOf('=');
    if (eq === -1) return;
    try { params[decodeURIComponent(pair.slice(0, eq))] = decodeURIComponent(pair.slice(eq + 1)); } catch(e) {}
  });

  var accessToken = params['access_token'];
  if (!accessToken || params['type'] !== 'recovery') return;

  // Stash the token then redirect to the extension's dedicated recovery page
  chrome.storage.local.set({ apexRecoveryToken: accessToken }, function() {
    chrome.tabs.update(tabId, { url: chrome.runtime.getURL('recovery.html') });
  });
});

// ── PostHog Event Capture ─────────────────────────────────────────────────────
// Sends PostHog capture events directly from the service worker.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'POSTHOG_CAPTURE') {
    fetch('https://us.i.posthog.com/e/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: 'phc_Megg3zY6SfJFPujxs2AjhxPkv3JqjYQnASxcASHNfGJ',
        event: message.event,
        properties: {
          distinct_id: message.distinct_id,
          ...message.properties,
        },
        timestamp: new Date().toISOString(),
      }),
    })
      .then(() => sendResponse({ ok: true }))
      .catch(err => sendResponse({ ok: false, error: err.message }))
    return true // keep channel open for async response
  }
})

// ── PostHog Request Proxy ─────────────────────────────────────────────────────
// Forwards PostHog API calls from the page context through the service worker
// so they aren't blocked by the extension's CSP.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'POSTHOG_REQUEST') {
    fetch(message.url, {
      method: 'POST',
      headers: message.headers,
      body: message.data,
    })
      .then(res => res.json())
      .then(data => sendResponse({ ok: true, data }))
      .catch(err => sendResponse({ ok: false, error: err.message }))
    return true // keep channel open for async response
  }
})

