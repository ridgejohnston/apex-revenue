// Apex Revenue – popup-live.js v0.6.0
// Connects popup.html to live session data from apexLiveData storage.
// Runs after DOMContentLoaded and patches all static demo content with real values.

(function () {
  'use strict';

  var TIER_EMOJI = { 1: '🐋', 2: '🔥', 3: '💎', 4: '👤' };
  var AVATAR_COLORS = [
    'linear-gradient(135deg,#ffd166,#ff9f3a)',
    'linear-gradient(135deg,#ff3f6c,#ff8c42)',
    'linear-gradient(135deg,#4a9eff,#7c5cfc)',
    'linear-gradient(135deg,#06d6a0,#4affb0)',
    'linear-gradient(135deg,#7c5cfc,#b48aff)',
    'linear-gradient(135deg,#ff63a5,#ffb3d1)',
    'linear-gradient(135deg,#ffd166,#c0306e)',
    'linear-gradient(135deg,#4affb0,#4a9eff)',
  ];

  function fmt(n) {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n || 0);
  }

  // ── Stats row ────────────────────────────────────────────────────────────────
  function renderStats(data) {
    var tph      = data.tokensPerHour || 0;
    var viewers  = data.viewers || 0;
    var convRate = data.convRate || '0.0';

    var tipsEl = document.querySelector('.stat-card.tips .stat-value');
    if (tipsEl) tipsEl.innerHTML = fmt(tph) + '<span>/hr</span>';

    var viewersEl = document.querySelector('.stat-card.viewers .stat-value');
    if (viewersEl) {
      var vStr = viewers >= 1000 ? (viewers / 1000).toFixed(1) + '<span>k</span>' : viewers + '<span></span>';
      viewersEl.innerHTML = vStr;
    }

    var convEl = document.querySelector('.stat-card.conv .stat-value');
    if (convEl) convEl.innerHTML = convRate + '<span>%</span>';

    // Change indicators
    var tipsChange = document.querySelector('.stat-card.tips .stat-change');
    if (tipsChange) {
      if (tph > 200) { tipsChange.textContent = '↑ Hot session'; tipsChange.className = 'stat-change up'; }
      else if (tph > 50) { tipsChange.textContent = '↑ Active'; tipsChange.className = 'stat-change up'; }
      else if (tph === 0) { tipsChange.textContent = '— Waiting'; tipsChange.className = 'stat-change'; }
    }
  }

  // ── Alert banner ─────────────────────────────────────────────────────────────
  function renderAlert(data) {
    var banner    = document.querySelector('.alert-banner');
    var alertText = document.querySelector('.alert-text');
    var alertLabel = document.querySelector('.alert-label');
    var alertIcon  = document.querySelector('.alert-icon');
    if (!banner) return;

    var whales     = (data.whales || []).filter(function(w) { return w.present !== false; });
    var tph        = data.tokensPerHour || 0;
    var viewers    = data.viewers || 0;
    var tippers    = (data.fans || []).filter(function(f) { return f.tips > 0; });
    var prompts    = data.prompts || [];

    if (whales.length >= 3) {
      if (alertIcon) alertIcon.textContent = '🔥';
      if (alertLabel) alertLabel.textContent = 'High Tip Moment';
      if (alertText) alertText.textContent = whales.length + ' whales in chat — launch a goal now';
    } else if (whales.length >= 2) {
      if (alertIcon) alertIcon.textContent = '🐋';
      if (alertLabel) alertLabel.textContent = 'Whales Present';
      if (alertText) alertText.textContent = whales[0].username + ' & ' + whales[1].username + ' are in the room';
    } else if (whales.length === 1) {
      if (alertIcon) alertIcon.textContent = '⚡';
      if (alertLabel) alertLabel.textContent = 'Whale Alert';
      if (alertText) alertText.textContent = whales[0].username + ' is in the room — personalise your next action';
    } else if (tph > 150) {
      if (alertIcon) alertIcon.textContent = '📈';
      if (alertLabel) alertLabel.textContent = 'High Earnings';
      if (alertText) alertText.textContent = 'You\'re earning ' + fmt(tph) + ' tokens/hr — keep momentum with a goal';
    } else if (viewers > 50 && tippers.length === 0) {
      if (alertIcon) alertIcon.textContent = '🎯';
      if (alertLabel) alertLabel.textContent = 'High Traffic';
      if (alertText) alertText.textContent = viewers + ' viewers with no tips yet — drop your tip menu now';
    } else if (prompts.length > 0) {
      if (alertIcon) alertIcon.textContent = prompts[0].emoji || '💡';
      if (alertLabel) alertLabel.textContent = 'Tip';
      if (alertText) alertText.textContent = prompts[0].action;
    } else {
      if (alertIcon) alertIcon.textContent = '💡';
      if (alertLabel) alertLabel.textContent = 'Monitoring';
      if (alertText) alertText.textContent = 'Watching your room for opportunities…';
    }
  }

  // ── Whale tracker ────────────────────────────────────────────────────────────
  function renderWhales(data) {
    var whales     = data.whales || [];
    var totalTips  = data.totalTips || 0;
    var inRoom     = whales.filter(function(w) { return w.present !== false; }).length;

    // Count badge
    var countEl = document.querySelector('.whale-section .section-link');
    if (countEl) countEl.textContent = inRoom + ' in room';

    // Footer total
    var footerEl = document.querySelector('.whale-section-footer .whale-total-val');
    if (footerEl) footerEl.textContent = fmt(totalTips);

    // Table rows
    var table = document.querySelector('.whale-table');
    if (!table) return;
    var headerEl = table.querySelector('.whale-table-header');
    table.innerHTML = '';
    if (headerEl) table.appendChild(headerEl);

    if (whales.length === 0) {
      var empty = document.createElement('div');
      empty.style.cssText = 'text-align:center;padding:16px;font-size:11px;color:var(--muted);opacity:0.6';
      empty.textContent = 'No tippers yet — watching for activity…';
      table.appendChild(empty);
      return;
    }

    whales.slice(0, 5).forEach(function(w, i) {
      var tier    = Math.min(w.tier || 4, 4);
      var present = w.present !== false;
      var emoji   = TIER_EMOJI[tier] || '👤';
      var tierLabel = tier === 1 ? 'Gold' : tier === 2 ? 'Silver' : tier === 3 ? 'Bronze' : 'Viewer';

      var row = document.createElement('div');
      row.className = 'whale-row' + (present ? ' in-room' : ' left');
      row.innerHTML =
        '<div class="whale-identity">' +
          '<div class="whale-avatar tier-' + tier + '">' + emoji +
            '<div class="whale-status-dot ' + (present ? 'online' : 'offline') + '"></div>' +
          '</div>' +
          '<div class="whale-name-wrap">' +
            '<div class="whale-name">' + w.username + '</div>' +
            '<div class="whale-rank">#' + (i + 1) + ' tipper · ' + tierLabel + (present ? '' : ' · Left') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="whale-tips">' + fmt(w.tips) + '</div>' +
        '<div class="whale-count joins"><span class="whale-count-val">' + (w.joins || 0) + '</span></div>' +
        '<div class="whale-count leaves"><span class="whale-count-val">' + (w.leaves || 0) + '</span></div>';
      table.appendChild(row);
    });
  }

  // ── Monetization prompts ─────────────────────────────────────────────────────
  function renderPrompts(data) {
    var prompts = data.prompts;
    if (!prompts || !prompts.length) return;

    // Find prompts container (the parent of all .prompt-card elements)
    var cards = document.querySelectorAll('.prompt-card');
    if (!cards.length) return;
    var container = cards[0].parentElement;
    if (!container) return;

    var heatClasses = ['hot', 'medium', 'cool'];
    container.innerHTML = '';
    prompts.slice(0, 3).forEach(function(p, i) {
      var card = document.createElement('div');
      card.className = 'prompt-card ' + (heatClasses[i] || '');
      card.innerHTML =
        '<div class="prompt-emoji">' + (p.emoji || '💡') + '</div>' +
        '<div class="prompt-content">' +
          '<div class="prompt-action">' + p.action + '</div>' +
          '<div class="prompt-meta">' + p.meta + '</div>' +
        '</div>' +
        '<div class="prompt-value">+' + fmt(p.value || 0) + '</div>';
      container.appendChild(card);
    });
  }

  // ── AI Pricing ───────────────────────────────────────────────────────────────
  function renderPricing(data) {
    var pricing = data.pricing;
    if (!pricing) return;
    var curEl = document.querySelector('.pricing-amount.current');
    var recEl = document.querySelector('.pricing-amount.recommended');
    var maxEl = document.querySelector('.pricing-amount.max');
    var insightEl = document.querySelector('.ai-text');
    if (curEl) curEl.textContent = pricing.current + ' tk';
    if (recEl) recEl.textContent = pricing.recommended + ' tk';
    if (maxEl) maxEl.textContent = pricing.max + ' tk';
    if (insightEl) insightEl.textContent = pricing.insight;
  }

  // ── Fan leaderboard ──────────────────────────────────────────────────────────
  function renderFans(data) {
    var fans      = data.fans || [];
    var totalTips = data.totalTips || 0;

    var summaryEl = document.querySelector('#page-fans .fans-summary-val');
    if (summaryEl) summaryEl.textContent = fmt(totalTips);

    var listEl = document.querySelector('#page-fans .fans-list');
    if (!listEl) return;
    var headEl = listEl.querySelector('.fan-table-head');
    listEl.innerHTML = '';
    if (headEl) listEl.appendChild(headEl);

    if (fans.length === 0) {
      var empty = document.createElement('div');
      empty.style.cssText = 'text-align:center;padding:20px;font-size:11px;color:var(--muted);opacity:0.6';
      empty.textContent = 'No fans yet — open your stream on a supported platform';
      listEl.appendChild(empty);
      return;
    }

    fans.slice(0, 10).forEach(function(fan, i) {
      var tier     = Math.min(fan.tier || 4, 4);
      var present  = fan.present !== false;
      var rankCls  = i === 0 ? 'gold-rank' : i === 1 ? 'silver-rank' : i === 2 ? 'bronze-rank' : '';
      var initial  = fan.username ? fan.username[0].toUpperCase() : '?';
      var color    = AVATAR_COLORS[i % AVATAR_COLORS.length];

      var badges = '';
      if (fan.tips >= 200) badges += '<span class="badge badge-whale">🐋 Whale</span>';
      if (tier === 1) badges += '<span class="badge badge-gold">🥇 Gold</span>';
      else if (tier === 2) badges += '<span class="badge badge-silver">🥈 Silver</span>';
      else if (tier === 3) badges += '<span class="badge badge-bronze">🥉 Bronze</span>';
      if (fan.joins > 2) badges += '<span class="badge badge-loyal">🔁 Loyal</span>';
      if (!present) badges += '<span class="badge badge-left">↩ Left</span>';

      var row = document.createElement('div');
      row.className = 'fan-row' + (present ? '' : ' faded');
      row.innerHTML =
        '<div class="fan-col rank"><span class="rank-num ' + rankCls + '">' + (i + 1) + '</span></div>' +
        '<div class="fan-col user">' +
          '<div class="fan-avatar" style="background:' + color + '">' + initial + '</div>' +
          '<div class="fan-info">' +
            '<div class="fan-name">' + fan.username + '</div>' +
            '<div class="fan-badges">' + badges + '</div>' +
          '</div>' +
          '<div class="fan-presence ' + (present ? 'online-dot' : 'offline-dot') + '"></div>' +
        '</div>' +
        '<div class="fan-col tips-col"><span class="tip-amt' + (i < 3 ? ' top' : '') + '">' + fmt(fan.tips) + '</span></div>' +
        '<div class="fan-col cnt"><span class="cnt-in">' + (fan.joins || 0) + '</span></div>' +
        '<div class="fan-col cnt"><span class="cnt-out">' + (fan.leaves || 0) + '</span></div>';
      listEl.appendChild(row);
    });
  }

  // ── Master render ─────────────────────────────────────────────────────────────
  function renderAll(data) {
    if (!data) return;
    renderStats(data);
    renderAlert(data);
    renderWhales(data);
    renderPrompts(data);
    renderPricing(data);
    renderFans(data);
  }

  // ── Wire up storage ───────────────────────────────────────────────────────────
  function init() {
    if (typeof chrome === 'undefined' || !chrome.storage) return;

    // Load existing data immediately
    chrome.storage.local.get(['apexLiveData'], function(result) {
      if (result.apexLiveData) renderAll(result.apexLiveData);
    });

    // Watch for live updates
    chrome.storage.onChanged.addListener(function(changes) {
      if (changes.apexLiveData && changes.apexLiveData.newValue) {
        renderAll(changes.apexLiveData.newValue);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
