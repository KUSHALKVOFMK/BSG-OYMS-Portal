const CIRCULARS_KEY="kvs_oyms_demo_circulars_v1";
function esc(value){return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));}
function fileUrl(blob){return blob instanceof Blob?URL.createObjectURL(blob):"";}
async function renderPublicCirculars(){
 const root=document.getElementById("publicCircularList");if(!root)return;
 try{
  await PortalStorage.init();
  const items=(await PortalStorage.allCirculars()).filter(x=>x.status==="Published"&&!x.archived).sort((a,b)=>(b.publishedAt||"").localeCompare(a.publishedAt||""));
  const localHtml=items.map(x=>'<article class="public-circular"><div class="circular-source-tag">SCHOOL / UNIT NOTICE</div><h3>'+esc(x.title)+'</h3><p><b>'+esc(x.number||"Circular")+'</b> · '+esc(x.date||"")+' · '+esc(x.audience||"All sections")+'</p><p>'+esc(x.summary||"")+'</p>'+(x.fileBlob?'<a href="'+fileUrl(x.fileBlob)+'" target="_blank" rel="noopener">View attached PDF: '+esc(x.fileName||"Circular PDF")+'</a>':"")+'</article>').join("");
  root.innerHTML=localHtml||'<p class="muted">No school or unit circulars have been published yet.</p>';
 }catch(error){root.innerHTML='<p class="muted">School circular storage is not available in this browser.</p>';console.error(error);}
}
document.addEventListener("DOMContentLoaded",async()=>{
 const explore=document.getElementById("explore");if(explore)explore.onclick=()=>document.getElementById("sections")?.scrollIntoView({behavior:"smooth"});
 const contactLogin=document.getElementById("contactLogin");if(contactLogin)contactLogin.onclick=()=>window.location.href="login.html";
 initSidebarNavigation();
 await PortalStorage.init();
 renderPublicCirculars();
 renderPublicGallery();
 initHeroSlideshow();
});
async function renderPublicGallery(){
 const root=document.getElementById("publicGallery");if(!root)return;
 try{
  const items=(await PortalStorage.allPhotos()).filter(x=>x.status==="Published"&&!x.archived).sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||""));
  if(!items.length){root.innerHTML='<p class="muted">No photographs have been published yet.</p>';return;}
  root.innerHTML=items.map(x=>'<figure class="gallery-card"><img src="'+fileUrl(x.imageBlob)+'" alt="'+esc(x.title||"School Scout and Guide activity")+'"><figcaption><b>'+esc(x.title||"Activity photograph")+'</b>'+(x.caption?'<span>'+esc(x.caption)+'</span>':"")+'</figcaption></figure>').join("");
 }catch(error){root.innerHTML='<p class="muted">Gallery storage is not available in this browser.</p>';console.error(error);}
}
function initHeroSlideshow(){
 const slides=[...document.querySelectorAll(".hero-slide")];
 const dots=[...document.querySelectorAll(".slide-dots button")];
 if(slides.length<2)return;
 let current=0,timer;
 const show=n=>{current=(n+slides.length)%slides.length;slides.forEach((slide,i)=>slide.classList.toggle("active",i===current));dots.forEach((dot,i)=>dot.classList.toggle("active",i===current));};
 const restart=()=>{clearInterval(timer);timer=window.setInterval(()=>show(current+1),7000);};
 document.querySelector(".slide-arrow.previous")?.addEventListener("click",()=>{show(current-1);restart();});
 document.querySelector(".slide-arrow.next")?.addEventListener("click",()=>{show(current+1);restart();});
 dots.forEach((dot,i)=>dot.addEventListener("click",()=>{show(i);restart();}));
 restart();
}

function initActivityCalendar(){
 const daysRoot=document.getElementById("activityCalendarDays");
 const eventsRoot=document.getElementById("activityCalendarEvents");
 if(!daysRoot||!eventsRoot)return;
 const storeKey="kvs_oyms_demo_events_v1";
 const today=new Date();
 let month=new Date(today.getFullYear(),today.getMonth(),1);
 let selectedDate="";
 const pad=n=>String(n).padStart(2,"0");
 const dateKey=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
 const escHtml=v=>String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
 const readEvents=()=>{try{const rows=JSON.parse(localStorage.getItem(storeKey)||"[]");return Array.isArray(rows)?rows.filter(x=>x&&x.status==="Published"&&!x.archived&&/^\\d{4}-\\d{2}-\\d{2}$/.test(x.date||"")):[];}catch{return[];}};
 const render=()=>{
  const year=month.getFullYear(),m=month.getMonth(),first=new Date(year,m,1),last=new Date(year,m+1,0),events=readEvents();
  const byDate={};events.forEach(e=>(byDate[e.date]??=[]).push(e));
  document.getElementById("calendarMonthLabel").textContent=month.toLocaleDateString("en-IN",{month:"long",year:"numeric"});
  document.getElementById("calendarEventsHeading").textContent=selectedDate?"Events on "+new Date(year,m,Number(selectedDate.slice(-2))).toLocaleDateString("en-IN",{day:"numeric",month:"short"}):"Events this month";
  const offset=first.getDay(),cells=Math.ceil((offset+last.getDate())/7)*7;
  let markup="";
  for(let i=0;i<cells;i++){
   const day=i-offset+1;
   if(day<1||day>last.getDate()){markup+='<span class="calendar-day empty" aria-hidden="true"></span>';continue;}
   const d=new Date(year,m,day),key=dateKey(d),has=(byDate[key]||[]).length>0,isToday=key===dateKey(today),isSelected=key===selectedDate;
   markup+='<button type="button" class="calendar-day'+(has?' has-event':'')+(isToday?' is-today':'')+(isSelected?' is-selected':'')+'" data-calendar-date="'+key+'" aria-label="'+d.toLocaleDateString("en-IN",{dateStyle:"full"})+(has?', '+byDate[key].length+' published event(s)':'')+'"><span>'+day+'</span>'+(has?'<i class="calendar-event-mark"></i>':"")+'</button>';
  }
  daysRoot.innerHTML=markup;
  daysRoot.querySelectorAll("[data-calendar-date]").forEach(b=>b.addEventListener("click",()=>{selectedDate=selectedDate===b.dataset.calendarDate?"":b.dataset.calendarDate;render();}));
  const inMonth=events.filter(e=>{const d=new Date(e.date+"T00:00:00");return d.getFullYear()===year&&d.getMonth()===m;}).sort((a,b)=>a.date.localeCompare(b.date));
  const shown=selectedDate?inMonth.filter(e=>e.date===selectedDate):inMonth;
  eventsRoot.innerHTML=shown.length?shown.map(e=>'<article class="calendar-event-item"><time datetime="'+escHtml(e.date)+'"><b>'+new Date(e.date+"T00:00:00").getDate()+'</b><span>'+new Date(e.date+"T00:00:00").toLocaleDateString("en-IN",{month:"short"})+'</span></time><div><strong>'+escHtml(e.title)+'</strong><small>'+escHtml(e.section||"All Sections")+(e.venue?" · "+escHtml(e.venue):"")+'</small>'+(e.description?'<p>'+escHtml(e.description)+'</p>':"")+'</div></article>').join(""):'<div class="calendar-empty"><span>✦</span><b>'+(selectedDate?"No published event on this date":"No published events this month")+'</b><p>School and unit events approved for publication will appear here.</p></div>';
 };
 document.getElementById("calendarPrev")?.addEventListener("click",()=>{month=new Date(month.getFullYear(),month.getMonth()-1,1);selectedDate="";render();});
 document.getElementById("calendarNext")?.addEventListener("click",()=>{month=new Date(month.getFullYear(),month.getMonth()+1,1);selectedDate="";render();});
 window.addEventListener("storage",e=>{if(e.key===storeKey)render();});
 render();
}

function initSidebarNavigation(){
 const sidebar=document.getElementById("portalSidebar"),toggle=document.getElementById("menuToggle"),backdrop=document.getElementById("sidebarBackdrop"),close=document.getElementById("sidebarClose");
 if(!sidebar||!toggle||!backdrop)return;
 const setOpen=open=>{
  sidebar.classList.toggle("open",open);
  backdrop.classList.toggle("open",open);
  document.body.classList.toggle("sidebar-open",open);
  toggle.setAttribute("aria-expanded",String(open));
 };
 toggle.addEventListener("click",()=>setOpen(!sidebar.classList.contains("open")));
 close?.addEventListener("click",()=>setOpen(false));
 backdrop.addEventListener("click",()=>setOpen(false));
 sidebar.querySelectorAll("a").forEach(link=>link.addEventListener("click",()=>setOpen(false)));
 document.addEventListener("keydown",event=>{if(event.key==="Escape")setOpen(false);});
}
