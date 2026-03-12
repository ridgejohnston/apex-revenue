/**
 * Apex Revenue — posthog-init.js  v0.6.0
 *
 * Initialises PostHog with full Session Replay (Screen Session Playback Monitoring)
 * in the overlay extension-page context (chrome-extension://…/overlay.html).
 *
 * Why this file exists:
 *   PostHog's session recorder is normally lazy-fetched from CDN at
 *   https://us-assets.i.posthog.com/static/recorder.js
 *   Chrome Manifest V3 forbids external script loading (script-src 'self'),
 *   so we bundle recorder.js locally as ph-recorder.js and patch
 *   window.__PosthogExtensions__.loadExternalDependency to serve it
 *   via chrome.runtime.getURL() instead.
 *
 * Load order in overlay.html:
 *   1. posthog.js        (array.js IIFE — sets window.posthog, window.__PosthogExtensions__)
 *   2. posthog-init.js   (this file — patches loader, calls posthog.init())
 *   3. overlay.js        (main overlay logic)
 */
(function () {
  'use strict';

  var POSTHOG_API_KEY = 'phc_Megg3zY6SfJFPujxs2AjhxPkv3JqjYQnASxcASHNfGJ';
  var POSTHOG_HOST    = 'https://us.i.posthog.com';
  var EXT_VERSION     = '0.6.0';

  /* ── 1. Guard: posthog.js must be loaded first ─────────────────────────── */
  if (!window.posthog) {
    console.warn('[Apex PostHog] posthog.js not found — session replay disabled.');
    return;
  }

  /* ── 2. Patch the external-dependency loader to use bundled files ─────── */
  function patchRecorderLoader() {
    var ext = window.__PosthogExtensions__;
    if (!ext) {
      // PostHog may not have set this up yet — retry shortly
      setTimeout(patchRecorderLoader, 50);
      return;
    }

    var _origLoader = ext.loadExternalDependency;

    ext.loadExternalDependency = function (instance, dependencyName, callback) {
      // Intercept the recorder (rrweb) dependency requests
      if (dependencyName === 'recorder' || dependencyName === 'recorder-v2') {
        // Already loaded by a previous call?
        if (ext.rrweb && ext.rrweb.record) {
          callback(null);
          return;
        }

        var recorderUrl;
        try {
          recorderUrl = chrome.runtime.getURL('ph-recorder.js');
        } catch (e) {
          // Fallback: relative path (works in extension page context)
          recorderUrl = 'ph-recorder.js';
        }

        var script = document.createElement('script');
        script.src = recorderUrl;
        script.onload = function () {
          callback(null);
        };
        script.onerror = function (err) {
          console.error('[Apex PostHog] Failed to load ph-recorder.js', err);
          callback(err);
        };
        (document.head || document.documentElement).appendChild(script);
      } else {
        // All other dependencies (toolbar, surveys, etc.) use the default loader
        if (typeof _origLoader === 'function') {
          _origLoader.call(ext, instance, dependencyName, callback);
        }
      }
    };

    console.log('[Apex PostHog] Recorder loader patched — using bundled ph-recorder.js');
  }

  patchRecorderLoader();

  /* ── 3. Resolve device identity from chrome.storage ────────────────────── */
  function resolveDeviceId(callback) {
    try {
      chrome.storage.local.get(['ph_device_id'], function (result) {
        var id = result && result.ph_device_id;
        if (!id) {
          id = 'apex_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
          chrome.storage.local.set({ ph_device_id: id });
        }
        callback(id);
      });
    } catch (e) {
      // Fallback for non-extension contexts (e.g. local testing)
      callback('apex_fallback_' + Date.now().toString(36));
    }
  }

  /* ── 4. Detect which cam platform the user is currently on ─────────────── */
  function detectPlatform() {
    try {
      // The overlay iframe sits inside the cam page — read parent's hostname via
      // chrome.tabs, but since we're in an extension page we can try the
      // opener/parent hostname if same-origin, otherwise use stored value.
      // We'll read it from chrome.storage (set by content.js / background.js).
      return 'overlay'; // refined in loaded callback via storage
    } catch (e) {
      return 'unknown';
    }
  }

  /* ── 5. Initialise PostHog with Session Replay ──────────────────────────── */
  window.posthog.init(POSTHOG_API_KEY, {
    api_host: POSTHOG_HOST,
    ui_host: 'https://us.posthog.com',

    // Identity: record only identified users (performers, not viewers)
    person_profiles: 'identified_only',

    // Autocapture: capture all clicks, inputs, and navigation in the overlay
    autocapture: true,
    capture_pageview: false,   // overlay is not a "page" in the traditional sense
    capture_pageleave: false,

    // ── Session Replay ──────────────────────────────────────────────────────
    disable_session_recording: false,
    enable_recording_console_log: true,

    session_recording: {
      // Privacy: mask all text inputs by default, unmask non-sensitive elements
      maskAllInputs: true,
      maskInputOptions: {
        password: true,
        email: true,
        text: false,          // allow overlay text to be captured
        number: false,
        textarea: false,
        select: false,
      },
      // Block recording of sensitive elements
      blockClass: 'ph-no-capture',
      maskTextClass: 'ph-mask',
      // Capture network requests made by the overlay
      recordCrossOriginIframes: false,
      // Minimum recording session before sending (seconds)
      minimumDuration: 5,
    },

    // Persistence: use localStorage within the extension page
    persistence: 'localStorage',

    // Bootstrap: identify user once PostHog is ready
    loaded: function (ph) {
      resolveDeviceId(function (deviceId) {
        // Identify the performer (device-level identity, not PII)
        ph.identify(deviceId, {
          extension_version: EXT_VERSION,
          context: 'overlay',
        });

        // Read platform from storage set by content.js
        try {
          chrome.storage.local.get(['apexLiveData'], function (result) {
            var platform = 'unknown';
            if (result && result.apexLiveData && result.apexLiveData.platform) {
              platform = result.apexLiveData.platform;
            }
            ph.setPersonProperties({ platform: platform });
            ph.capture('overlay_opened', {
              extension_version: EXT_VERSION,
              platform: platform,
            });
          });
        } catch (e) {
          ph.capture('overlay_opened', { extension_version: EXT_VERSION });
        }
      });
    },
  });

  /* ── 6. Expose on window for overlay.js to use if needed ───────────────── */
  window.__apexPostHog = window.posthog;

  console.log('[Apex PostHog] Initialised with session replay (v' + EXT_VERSION + ')');
})();
