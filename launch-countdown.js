(() => {
 "use strict";
 const KEY="kvs_oyms_demo_launch_event_v1";
 const MEDIA_DB="kvs_oyms_announcement_media_v1";
 const seenKey=item=>{const d=new Date(),day=[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");return "kvs_oyms_launch_seen_"+String(item.id||"update")+"_"+day;};
 const wasSeenToday=item=>{try{return localStorage.getItem(seenKey(item))==="1";}catch{return false;}};
 const markSeenToday=item=>{try{localStorage.setItem(seenKey(item),"1");}catch{}};
 let timer=null,popupShownUntil=0,activeId="",confettiFor="";
 const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"null");}catch{return null;}};
 const css=()=>{
  if(document.getElementById("oyms-launch-gate-style"))return;
  const s=document.createElement("style");s.id="oyms-launch-gate-style";
  s.textContent=`
   #oymsLaunchGate{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:18px;overflow:auto;background:radial-gradient(circle at 50% 0%,#55358c,#211037 72%);color:#fff;text-align:center;font-family:Arial,sans-serif}
   #oymsLaunchGate .gate-card{width:min(100%,650px);max-height:94vh;overflow:auto;padding:clamp(20px,4vw,38px) clamp(16px,4vw,28px);border:1px solid #ffffff35;border-radius:24px;background:#ffffff10;box-shadow:0 25px 80px #0008}
   #oymsLaunchGate .gate-kicker{color:#f5d98c;font-size:12px;font-weight:800;letter-spacing:2px}
   #oymsLaunchGate h1{margin:18px 0 10px;color:#fff;font-size:clamp(28px,6vw,44px)}
   #oymsLaunchGate p{margin:0 auto;max-width:520px;color:#eee5fa;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere}
   #oymsLaunchGate .gate-count{margin:24px 0 8px;color:#ffdf8b;font-size:clamp(64px,15vw,104px);font-weight:900;font-variant-numeric:tabular-nums;line-height:1}
   #oymsLaunchGate .gate-label{color:#e9dcf8;font-size:12px;font-weight:800;letter-spacing:3px}
   #oymsLaunchGate .gate-popup{margin-top:18px;padding:18px;border-radius:16px;background:#ffffff15;text-align:left}
   #oymsLaunchGate .gate-popup h2{margin:0 0 10px;color:#ffe29b;font-size:clamp(20px,4vw,28px)}
   #oymsLaunchGate .gate-media{display:grid;place-items:center;width:100%;max-height:42vh;margin:16px auto 0;overflow:hidden}
   #oymsLaunchGate .gate-media img,#oymsLaunchGate .gate-media video{display:block;width:auto;height:auto;max-width:100%;max-height:42vh;object-fit:contain;border-radius:12px;background:#10091b}
   #oymsLaunchGate .gate-progress{height:5px;margin-top:22px;overflow:hidden;border-radius:99px;background:#ffffff25}
   #oymsLaunchGate .gate-progress i{display:block;height:100%;width:100%;transform-origin:left;background:#f5d98c}
   .oyms-launch-confetti{position:fixed!important;display:block!important;z-index:2147483647!important;top:-18px!important;width:10px!important;height:16px!important;border-radius:2px;pointer-events:none;opacity:1!important;animation:oymsLaunchFall 2.8s linear forwards!important}
   @keyframes oymsLaunchFall{to{transform:translateY(var(--fall,85vh)) rotate(720deg);opacity:0}}
   @media(max-width:600px){#oymsLaunchGate .gate-card{padding:22px 16px}#oymsLaunchGate .gate-media{max-height:34vh}#oymsLaunchGate .gate-media img,#oymsLaunchGate .gate-media video{max-height:34vh}}
   @media(prefers-reduced-motion:reduce){#oymsLaunchGate *,.oyms-launch-confetti{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(s);
 };
 const ensure=()=>{let el=document.getElementById("oymsLaunchGate");if(!el){el=document.createElement("div");el.id="oymsLaunchGate";el.setAttribute("role","dialog");el.setAttribute("aria-live","assertive");document.body.appendChild(el);}return el;};
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const close=()=>{document.getElementById("oymsLaunchGate")?.remove();if(timer)clearInterval(timer);timer=null;};
 const confetti=()=>{const colors=["#e7b94d","#7c3aed","#16a34a","#ec4899","#2563eb"];for(let i=0;i<64;i++){const b=document.createElement("i");b.className="oyms-launch-confetti";b.style.left=(Math.random()*100)+"%";b.style.background=colors[i%colors.length];b.style.animationDelay=(Math.random()*.8)+"s";b.style.setProperty("--fall",(65+Math.random()*55)+"vh");document.body.appendChild(b);setTimeout(()=>b.remove(),2800);}};
 const confettiBurst=()=>{const until=Date.now()+5000;const fire=()=>{if(Date.now()>=until){clearInterval(burst);return;}confetti();};fire();const burst=setInterval(fire,650);};
 const websiteCelebration=()=>confettiBurst();
 const loadMedia=async(id,type,root)=>{
  if(!id||!root)return;
  try{
   const db=await new Promise((resolve,reject)=>{const q=indexedDB.open(MEDIA_DB,1);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});
   const blob=await new Promise((resolve,reject)=>{const q=db.transaction("media","readonly").objectStore("media").get(id);q.onsuccess=()=>resolve(q.result||null);q.onerror=()=>reject(q.error);});db.close();
   if(!blob){root.textContent="";return;}
   const url=URL.createObjectURL(blob),isVideo=String(type||blob.type).startsWith("video/");
   const el=document.createElement(isVideo?"video":"img");el.src=url;
   if(isVideo){el.controls=true;el.autoplay=true;el.muted=true;el.playsInline=true;el.preload="auto";el.addEventListener("ended",()=>{popupShownUntil=Math.min(popupShownUntil,Date.now()+500);});}
   else el.alt="SANKALP 2.0 announcement";
   root.replaceChildren(el);
  }catch(_){root.textContent="";}
 };
 const render=()=>{
  const item=read();if(!item||!item.id){close();return;}
  const now=Date.now(),start=Number(item.startedAt||now),countdownEnd=Number(item.countdownEndsAt||start+30000),endAt=Number(item.announcementEndsAt||item.endAt||countdownEnd+120000);
  if(now>=endAt||wasSeenToday(item)){close();return;}
  css();const el=ensure();if(activeId!==item.id){activeId=item.id;popupShownUntil=0;confettiFor="";}
  if(now<countdownEnd){
   const sec=Math.max(0,Math.ceil((countdownEnd-now)/1000));
   el.innerHTML='<section class="gate-card"><span class="gate-kicker">PM SHRI KV OF MEDAK · BSG</span><h1>SANKALP 2.0</h1><p>The portal is getting ready. Please wait for the official update.</p><div class="gate-count">'+String(sec).padStart(2,"0")+'</div><div class="gate-label">SECONDS TO OPEN</div><div class="gate-progress"><i style="transform:scaleX('+Math.max(0,sec/30)+')"></i></div></section>';
   return;
  }
  if(!popupShownUntil){const desired=Number(item.popupDurationMs||10000);popupShownUntil=Math.min(now+Math.max(10000,Math.min(120000,desired)),endAt);}
  if(now>=popupShownUntil){close();markSeenToday(item);if(!item.websiteCelebrationShown){item.websiteCelebrationShown=true;try{localStorage.setItem(KEY,JSON.stringify(item));}catch{}websiteCelebration();}return;}
  if(confettiFor!==item.id){confettiFor=item.id;confettiBurst();}
  const remain=Math.max(0,Math.ceil((popupShownUntil-now)/1000));
  el.innerHTML='<section class="gate-card"><span class="gate-kicker">SANKALP 2.0 · PORTAL UPDATE</span><h1>Website is now open</h1><div class="gate-popup"><h2>'+esc(item.title||"Important Update")+'</h2><p>'+esc(item.description||"A new update is available.")+'</p><div class="gate-media" id="oymsLaunchMedia"></div></div><div class="gate-progress"><i style="transform:scaleX('+Math.max(0,remain/Math.max(1,Math.ceil((popupShownUntil-(item.countdownEndsAt||start+30000))/1000)))+')"></i></div><p style="margin-top:12px;font-size:12px">This announcement will close automatically in '+remain+' seconds.</p></section>';
  if(item.mediaId)loadMedia(item.mediaId,item.mediaType,el.querySelector("#oymsLaunchMedia"));
 };
 const start=()=>{if(timer)clearInterval(timer);activeId="";popupShownUntil=0;confettiFor="";render();timer=setInterval(render,200);};
 window.addEventListener("storage",e=>{if(e.key===KEY)start();});
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();