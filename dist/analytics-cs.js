/**
 * Apex Revenue — analytics-cs.js  v0.6.0
 *
 * Content-script PostHog initialiser.
 * Runs in the cam platform page context alongside content.js / popout.js.
 *
 * This script captures performer analytics events on the cam page itself
 * (tip events, viewer counts, etc.) which PostHog can correlate with the
 * overlay session replay captured via overlay.html / posthog-init.js.
 *
 * Session replay of the full cam page is intentionally disabled here
 * (the cam page contains third-party content we should not record).
 * Session replay of the Apex overlay iframe is handled in posthog-init.js.
 */
(function () {
  'use strict';

  /* ── Guard ─────────────────────────────────────────────────────────────── */
  if (!window.posthog) {
    // PostHog is not available on this page — skip silently.
    // The overlay handles session replay independently via posthog-init.js.
    return;
  }

  var POSTHOG_API_KEY = 'phc_Megg3zY6SfJFPujxs2AjhxPkv3JqjYQnASxcASHNfGJ';
  var EXT_VERSION = '0.6.0';

  /* ── Initialise PostHog on the cam page (event tracking only) ──────────── */
  window.posthog.init(POSTHOG_API_KEY, {
    api_host: 'https://us.i.posthog.com',
    ui_host: 'https://us.posthog.com',

    person_profiles: 'identified_only',

    // Enable autocapture for click/input events on cam page UI
    autocapture: true,

    capture_pageview: true,
    capture_pageleave: true,

    // Session replay of the cam page itself is OFF:
    // — the overlay replay (posthog-init.js) is the authoritative session recording.
    // — recording third-party cam content could violate platform ToS.
    disable_session_recording: true,

    loaded: function (ph) {
      // Resolve or create a persistent device ID
      try {
        chrome.storage.local.get(['ph_device_id'], function (result) {
          var id = result && result.ph_device_id;
          if (!id) {
            id = 'apex_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
            chrome.storage.local.set({ ph_device_id: id });
          }

          ph.identify(id, {
            platform: window.location.hostname,
            extension_version: EXT_VERSION,
            context: 'cam_page',
          });

          ph.capture('cam_page_loaded', {
            platform: window.location.hostname,
            extension_version: EXT_VERSION,
            url: window.location.href,
          });
        });
      } catch (e) {
        // Non-extension context fallback (e.g. unit tests)
        ph.capture('cam_page_loaded', {
          platform: window.location.hostname,
          extension_version: EXT_VERSION,
        });
      }
    },
  });

  window.__apexPostHog = window.posthog;
})();
