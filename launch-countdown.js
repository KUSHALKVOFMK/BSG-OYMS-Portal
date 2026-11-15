(() => {
 "use strict";
 const KEY="kvs_oyms_demo_launch_event_v1";
 let timer=null, popupShownUntil=0, activeId="";
 const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"null");}catch{return null;}};
 const css=()=>{
  if(document.getElementById("oyms-launch-gate-style"))return;
  const s=document.createElement("style");s.id="oyms-launch-gate-style";
  s.textContent=`
   #oymsLaunchGate{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:22px;background:radial-gradient(circle at 50% 0%,#55358c,#211037 72%);color:#fff;text-align:center;font-family:Arial,sans-serif}
   #oymsLaunchGate .gate-card{width:min(100%,560px);padding:38px 24px;border:1px solid #ffffff35;border-radius:24px;background:#ffffff10;box-shadow:0 25px 80px #0008}
   #oymsLaunchGate .gate-kicker{color:#f5d98c;font-size:12px;font-weight:800;letter-spacing:2px}
   #oymsLaunchGate h1{margin:18px 0 10px;color:#fff;font-size:clamp(28px,6vw,44px)}
   #oymsLaunchGate p{margin:0 auto;max-width:440px;color:#eee5fa;line-height:1.65;white-space:pre-wrap}
   #oymsLaunchGate .gate-count{margin:24px 0 8px;color:#ffdf8b;font-size:clamp(64px,15vw,104px);font-weight:900;font-variant-numeric:tabular-nums;line-height:1}
   #oymsLaunchGate .gate-label{color:#e9dcf8;font-size:12px;font-weight:800;letter-spacing:3px}
   #oymsLaunchGate .gate-popup{margin-top:22px;padding:18px;border-radius:16px;background:#ffffff15;text-align:left}
   #oymsLaunchGate .gate-popup h2{margin:0 0 10px;color:#ffe29b;font-size:25px}
   #oymsLaunchGate .gate-progress{height:5px;margin-top:24px;overflow:hidden;border-radius:99px;background:#ffffff25}
   #oymsLaunchGate .gate-progress i{display:block;height:100%;width:100%;transform-origin:left;background:#f5d98c}
   @media(prefers-reduced-motion:reduce){#oymsLaunchGate *{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(s);
 };
 const ensure=()=>{
  let el=document.getElementById("oymsLaunchGate");
  if(!el){el=document.createElement("div");el.id="oymsLaunchGate";el.setAttribute("role","dialog");el.setAttribute("aria-live","assertive");document.body.appendChild(el);}
  return el;
 };
 const escapeHtml=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const close=()=>{document.getElementById("oymsLaunchGate")?.remove();if(timer)clearInterval(timer);timer=null;};
 const render=()=>{
  const item=read();
  if(!item||!item.id){close();return;}
  const now=Date.now(),start=Number(item.startedAt||now),countdownEnd=Number(item.countdownEndsAt||start+30000),endAt=Number(item.announcementEndsAt||item.endAt||countdownEnd+120000);
  if(now>=endAt){close();return;}
  css();const el=ensure();
  if(activeId!==item.id){activeId=item.id;popupShownUntil=0;}
  if(now<countdownEnd){
   const sec=Math.max(0,Math.ceil((countdownEnd-now)/1000));
   el.innerHTML='<section class="gate-card"><span class="gate-kicker">PM SHRI KV OF MEDAK · BSG</span><h1>SANKALP 2.0</h1><p>The portal is getting ready. Please wait for the official update.</p><div class="gate-count">'+String(sec).padStart(2,"0")+'</div><div class="gate-label">SECONDS TO OPEN</div><div class="gate-progress"><i style="transform:scaleX('+Math.max(0,sec/30)+')"></i></div></section>';
   return;
  }
  if(!popupShownUntil)popupShownUntil=Math.min(now+10000,endAt);
  if(now>=popupShownUntil){close();return;}
  const remain=Math.max(0,Math.ceil((popupShownUntil-now)/1000));
  el.innerHTML='<section class="gate-card"><span class="gate-kicker">SANKALP 2.0 · PORTAL UPDATE</span><h1>Website is now open</h1><div class="gate-popup"><h2>'+escapeHtml(item.title||"Important Update")+'</h2><p>'+escapeHtml(item.description||"A new update is available.")+'</p></div><div class="gate-progress"><i style="transform:scaleX('+Math.max(0,remain/10)+')"></i></div><p style="margin-top:12px;font-size:12px">This announcement will close automatically in '+remain+' seconds.</p></section>';
 };
 const start=()=>{if(timer)clearInterval(timer);activeId="";popupShownUntil=0;render();timer=setInterval(render,200);};
 window.addEventListener("storage",e=>{if(e.key===KEY)start();});
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();