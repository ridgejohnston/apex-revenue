console.log("popout.js executing");(function(){const c="apex_overlay_pos",u="apex_overlay_open";let s=null,t=null,d=!1,f=!1,p=!1,h="",v=0,y=0,x=0,g=0,t=0,b=0,w=0,L=0;function H(){if(document.getElementById("apex-toggle-btn"))return;const e=document.createElement("div");e.id="apex-toggle-btn",e.title="Apex Revenue",e.innerHTML="⚡",e.style.cssText=`
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
    `,e.addEventListener("mouseenter",()=>{e.style.transform="scale(1.1)",e.style.boxShadow="0 6px 28px rgba(255,63,108,0.7)"}),e.addEventListener("mouseleave",()=>{e.style.transform="",e.style.boxShadow="0 4px 20px rgba(255,63,108,0.5)"}),e.addEventListener("click",R),document.body.appendChild(e)}function _(){if(document.getElementById("apex-overlay-wrapper"))return;const e=C(),n=e?e.x:Math.max(0,window.innerWidth-400-32),i=e?e.y:Math.max(0,window.innerHeight-560-90);t=document.createElement("div"),t.id="apex-overlay-wrapper",t.style.cssText=`
      position: fixed;
      left: ${n}px;
      top: ${i}px;
      width: 400px;
      height: 560px;
      z-index: 2147483645;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08);
      transition: box-shadow 0.2s;
      display: none;
    `,s=document.createElement("iframe"),s.id="apex-overlay-iframe",s.src=chrome.runtime.getURL("overlay.html"),s.style.cssText=`
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 14px;
      display: block;
    `,s.setAttribute("allowtransparency","true"),t.appendChild(s),["nw","ne","sw","se"].forEach(a=>{const o=document.createElement("div");o.dataset.resizeDir=a;const r=a[0]==="n",m=a[1]==="w";o.style.cssText=`
        position:absolute;
        width:14px; height:14px;
        ${r?"top:-4px":"bottom:-4px"};
        ${m?"left:-4px":"right:-4px"};
        cursor:${a}-resize;
        z-index:10001;
        border-radius:${r&&m?"4px 0 0 0":r&&!m?"0 4px 0 0":!r&&m?"0 0 0 4px":"0 0 4px 0"};
        background:rgba(255,63,108,0.0);
        transition: background 0.15s;
      `,o.addEventListener("mouseenter",()=>{o.style.background="rgba(255,63,108,0.35)"}),o.addEventListener("mouseleave",()=>{p||(o.style.background="rgba(255,63,108,0)")}),o.addEventListener("mousedown",W),t.appendChild(o)}),document.body.appendChild(t),window.addEventListener("message",S)}function R(){t||_(),d=!d,t.style.display=d?"block":"none",chrome.storage.local.set({[u]:d})}function I(){d=!1,t&&(t.style.display="none"),chrome.storage.local.set({[u]:!1})}function S(e){if(!(!e.data||e.data.source!=="apex-overlay"))switch(e.data.type){case"CLOSE":I();break;case"DRAG_START":z(e.data.mouseX,e.data.mouseY);break;case"MINIMISE":Y(e.data.minimised);break;case"SET_OPACITY":t&&(t.style.opacity=e.data.value);break}}window.addEventListener("message",function(e){!e.data||e.data.source!=="apex-content"||s&&s.contentWindow&&s.contentWindow.postMessage(e.data,"*")});function z(e,n){if(!t)return;p=!0;const i=s.getBoundingClientRect(),l=e+i.left,a=n+i.top,o=t.getBoundingClientRect();w=l-o.left,L=a-o.top,s.style.pointerEvents="none",t.style.transition="none",t.style.boxShadow="0 32px 100px rgba(0,0,0,0.95), 0 0 0 2px rgba(255,63,108,0.4)",document.addEventListener("mousemove",O),document.addEventListener("mouseup",A)}function W(e){if(e.preventDefault(),e.stopPropagation(),!t)return;p=!0,h=e.currentTarget.dataset.resizeDir,v=e.clientX,y=e.clientY,x=t.offsetWidth,g=t.offsetHeight;const n=t.getBoundingClientRect();E=n.left,b=n.top,s.style.pointerEvents="none",document.addEventListener("mousemove",M),document.addEventListener("mouseup",T)}function M(e){if(!p||!t)return; const n=e.clientX-v,i=e.clientY-y,l=h[0]==="n",a=h[1]==="w";let o=a?x-n:x+n,r=l?g-i:g+i;o=Math.min(Math.max(o,�280),640),r=Math.min(Math.max(r,320),860),t.style.width=o+"px",t.style.height=r+"px",a&&(t.style.left=E+(x+o)+"px"),l&&(t.style.top=b+(g-r)+"px")}function T(){if(!p)return;p=!1,s.style.pointerEvents="",document.removeEventListener("mousemove",M),document.removeEventListener("mouseup",T);const e=t.getBoundingClientRect();chrome.storage.local.set({[c]:{\nleft:e.left,top:e.top,width:t.offsetWidth,height:t.offsetHeight}})}function O(e){if(!f||!t)return;let n=e.clientX-w,i=e.clientY-L;const l=window.innerWidth-t.offsetWidth,a=window.innerHeight-36;n=Math.max(0,Math.min(n,l)),i=Math.max(0,Math.min(i,a)),t.style.left=n+"px",t.style.top=i+"px"}function A(e){if(!f)return;f=!1,s.style.pointerEvents="",t.style.boxShadow="0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08)";const n=t.getBoundingClientRect();D(n.left,n.top),document.removeEventListener("mousemove",O),document.removeEventListener("mouseup",A)}function Y(e){t&&(t.style.height=e?"36px":"560px")}function D(e,n){chrome.storage.local.set({[c]:{x:e,y:n}})}function C(){return window._apexOverlayPos||null}chrome.storage.local.get([c,u],e=>{eÛc]&&(window._apexOverlayPos=e[c]),H;(),_(),e[u]&&(d=!1,R())}),new MutationObserver(()=>{document.getElementById("apex-toggle-btn")||H()}).observe(document.body,{childList:!0,subtree:!1})})();
