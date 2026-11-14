const CIRCULARS_KEY="kvs_oyms_demo_circulars_v1";
function esc(value){return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));}
function fileUrl(blob){return blob instanceof Blob?URL.createObjectURL(blob):"";}
async function renderPublicCirculars(){
 const root=document.getElementById("publicCircularList");if(!root)return;
 try{
  await PortalStorage.init();
  const items=(await PortalStorage.allCirculars()).filter(x=>x.status==="Published"&&!x.archived).sort((a,b)=>(b.publishedAt||"").localeCompare(a.publishedAt||""));
  if(!items.length){root.innerHTML='<p class="muted">No circulars have been published yet.</p>';return;}
  root.innerHTML=items.map(x=>'<article class="public-circular"><h3>'+esc(x.title)+'</h3><p><b>'+esc(x.number||"Circular")+'</b> · '+esc(x.date||"")+' · '+esc(x.audience||"All sections")+'</p><p>'+esc(x.summary||"")+'</p>'+(x.fileBlob?'<a href="'+fileUrl(x.fileBlob)+'" target="_blank" rel="noopener">View attached PDF: '+esc(x.fileName||"Circular PDF")+'</a>':"")+'</article>').join("");
 }catch(error){root.innerHTML='<p class="muted">Circular storage is not available in this browser.</p>';console.error(error);}
}
document.addEventListener("DOMContentLoaded",async()=>{
 const explore=document.getElementById("explore");if(explore)explore.onclick=()=>document.getElementById("sections")?.scrollIntoView({behavior:"smooth"});
 const contactLogin=document.getElementById("contactLogin");if(contactLogin)contactLogin.onclick=()=>window.location.href="login.html";
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