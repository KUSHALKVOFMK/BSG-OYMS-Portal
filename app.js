const CIRCULARS_KEY="kvs_oyms_demo_circulars_v1";
function esc(value){return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));}
function readCirculars(){try{return JSON.parse(localStorage.getItem(CIRCULARS_KEY)||"[]");}catch{return [];}}
function renderPublicCirculars(){
 const root=document.getElementById("publicCircularList");if(!root)return;
 const items=readCirculars().filter(x=>x.status==="Published"&&!x.archived).sort((a,b)=>(b.publishedAt||"").localeCompare(a.publishedAt||""));
 if(!items.length){root.innerHTML='<p class="muted">No circulars have been published yet.</p>';return;}
 root.innerHTML=items.map(x=>'<article class="public-circular"><h3>'+esc(x.title)+'</h3><p><b>'+esc(x.number||"Circular")+'</b> · '+esc(x.date||"")+' · '+esc(x.audience||"All sections")+'</p><p>'+esc(x.summary||"")+'</p>'+(x.fileData?'<a href="'+x.fileData+'" target="_blank" rel="noopener">View attached PDF: '+esc(x.fileName)+'</a>':"")+'</article>').join("");
}
document.addEventListener("DOMContentLoaded",()=>{
 const explore=document.getElementById("explore");if(explore)explore.onclick=()=>document.getElementById("sections")?.scrollIntoView({behavior:"smooth"});
 renderPublicCirculars();
});