// Apex Revenue – analytics-cs.js
// PostHog content script initialisation
// Uses window.posthog set by posthog.umd.js loaded before this file

console.log('analytics-cs.js executing');

(function () {
  if (!window.posthog) {
    console.warn('[Apex] PostHog not available');
    return;
  }

  window.posthog.init('phc_Megg3zY6SfJFPujxs2AjhxPkv3JqjYQnASxcASHNfGJ', {
    api_host:                  'https://us.i.posthog.com',
    ui_host:                   'https://us.posthog.com',
    person_profiles:           'identified_only',
    autocapture:               false,
    capture_pageview:          false,
    capture_pageleave:         false,
    disable_session_recording: false,
    loaded: (ph) => {
      chrome.storage.local.get(['ph_device_id'], (result) => {
        let id = result.ph_device_id;
        if (!id) {
          id = 'apex_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
          chrome.storage.local.set({ ph_device_id: id });
        }
        ph.identify(id, {
          platform: window.location.hostname,
          extension_version: '0.5.1',
        });
        ph.capture('session_started', { platform: window.location.hostname });
      });
    }
  });

  window.__apexPostHog = window.posthog;
})();
