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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'injectPosthog' && sender.tab?.id) {
    const tabId = sender.tab.id
    chrome.scripting.executeScript({ target: { tabId }, files: ['array.full.no-external.js'], world: 'MAIN' })
      .then(() => chrome.scripting.executeScript({ target: { tabId }, files: ['posthog-recorder.js'], world: 'MAIN' }))
      // Debug step – check what's registered before init fires
      .then(() => chrome.scripting.executeScript({
        target: { tabId },
        world: 'MAIN',
        func: () => {
          console.log('[ApexRevenue] __PosthogExtensions__:', JSON.stringify(Object.keys(window.__PosthogExtensions__ || {})))
          console.log('[ApexRevenue] recorder registered:', !!window.__PosthogExtensions__?.recorder)
        },
      }))
      .then(() => chrome.scripting.executeScript({
        target: { tabId },
        world: 'MAIN',
        func: () => {
          window.posthog?.init('phc_Megg3zY6SfJFPujxs2AjhxPkv3JqjYQnASxcASHNfGJ', {
            api_host: 'https://us.i.posthog.com',
            advanced_disable_decide: true,
            __preview_remote_config: false,
            disable_session_recording: false,
            enable_recording_console_log: true,
            session_recording: { maskAllInputs: true },
          })
        },
      }))
      .then(() => sendResponse({ success: true }))
      .catch(err => {
        console.error('[ApexRevenue] PostHog injection failed:', err)
        sendResponse({ success: false, error: err.message })
      })
    return true
  }
})
