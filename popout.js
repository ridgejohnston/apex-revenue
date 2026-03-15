// popout.js - Content script for Apex Revenue Chrome Extension
// Manages overlay iframe toggle, drag, resize, minimize
// PostHog is handled entirely by background.js via chrome.scripting.executeScript()

console.log('popout.js executing');

(function () {
  'use strict';

  if (window.__apexRevenueInjected) return;
  window.__apexRevenueInjected = true;

  // ─── Constants ───────────────────────────────────────────────────────────────
  const OVERLAY_ID  = 'apex-revenue-overlay-iframe';
  const TOGGLE_ID   = 'apex-revenue-toggle-btn';
  const STORAGE_KEY = 'apexOverlayState';
  const OVERLAY_URL = chrome.runtime.getURL('overlay.html');

  const DEFAULT_STATE = {
    visible:   false,
    minimized: false,
    x:         null,
    y:         null,
    width:     420,
    height:    600,
  };

  // ─── State ───────────────────────────────────────────────────────────────────
  let state       = { ...DEFAULT_STATE };
  let iframe      = null;
  let toggleBtn   = null;
  let isDragging  = false;
  let isResizing  = false;
  let dragOffsetX  = 0;
  let dragOffsetY  = 0;
  let resizeStartX = 0;
  let resizeStartY = 0;
  let resizeStartW = 0;
  let resizeStartH = 0;

  // ─── Persistence ─────────────────────────────────────────────────────────────
  function loadState(cb) {
    try {
      chrome.storage.local.get(STORAGE_KEY, function (result) {
        if (result && result[STORAGE_KEY]) {
          state = Object.assign({}, DEFAULT_STATE, result[STORAGE_KEY]);
        }
        cb();
      });
    } catch (e) {
      cb();
    }
  }

  function saveState() {
    try {
      chrome.storage.local.set({ [STORAGE_KEY]: state });
    } catch (e) {}
  }

  // ─── Toggle Button ───────────────────────────────────────────────────────────
  function createToggleButton() {
    if (document.getElementById(TOGGLE_ID)) return;

    toggleBtn = document.createElement('div');
    toggleBtn.id        = TOGGLE_ID;
    toggleBtn.title     = 'Apex Revenue';
    toggleBtn.textContent = '⚡';

    Object.assign(toggleBtn.style, {
      position:       'fixed',
      bottom:         '24px',
      right:          '24px',
      zIndex:         '2147483647',
      width:          '44px',
      height:         '44px',
      borderRadius:   '50%',
      background:     'linear-gradient(135deg, #7c3aed, #4f46e5)',
      color:          '#fff',
      fontSize:       '20px',
      lineHeight:     '44px',
      textAlign:      'center',
      cursor:         'pointer',
      boxShadow:      '0 4px 14px rgba(0,0,0,0.4)',
      userSelect:     'none',
      transition:     'transform 0.15s ease, box-shadow 0.15s ease',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
    });

    toggleBtn.addEventListener('mouseenter', function () {
      toggleBtn.style.transform = 'scale(1.1)';
      toggleBtn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.5)';
    });
    toggleBtn.addEventListener('mouseleave', function () {
      toggleBtn.style.transform = 'scale(1)';
      toggleBtn.style.boxShadow = '0 4px 14px rgba(0,0,0,0.4)';
    });
    toggleBtn.addEventListener('click', handleToggle);

    document.body.appendChild(toggleBtn);
  }

  function handleToggle() {
    if (state.visible) {
      hideOverlay();
    } else {
      showOverlay();
    }
  }

  // ─── Overlay Iframe ──────────────────────────────────────────────────────────
  function createOverlay() {
    if (document.getElementById(OVERLAY_ID)) return;

    iframe     = document.createElement('iframe');
    iframe.id  = OVERLAY_ID;
    iframe.src = OVERLAY_URL;
    iframe.allow = 'clipboard-write';

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const w = state.width  || DEFAULT_STATE.width;
    const h = state.height || DEFAULT_STATE.height;
    const x = state.x !== null ? state.x : vw - w - 32;
    const y = state.y !== null ? state.y : (vh - h) / 2;

    Object.assign(iframe.style, {
      position:     'fixed',
      left:         clampX(x, w) + 'px',
      top:          clampY(y, h) + 'px',
      width:        w + 'px',
      height:       h + 'px',
      zIndex:       '2147483646',
      border:       'none',
      borderRadius: '12px',
      boxShadow:    '0 8px 32px rgba(0,0,0,0.45)',
      background:   '#1a1a2e',
      overflow:     'hidden',
      display:      'none',
      resize:       'none',
    });

    // Drag handle overlay (top bar of iframe is unreachable from content script,
    // so we use a thin transparent div layered on top for drag)
    const dragHandle   = createDragHandle();

    // Resize handle (bottom-right corner)
    const resizeHandle = createResizeHandle();

    document.body.appendChild(iframe);
    document.body.appendChild(dragHandle);
    document.body.appendChild(resizeHandle);

    syncHandlePositions(dragHandle, resizeHandle);

    iframe.__dragHandle   = dragHandle;
    iframe.__resizeHandle = resizeHandle;
  }

  function createDragHandle() {
    const el = document.createElement('div');
    el.setAttribute('data-apex-drag', '1');

    Object.assign(el.style, {
      position: 'fixed',
      zIndex:   '2147483647',
      cursor:   'move',
      height:   '36px',
      display:  'none',
    });

    el.addEventListener('mousedown', onDragStart);
    return el;
  }

  function createResizeHandle() {
    const el = document.createElement('div');
    el.setAttribute('data-apex-resize', '1');

    Object.assign(el.style, {
      position: 'fixed',
      zIndex:   '2147483647',
      cursor:   'nwse-resize',
      width:    '16px',
      height:   '16px',
      display:  'none',
    });

    el.addEventListener('mousedown', onResizeStart);
    return el;
  }

  function syncHandlePositions(dragHandle, resizeHandle) {
    if (!iframe) return;
    const left   = parseFloat(iframe.style.left);
    const top    = parseFloat(iframe.style.top);
    const width  = parseFloat(iframe.style.width);
    const height = parseFloat(iframe.style.height);

    Object.assign(dragHandle.style, {
      left:  left + 'px',
      top:   top  + 'px',
      width: (width - 62) + 'px', // leave right 62px clear for minimize/close buttons
    });

    Object.assign(resizeHandle.style, {
      left: (left + width  - 16) + 'px',
      top:  (top  + height - 16) + 'px',
    });
  }

  // ─── Show / Hide ─────────────────────────────────────────────────────────────
  function showOverlay() {
    if (!iframe) createOverlay();

    state.visible   = true;
    state.minimized = false;

    iframe.style.display = 'block';
    iframe.style.height  = (state.height || DEFAULT_STATE.height) + 'px';

    if (iframe.__dragHandle)   iframe.__dragHandle.style.display   = 'block';
    if (iframe.__resizeHandle) iframe.__resizeHandle.style.display = 'block';

    updateToggleButton();
    saveState();

    // Notify background to inject PostHog on this tab if not already done
    try {
      chrome.runtime.sendMessage({ action: 'injectPosthog' });
    } catch (e) {}
  }

  function hideOverlay() {
    if (!iframe) return;

    state.visible = false;

    iframe.style.display = 'none';

    if (iframe.__dragHandle)   iframe.__dragHandle.style.display   = 'none';
    if (iframe.__resizeHandle) iframe.__resizeHandle.style.display = 'none';

    updateToggleButton();
    saveState();
  }

  function updateToggleButton() {
    if (!toggleBtn) return;
    toggleBtn.style.background = state.visible
      ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
      : 'linear-gradient(135deg, #7c3aed, #4f46e5)';
  }

  // ─── Drag ────────────────────────────────────────────────────────────────────
  function onDragStart(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    isDragging  = true;
    dragOffsetX = e.clientX - parseFloat(iframe.style.left);
    dragOffsetY = e.clientY - parseFloat(iframe.style.top);
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup',   onDragEnd);
  }

  function onDragMove(e) {
    if (!isDragging || !iframe) return;
    const w = parseFloat(iframe.style.width);
    const h = parseFloat(iframe.style.height);
    const x = clampX(e.clientX - dragOffsetX, w);
    const y = clampY(e.clientY - dragOffsetY, h);

    iframe.style.left = x + 'px';
    iframe.style.top  = y + 'px';

    syncHandlePositions(iframe.__dragHandle, iframe.__resizeHandle);
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup',   onDragEnd);

    state.x = parseFloat(iframe.style.left);
    state.y = parseFloat(iframe.style.top);
    saveState();
  }

  // ─── Resize ──────────────────────────────────────────────────────────────────
  function onResizeStart(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    isResizing   = true;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    resizeStartW = parseFloat(iframe.style.width);
    resizeStartH = parseFloat(iframe.style.height);
    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('mouseup',   onResizeEnd);
  }

  function onResizeMove(e) {
    if (!isResizing || !iframe) return;
    const w = Math.max(320, Math.min(900, resizeStartW + (e.clientX - resizeStartX)));
    const h = Math.max(400, Math.min(900, resizeStartH + (e.clientY - resizeStartY)));

    iframe.style.width  = w + 'px';
    iframe.style.height = h + 'px';

    syncHandlePositions(iframe.__dragHandle, iframe.__resizeHandle);
  }

  function onResizeEnd() {
    if (!isResizing) return;
    isResizing = false;
    document.removeEventListener('mousemove', onResizeMove);
    document.removeEventListener('mouseup',   onResizeEnd);

    state.width  = parseFloat(iframe.style.width);
    state.height = parseFloat(iframe.style.height);
    saveState();
  }

  // ─── Message Bridge (overlay → page) ─────────────────────────────────────────
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.source !== 'apex-overlay') return;

    switch (e.data.type) {
      case 'CLOSE':
        hideOverlay();
        break;
      case 'MINIMISE':
        if (iframe) {
          state.minimized = e.data.minimised;
          iframe.style.height = state.minimized ? '40px' : (state.height || DEFAULT_STATE.height) + 'px';
          if (iframe.__resizeHandle) {
            iframe.__resizeHandle.style.display = state.minimized ? 'none' : 'block';
          }
          syncHandlePositions(iframe.__dragHandle, iframe.__resizeHandle);
          saveState();
        }
        break;
      case 'DRAG_START':
        if (iframe) {
          dragOffsetX = e.data.mouseX + parseFloat(iframe.style.left) - parseFloat(iframe.style.left);
          dragOffsetY = e.data.mouseY + parseFloat(iframe.style.top)  - parseFloat(iframe.style.top);
          onDragStart({ button: 0, clientX: e.data.mouseX + parseFloat(iframe.style.left), clientY: e.data.mouseY + parseFloat(iframe.style.top), preventDefault: function(){} });
        }
        break;
      case 'SET_OPACITY':
        if (iframe) iframe.style.opacity = e.data.value;
        break;
    }
  });

  // Forward content.js messages into the overlay iframe
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.source !== 'apex-content') return;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(Object.assign({}, e.data, { source: 'apex-popout' }), '*');
    }
  });

  // ─── Bounds Helpers ───────────────────────────────────────────────────────────
  function clampX(x, w) {
    return Math.max(0, Math.min(x, window.innerWidth  - w));
  }

  function clampY(y, h) {
    return Math.max(0, Math.min(y, window.innerHeight - 40));
  }

  // ─── DOM Guard (re-inject toggle if removed by SPA navigation) ───────────────
  new MutationObserver(function () {
    if (!document.getElementById(TOGGLE_ID)) createToggleButton();
  }).observe(document.body, { childList: true, subtree: false });

  // ─── Boot ────────────────────────────────────────────────────────────────────
  loadState(function () {
    createToggleButton();
    createOverlay();
    if (state.visible) showOverlay();
  });

})();
