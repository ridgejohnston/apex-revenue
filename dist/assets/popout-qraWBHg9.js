console.log("popout.js executing");function W(){const d=document.createElement("script");d.src=chrome.runtime.getURL("array.full.no-external.js"),d.onload=()=>{const c=document.createElement("script");c.textContent=`
      window.posthog.init('phc_Megg3zY6SfJFPujxs2AjhxPkv3JqjYQnASxcASHNfGJ', {
        api_host: 'https://us.i.posthog.com',
        advanced_disable_decide: true,
        __preview_remote_config: false,
        disable_session_recording: false,
        enable_recording_console_log: true,
        session_recording: { maskAllInputs: true }
      })
    `,document.head.appendChild(c)},document.head.appendChild(d)}W();(function(){const d="apex_overlay_pos",c="apex_overlay_open";let s=null,t=null,p=!1,x=!1,u=!1,g="",h=0,b=0,m=0,f=0,y=0,v=0,w=0,E=0;function _(){if(document.getElementById("apex-toggle-btn"))return;const e=document.createElement("div");e.id="apex-toggle-btn",e.title="Apex Revenue",e.innerHTML="⚡",e.style.cssText=`
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ff3f6c, #ff8c42);
      box-shadow: 0 4px 20px rgba(255,63,108,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      cursor: pointer;
      z-index: 2147483646;
      transition: transform 0.2s, box-shadow 0.2s;
      user-select: none;
    `,e.addEventListener("mouseenter",()=>{e.style.transform="scale(1.1)",e.style.boxShadow="0 6px 28px rgba(255,63,108,0.7)"}),e.addEventListener("mouseleave",()=>{e.style.transform="",e.style.boxShadow="0 4px 20px rgba(255,63,108,0.5)"}),e.addEventListener("click",M),document.body.appendChild(e)}function L(){if(document.getElementById("apex-overlay-wrapper"))return;const e=H(),n=e?e.x:Math.max(0,window.innerWidth-400-32),a=e?e.y:Math.max(0,window.innerHeight-560-90);t=document.createElement("div"),t.id="apex-overlay-wrapper",t.style.cssText=`
      position: fixed;
      left: ${n}px;
      top: ${a}px;
      width: 400px;
      height: 560px;
      z-index: 2147483645;
      border-radius: 14px;
      overflow: hidden;
      background: #0a0a0f;
      box-shadow: 0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08);
      transition: box-shadow 0.2s;
      display: none;
    `,s=document.createElement("iframe"),s.id="apex-overlay-iframe",s.src=chrome.runtime.getURL("overlay.html"),s.style.cssText=`
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 14px;
      display: block;
    `,t.appendChild(s),["nw","ne","sw","se"].forEach(r=>{const o=document.createElement("div");o.dataset.resizeDir=r;const i=r[0]==="n",l=r[1]==="w";o.style.cssText=`
        position:absolute;
        width:14px; height:14px;
        ${i?"top:-4px":"bottom:-4px"};
        ${l?"left:-4px":"right:-4px"};
        cursor:${r}-resize;
        z-index:10001;
        border-radius:${i&&l?"4px 0 0 0":i&&!l?"0 4px 0 0":!i&&l?"0 0 0 4px":"0 0 4px 0"};
        background:rgba(255,63,108,0.0);
        transition: background 0.15s;
      `,o.addEventListener("mouseenter",()=>{o.style.background="rgba(255,63,108,0.35)"}),o.addEventListener("mouseleave",()=>{u||(o.style.background="rgba(255,63,108,0)")}),o.addEventListener("mousedown",I),t.appendChild(o)}),document.body.appendChild(t),window.addEventListener("message",z)}function M(){t||L(),p=!p,t.style.display=p?"block":"none",chrome.storage.local.set({[c]:p})}function T(){p=!1,t&&(t.style.display="none"),chrome.storage.local.set({[c]:!1})}function z(e){if(!(!e.data||e.data.source!=="apex-overlay"))switch(e.data.type){case"CLOSE":T();break;case"DRAG_START":A(e.data.mouseX,e.data.mouseY);break;case"MINIMISE":j(e.data.minimised);break;case"SET_OPACITY":t&&(t.style.opacity=e.data.value);break}}window.addEventListener("message",function(e){!e.data||e.data.source!=="apex-content"||s&&s.contentWindow&&s.contentWindow.postMessage(Object.assign({},e.data,{source:"apex-popout"}),"*")});function A(e,n){if(!t)return;x=!0;const a=s.getBoundingClientRect(),r=e+a.left,o=n+a.top,i=t.getBoundingClientRect();w=r-i.left,E=o-i.top,s.style.pointerEvents="none",t.style.transition="none",t.style.boxShadow="0 32px 100px rgba(0,0,0,0.95), 0 0 0 2px rgba(255,63,108,0.4)",document.addEventListener("mousemove",S),document.addEventListener("mouseup",R)}function I(e){if(e.preventDefault(),e.stopPropagation(),!t)return;u=!0,g=e.currentTarget.dataset.resizeDir,h=e.clientX,b=e.clientY,m=t.offsetWidth,f=t.offsetHeight;const n=t.getBoundingClientRect();y=n.left,v=n.top,s.style.pointerEvents="none",document.addEventListener("mousemove",k),document.addEventListener("mouseup",C)}function k(e){if(!u||!t)return;const n=e.clientX-h,a=e.clientY-b,r=g[0]==="n",o=g[1]==="w";let i=o?m-n:m+n,l=r?f-a:f+a;i=Math.min(Math.max(i,280),640),l=Math.min(Math.max(l,320),860),t.style.width=i+"px",t.style.height=l+"px",o&&(t.style.left=y+(m-i)+"px"),r&&(t.style.top=v+(f-l)+"px")}function C(){if(!u)return;u=!1,s.style.pointerEvents="",document.removeEventListener("mousemove",k),document.removeEventListener("mouseup",C);const e=t.getBoundingClientRect();chrome.storage.local.set({[d]:{left:e.left,top:e.top,width:t.offsetWidth,height:t.offsetHeight}})}function S(e){if(!x||!t)return;let n=e.clientX-w,a=e.clientY-E;const r=window.innerWidth-t.offsetWidth,o=window.innerHeight-36;n=Math.max(0,Math.min(n,r)),a=Math.max(0,Math.min(a,o)),t.style.left=n+"px",t.style.top=a+"px"}function R(e){if(!x)return;x=!1,s.style.pointerEvents="",t.style.boxShadow="0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08)";const n=t.getBoundingClientRect();B(n.left,n.top),document.removeEventListener("mousemove",S),document.removeEventListener("mouseup",R)}function j(e){t&&(t.style.height=e?"36px":"560px")}function B(e,n){chrome.storage.local.set({[d]:{x:e,y:n}})}function H(){return window._apexOverlayPos||null}chrome.storage.local.get([d,c],e=>{e[d]&&(window._apexOverlayPos=e[d]),_(),L(),e[c]&&(p=!1,M())}),new MutationObserver(()=>{document.getElementById("apex-toggle-btn")||_()}).observe(document.body,{childList:!0,subtree:!1})})();
