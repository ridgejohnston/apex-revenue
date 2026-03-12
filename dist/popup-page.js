
let liveData = null;
let settings = { autoOpen: true, opacity: 90, whaleAlert: true, prompts: true, whaleThreshold: 50, aiPrice: true };
let currentPage = 'live';
let currentFilter = 'all';
let isOnPlatform = false;
let peakViewers = 0;

const PLATFORMS = { 'chaturbate.com': 'Chaturbate', 'stripchat.com': 'Stripchat', 'myfreecams.com': 'MyFreeCams', 'xtease.com': 'XTease' };

function escHtml(str) { return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function setEl(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pageEl = document.getElementById('page-' + pageId);
  if (pageEl) pageEl.classList.add('active');
  const navEl = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (navEl) navEl.classList.add('active');
  currentPage = pageId;
  if (pageId === 'analytics') renderAnalytics();
  if (pageId === 'fans') renderFans();
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const page = item.getAttribute('data-page');
    if (!isOnPlatform && page !== 'settings' && page !== 'help') {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById('page-offplatform').classList.add('active');
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
    } else { showPage(page); }
  });
});

function detectPlatform(url) {
  for (const [domain, name] of Object.entries(PLATFORMS)) { if (url && url.includes(domain)) return name; }
  return null;
}

function initPlatformDetection() {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const url = (tabs[0] && tabs[0].url) || '';
      const platform = detectPlatform(url);
      if (platform) {
        isOnPlatform = true;
        const badge = document.getElementById('live-badge');
        badge.className = 'live-badge is-live';
        document.getElementById('live-badge-text').textContent = platform.toUpperCase();
        document.getElementById('settings-platform-dot').className = 'platform-dot active';
        document.getElementById('settings-platform-name').textContent = platform;
        document.getElementById('settings-platform-sub').textContent = 'Apex Revenue is active on this tab';
        loadLiveData();
        showPage('live');
      } else { showPage('offplatform'); }
    });
  } else {
    // Dev preview
    isOnPlatform = true;
    showPage('live');
  }
}

function loadLiveData() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['apexLiveData', 'apexSettings'], result => {
      if (result.apexSettings) { settings = { ...settings, ...result.apexSettings }; applySettings(); }
      if (result.apexLiveData) { liveData = result.apexLiveData; renderLive(); }
    });
    chrome.storage.onChanged.addListener(changes => {
      if (changes.apexLiveData) {
        liveData = changes.apexLiveData.newValue;
        if (currentPage === 'live') renderLive();
        if (currentPage === 'analytics') renderAnalytics();
        if (currentPage === 'fans') renderFans();
      }
    });
  }
}

function renderLive() {
  if (!liveData) return;
  const { viewers = 0, tokensPerHour = 0, convRate = 0, fans = [], tipEvents = [] } = liveData;
  if (viewers > peakViewers) peakViewers = viewers;
  setEl('stat-tokens', tokensPerHour > 0 ? `$${tokensPerHour}<span>/hr</span>` : `—<span></span>`);
  setEl('stat-viewers', viewers > 999 ? `${(viewers/1000).toFixed(1)}<span>k</span>` : `${viewers || '—'}<span></span>`);
  setEl('stat-conv', `${convRate || '—'}<span>%</span>`);
  const whaleList = fans.filter(f => f.tips >= settings.whaleThreshold).slice(0, 8);
  renderWhales(whaleList);
  renderHeatBars(tipEvents);
  renderPriceRecommendation(tokensPerHour);
  updateAlertBanner(whaleList, tokensPerHour);
}

function renderWhales(whaleList) {
  const rowsEl = document.getElementById('whale-rows');
  const footerEl = document.getElementById('whale-footer');
  const inRoom = whaleList.filter(w => w.present);
  document.getElementById('whale-count-label').textContent = `${inRoom.length} in room`;
  if (whaleList.length === 0) {
    rowsEl.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🐋</div><div class="empty-state-text">No high-value tippers yet this session</div></div>`;
    footerEl.style.display = 'none'; return;
  }
  const totalWhale = whaleList.reduce((s, w) => s + w.tips, 0);
  document.getElementById('whale-total').textContent = `$${totalWhale}`;
  footerEl.style.display = 'flex';
  rowsEl.innerHTML = whaleList.map((w, i) => {
    const tier = w.tier <= 1 ? 1 : w.tier <= 2 ? 2 : w.tier <= 3 ? 3 : 4;
    const emoji = tier === 1 ? '🐋' : tier === 2 ? '💎' : '🔥';
    const tierLabel = tier === 1 ? 'Gold' : tier === 2 ? 'Silver' : 'Bronze';
    return `<div class="whale-row ${w.present ? '' : 'left'}">
      <div class="whale-identity">
        <div class="whale-avatar tier-${tier}">${emoji}<div class="whale-status-dot ${w.present ? 'online' : 'offline'}"></div></div>
        <div><div class="whale-name">${escHtml(w.username)}</div><div class="whale-rank">#${i+1} tipper · ${tierLabel}</div></div>
      </div>
      <div class="whale-tips">$${w.tips}</div>
      <div class="whale-count joins"><span class="whale-count-val">${w.joins||0}</span></div>
      <div class="whale-count leaves"><span class="whale-count-val">${w.leaves||0}</span></div>
    </div>`;
  }).join('');
}

function renderHeatBars(tipEvents) {
  const barsEl = document.getElementById('heat-bars');
  const timeEl = document.getElementById('heat-time');
  const now = Date.now(); const bucketMs = 15*60*1000; const n = 12;
  const buckets = Array(n).fill(0);
  tipEvents.forEach(ev => { const idx = n-1-Math.floor((now-ev.timestamp)/bucketMs); if(idx>=0&&idx<n) buckets[idx]+=ev.amount; });
  const max = Math.max(...buckets, 1);
  barsEl.innerHTML = buckets.map((val, i) => {
    const pct = Math.max(5, Math.round((val/max)*100));
    const isCur = i===n-1;
    const bg = isCur ? `background:linear-gradient(to top,rgba(255,63,108,0.6),var(--accent));box-shadow:0 0 8px var(--glow)` : val>0 ? `background:linear-gradient(to top,rgba(155,124,255,0.3),rgba(255,63,108,0.5))` : `background:var(--surface2)`;
    return `<div class="heat-bar" style="height:${pct}%;${bg}" title="$${val}"></div>`;
  }).join('');
  const labels = [];
  for (let i=0;i<5;i++) { const idx=Math.round(i*(n-1)/4); const t=new Date(now-(n-1-idx)*bucketMs); labels.push(i===4?'Now':`${t.getHours()}:${String(t.getMinutes()).padStart(2,'0')}`); }
  timeEl.innerHTML = labels.map(l=>`<span${l==='Now'?' style="color:var(--gold)"':''}>${l}</span>`).join('');
}

function renderPriceRecommendation(tokensPerHour) {
  if (tokensPerHour === 0) { setEl('price-current','—'); setEl('price-recommended','—'); setEl('price-max','—'); setEl('ai-insight-text','Analyzing session data to build your price recommendation…'); return; }
  const current=8, demand=tokensPerHour/100, rec=Math.round(current*(1+demand*0.4)), max=Math.round(rec*1.5);
  setEl('price-current',`$${current}`); setEl('price-recommended',`$${rec}`); setEl('price-max',`$${max}`);
  setEl('ai-insight-text', demand>2 ? `Demand is very high — you could push to $${rec} right now.` : demand>1 ? `Session is performing well. $${rec} is a safe increase.` : `Activity is moderate. Test $${rec} with a small announcement.`);
}

function updateAlertBanner(whaleList, tokensPerHour) {
  const banner = document.getElementById('alert-banner');
  const inRoom = whaleList.filter(w => w.present);
  if (inRoom.length >= 2 && tokensPerHour > 50) {
    document.getElementById('alert-icon').textContent='🔥'; document.getElementById('alert-label').textContent='High Tip Moment';
    document.getElementById('alert-text').textContent=`${inRoom.length} whales in chat — launch a goal now`; banner.classList.remove('hidden');
  } else if (inRoom.length >= 1) {
    document.getElementById('alert-icon').textContent='🐋'; document.getElementById('alert-label').textContent='Whale Alert';
    document.getElementById('alert-text').textContent=`${inRoom[0].username} is in the room — engage them`; banner.classList.remove('hidden');
  } else { banner.classList.add('hidden'); }
}

function renderAnalytics() {
  if (!liveData) return;
  const { totalTips=0, viewers=0, fans=[], tipEvents=[], startTime } = liveData;
  setEl('an-total',`<span>$</span>${totalTips}`);
  setEl('an-peak-viewers', Math.max(peakViewers, viewers));
  setEl('an-tippers', fans.filter(f=>f.tips>0).length);
  setEl('an-tip-events', tipEvents.length);
  const elapsed = startTime ? Math.round((Date.now()-startTime)/60000) : 0;
  setEl('analytics-session-time', elapsed<1?'Just started':`${elapsed}m into session`);
  const now=Date.now(), numB=12, bucketMs=15*60*1000;
  const buckets=Array(numB).fill(0);
  tipEvents.forEach(ev=>{ const idx=Math.min(numB-1,Math.floor((ev.timestamp-(startTime||now))/bucketMs)); if(idx>=0) buckets[idx]+=ev.amount; });
  const maxB=Math.max(...buckets,1);
  document.getElementById('tl-bars').innerHTML=buckets.map(v=>`<div class="tl-bar ${v>0?'has-tips':''}" style="height:${Math.max(3,Math.round((v/maxB)*100))}%" title="$${v}"></div>`).join('');
  const st=new Date(startTime||now);
  document.getElementById('tl-labels').innerHTML=`<span>${st.getHours()}:${String(st.getMinutes()).padStart(2,'0')}</span><span>Now</span>`;
  if (tipEvents.length>0) {
    const top=tipEvents.reduce((a,b)=>a.amount>b.amount?a:b);
    const t=new Date(top.timestamp);
    document.getElementById('top-moment-section').style.display='block';
    setEl('moment-title',`$${top.amount} tip by ${escHtml(top.username)}`);
    setEl('moment-detail',`Largest single tip at ${t.getHours()}:${String(t.getMinutes()).padStart(2,'0')} — announce goals right after big tips.`);
  }
}

function renderFans() {
  if (!liveData) return;
  const { fans=[], totalTips=0 } = liveData;
  setEl('fans-total',`$${totalTips}`);
  let filtered = fans.filter(f=>f.tips>0);
  if (currentFilter==='inroom') filtered=filtered.filter(f=>f.present);
  else if (currentFilter==='tippers') filtered=filtered.filter(f=>f.tips>=settings.whaleThreshold);
  else if (currentFilter==='new') filtered=filtered.filter(f=>f.joins===1&&f.tips>0);
  const rowsEl=document.getElementById('fans-rows');
  if (!filtered.length) { rowsEl.innerHTML=`<div class="empty-state"><div class="empty-state-icon">💜</div><div class="empty-state-text">No tippers match this filter</div></div>`; return; }
  rowsEl.innerHTML=filtered.map((fan,i)=>{
    const rank=i+1, rankClass=rank===1?'gold-rank':rank===2?'silver-rank':rank===3?'bronze-rank':'';
    const tier=fan.tier<=1?1:fan.tier<=2?2:fan.tier<=3?3:4;
    const init=fan.username?fan.username[0].toUpperCase():'?';
    const badges=[];
    if(fan.tips>=settings.whaleThreshold) badges.push(`<span class="badge badge-whale">🐋 Whale</span>`);
    if(tier===1) badges.push(`<span class="badge badge-gold">🥇 Gold</span>`);
    else if(tier===2) badges.push(`<span class="badge badge-silver">🥈 Silver</span>`);
    else if(tier===3) badges.push(`<span class="badge badge-bronze">🥉 Bronze</span>`);
    if(fan.joins>3) badges.push(`<span class="badge badge-loyal">🔁 Loyal</span>`);
    if(fan.joins===1&&fan.tips>0) badges.push(`<span class="badge badge-new">✨ New</span>`);
    if(!fan.present) badges.push(`<span class="badge badge-left">↩ Left</span>`);
    return `<div class="fan-row ${fan.present?'':'offline'}">
      <div><span class="rank-num ${rankClass}">${rank}</span></div>
      <div class="fan-identity">
        <div class="fan-avatar tier-${tier}">${init}<div class="fan-presence-dot ${fan.present?'online':'offline'}"></div></div>
        <div class="fan-info"><div class="fan-name">${escHtml(fan.username)}</div><div class="fan-badges">${badges.slice(0,3).join('')}</div></div>
      </div>
      <div class="fan-tip-amt ${fan.tips>=settings.whaleThreshold?'top':'mid'}">$${fan.tips}</div>
      <div><span class="cnt-val in">${fan.joins||0}</span></div>
      <div><span class="cnt-val out">${fan.leaves||0}</span></div>
    </div>`;
  }).join('');
}

function applySettings() {
  const set=(id,val)=>{const el=document.getElementById(id);if(el)el[typeof val==='boolean'?'checked':'value']=val;};
  set('setting-auto-open',settings.autoOpen); set('setting-opacity',settings.opacity);
  set('setting-whale-alert',settings.whaleAlert); set('setting-prompts',settings.prompts);
  set('setting-whale-threshold',settings.whaleThreshold); set('setting-ai-price',settings.aiPrice);
  setEl('opacity-val',settings.opacity+'%'); setEl('whale-threshold-val','$'+settings.whaleThreshold);
}

function saveSettings() {
  if (typeof chrome!=='undefined'&&chrome.storage) chrome.storage.local.set({apexSettings:settings});
}

function initSettings() {
  document.getElementById('setting-auto-open').addEventListener('change',e=>{settings.autoOpen=e.target.checked;saveSettings();});
  document.getElementById('setting-opacity').addEventListener('input',e=>{settings.opacity=+e.target.value;setEl('opacity-val',settings.opacity+'%');saveSettings();});
  document.getElementById('setting-whale-alert').addEventListener('change',e=>{settings.whaleAlert=e.target.checked;saveSettings();});
  document.getElementById('setting-prompts').addEventListener('change',e=>{settings.prompts=e.target.checked;saveSettings();});
  document.getElementById('setting-whale-threshold').addEventListener('input',e=>{settings.whaleThreshold=+e.target.value;setEl('whale-threshold-val','$'+settings.whaleThreshold);saveSettings();if(liveData)renderLive();});
  document.getElementById('setting-ai-price').addEventListener('change',e=>{settings.aiPrice=e.target.checked;saveSettings();});
  document.getElementById('settings-reset').addEventListener('click',()=>{
    if(typeof chrome!=='undefined'&&chrome.storage){chrome.storage.local.remove(['apexLiveData'],()=>{liveData=null;const btn=document.getElementById('settings-reset');btn.textContent='✓ Session data cleared';btn.style.color='var(--green)';setTimeout(()=>{btn.textContent='Reset session data';btn.style.color='';},2500);});}
  });
}

document.getElementById('alert-cta').addEventListener('click',function(){this.textContent='✓ Done';this.classList.add('done');setTimeout(()=>{this.textContent='Act Now';this.classList.remove('done');},2500);});

document.querySelectorAll('.fan-chip[data-filter]').forEach(chip=>{
  chip.addEventListener('click',()=>{document.querySelectorAll('.fan-chip[data-filter]').forEach(c=>c.classList.remove('active'));chip.classList.add('active');currentFilter=chip.getAttribute('data-filter');renderFans();});
});

document.querySelectorAll('.feature-chip[data-cat]').forEach(chip=>{
  chip.addEventListener('click',()=>{document.querySelectorAll('.feature-chip[data-cat]').forEach(c=>c.classList.remove('active'));chip.classList.add('active');});
});

document.getElementById('featureSubmit').addEventListener('click',async function(){
  const text=document.getElementById('featureText').value.trim();
  const cat=document.querySelector('.feature-chip.active[data-cat]');
  const category=cat?cat.textContent.trim():'Other';
  if(!text){const ta=document.getElementById('featureText');ta.style.borderColor='rgba(255,63,108,0.6)';ta.placeholder='Please describe your idea first…';setTimeout(()=>{ta.style.borderColor='';},2000);return;}
  this.textContent='Sending…';this.disabled=true;
  try{
    if(typeof emailjs!=='undefined'){await emailjs.send('service_fhx1u18','template_gn0f3ul',{feature_text:text,category,submitted_at:new Date().toLocaleString(),to_email:'support@apexrevenue.works'});}
    document.getElementById('featureText').value='';this.style.display='none';
    document.getElementById('featureSuccess').style.display='flex';document.getElementById('featureError').style.display='none';
    setTimeout(()=>{this.style.display='';this.textContent='Submit Idea';this.disabled=false;document.getElementById('featureSuccess').style.display='none';},4000);
  }catch(e){this.textContent='Submit Idea';this.disabled=false;document.getElementById('featureError').style.display='flex';setTimeout(()=>{document.getElementById('featureError').style.display='none';},4000);}
});

document.addEventListener('DOMContentLoaded',()=>{initSettings();initPlatformDetection();});
