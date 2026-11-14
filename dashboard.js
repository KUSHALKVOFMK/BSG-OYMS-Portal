const SESSION_KEY="kvs_oyms_demo_session";
const CIRCULARS_KEY="kvs_oyms_demo_circulars_v1";
const GALLERY_KEY="kvs_oyms_demo_gallery_v1";
let session=null;
try{session=JSON.parse(sessionStorage.getItem(SESSION_KEY)||"null");}catch{}
if(!session||!session.demo){window.location.replace("login.html");}
const role=session?.role||"Member";
const isSuper=role==="Super Administrator";
const canReview=role==="Administrator"||isSuper;
const main=document.getElementById("dashMain");
const nav=document.getElementById("dashNav");
document.getElementById("signedInAs").textContent=(session?.name||role)+" · Demo preview";
document.getElementById("logout").addEventListener("click",()=>{sessionStorage.removeItem(SESSION_KEY);window.location.href="login.html";});
const items=[["overview","Dashboard"],["profile","My Profile"],["circulars","Circulars"]];
if(isSuper)items.push(["manage","Manage Circulars"]);
items.push(["gallery","Photo Gallery"]);
if(canReview)items.push(["reviewGallery","Verify Photo Uploads"]);
items.forEach(([id,label])=>{const b=document.createElement("button");b.textContent=label;b.dataset.view=id;b.addEventListener("click",()=>showView(id));nav.appendChild(b);});
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function read(){try{return JSON.parse(localStorage.getItem(CIRCULARS_KEY)||"[]");}catch{return [];}}
function save(list){localStorage.setItem(CIRCULARS_KEY,JSON.stringify(list));}
function showView(view){
 document.querySelectorAll("#dashNav button").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
 if(view==="profile")return profile();
 if(view==="circulars")return circulars();
 if(view==="manage"&&isSuper)return manageCirculars();
 if(view==="gallery")return manageGallery();
 if(view==="reviewGallery"&&canReview)return reviewGallery();
 overview();
}
function overview(){
 const list=read();const published=list.filter(x=>x.status==="Published"&&!x.archived).length;
 main.innerHTML="<h1>"+esc(role)+" Dashboard</h1><p>Welcome to the KVS-OYMS 2.0 role-based preview.</p><div class=\"dash-alert\"><b>Preview mode:</b> This dashboard is not connected to a live database. Demo circulars are saved only in this browser and are not emailed or pushed to other users.</div><div class=\"dash-stat-grid\"><div class=\"dash-stat\"><strong>"+list.length+"</strong><span>Demo circular records</span></div><div class=\"dash-stat\"><strong>"+published+"</strong><span>Published in this browser</span></div><div class=\"dash-stat\"><strong>"+(isSuper?"Full preview":"Read only")+"</strong><span>Current access level</span></div></div><h2>Quick access</h2><p>"+(isSuper?"Use Manage Circulars to prepare and publish a circular in this local preview.":"Open Circulars to read notices made available in this browser preview.")+"</p>"+(isSuper?'<button class="dash-primary" id="goManage">Create / Manage Circulars</button>':"");
 const go=document.getElementById("goManage");if(go)go.addEventListener("click",()=>showView("manage"));
}
function profile(){
 main.innerHTML="<h1>My Profile</h1><p>Signed in as "+esc(session?.name)+".</p><div class=\"dash-form-grid\"><div class=\"dash-field\"><label>Role</label><input value=\""+esc(role)+"\" disabled></div><div class=\"dash-field\"><label>Preview Login ID</label><input value=\""+esc(session?.loginId)+"\" disabled></div><div class=\"dash-field full\"><label>School</label><input value=\"PM SHRI Kendriya Vidyalaya Ordnance Factory Medak\" disabled></div></div><div class=\"dash-alert\">Profile editing and account settings will be enabled after secure authentication and database setup.</div>";
}
function circulars(){
 const list=read().filter(x=>x.status==="Published"&&!x.archived).sort((a,b)=>(b.publishedAt||"").localeCompare(a.publishedAt||""));
 if(!list.length){main.innerHTML="<h1>Official Circulars</h1><div class=\"dash-empty\">No published circulars yet.</div>";return;}
 main.innerHTML="<h1>Official Circulars</h1><p>Published circulars available in this browser preview.</p>"+list.map(x=>'<article class="public-circular"><h3>'+esc(x.title)+'</h3><p><b>'+esc(x.number||"Circular")+'</b> · '+esc(x.date||"")+' · '+esc(x.audience||"All sections")+'</p><p>'+esc(x.summary||"")+'</p>'+(x.fileData?'<a href="'+x.fileData+'" target="_blank" rel="noopener">View PDF: '+esc(x.fileName)+'</a>':"")+'</article>').join("");
}
function manageCirculars(){
 if(!isSuper){overview();return;}
 main.innerHTML="<h1>Manage Circulars</h1><p>Create a circular, attach a PDF and publish it to the public Circulars section in this preview.</p><div class=\"dash-alert\"><b>Local preview only:</b> Publishing here updates this browser's website view. It does not email users, send mobile notifications or synchronise other devices. Those features require the backend/database phase.</div><form id=\"circularForm\"><div class=\"dash-form-grid\">"+
 '<div class="dash-field"><label for="cNumber">Circular Number</label><input id="cNumber" placeholder="e.g. BSG/2026/01"></div>'+
 '<div class="dash-field"><label for="cDate">Issue Date</label><input id="cDate" type="date" required></div>'+
 '<div class="dash-field full"><label for="cTitle">Circular Title / Subject</label><input id="cTitle" required placeholder="Enter circular subject"></div>'+
 '<div class="dash-field"><label for="cIssuer">Issued By</label><input id="cIssuer" value="Super Administrator" required></div>'+
 '<div class="dash-field"><label for="cAudience">Applicable To</label><select id="cAudience"><option>All Sections</option><option>Cubs</option><option>Bulbuls</option><option>Scouts</option><option>Guides</option><option>Unit Leaders</option><option>Patrol Leaders</option></select></div>'+
 '<div class="dash-field full"><label for="cSummary">Short Description</label><textarea id="cSummary" rows="4" placeholder="Add a short summary for the public notice list"></textarea></div>'+
 '<div class="dash-field full"><label for="cPdf">Attach Circular PDF (optional, max 1 MB in this preview)</label><input id="cPdf" type="file" accept="application/pdf,.pdf"></div>'+
 '</div><p><button class="dash-primary" type="submit">Save as Draft</button> <button class="dash-primary" type="button" id="publishNow">Publish Circular</button></p></form><h2>Saved Circulars</h2><div id="circularTable"></div>';
 document.getElementById("cDate").value=new Date().toISOString().slice(0,10);
 document.getElementById("circularForm").addEventListener("submit",e=>{e.preventDefault();storeCircular("Draft");});
 document.getElementById("publishNow").addEventListener("click",()=>storeCircular("Published"));
 renderCircularTable();
}
async function storeCircular(status){
 const title=document.getElementById("cTitle").value.trim();if(!title){alert("Please enter a circular title.");return;}
 const file=document.getElementById("cPdf").files[0];if(file&&(file.type!=="application/pdf"||file.size>1024*1024)){alert("Please choose a PDF file no larger than 1 MB for this preview.");return;}
 let fileData="";
 if(file){fileData=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});}
 const list=read();const now=new Date().toISOString();
 list.unshift({id:"circ-"+Date.now(),number:document.getElementById("cNumber").value.trim(),date:document.getElementById("cDate").value,title,issuer:document.getElementById("cIssuer").value.trim(),audience:document.getElementById("cAudience").value,summary:document.getElementById("cSummary").value.trim(),fileName:file?.name||"",fileData,status,createdAt:now,publishedAt:status==="Published"?now:""});
 try{save(list);}catch{alert("Browser storage is full. Try a smaller PDF.");return;}
 document.getElementById("circularForm").reset();document.getElementById("cIssuer").value="Super Administrator";document.getElementById("cDate").value=new Date().toISOString().slice(0,10);renderCircularTable();
 alert(status==="Published"?"Circular published in this browser preview. It has not been emailed or sent to other devices.":"Circular saved as a draft in this browser preview.");
}
function renderCircularTable(){
 const root=document.getElementById("circularTable");if(!root)return;
 const list=read().filter(x=>!x.archived);
 if(!list.length){root.innerHTML='<div class="dash-empty">No circulars saved yet.</div>';return;}
 root.innerHTML='<div class="dash-table-wrap"><table class="dash-table"><thead><tr><th>Number / Subject</th><th>Date</th><th>Audience</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+list.map(x=>'<tr><td><b>'+esc(x.number||"—")+'</b><br>'+esc(x.title)+'</td><td>'+esc(x.date)+'</td><td>'+esc(x.audience)+'</td><td><span class="dash-tag '+(x.status==="Published"?"published":"")+'">'+esc(x.status)+'</span></td><td>'+(x.status==="Published"?'<button class="dash-secondary" data-action="draft" data-id="'+esc(x.id)+'">Unpublish</button>':'<button class="dash-primary" data-action="publish" data-id="'+esc(x.id)+'">Publish</button>')+' <button class="dash-danger" data-action="archive" data-id="'+esc(x.id)+'">Archive</button></td></tr>').join("")+'</tbody></table></div>';
 root.querySelectorAll("button[data-action]").forEach(b=>b.addEventListener("click",()=>changeCircular(b.dataset.id,b.dataset.action)));
}
function changeCircular(id,action){
 const list=read();const x=list.find(item=>item.id===id);if(!x)return;
 if(action==="archive"){x.archived=true;x.status="Archived";}
 if(action==="publish"){x.status="Published";x.publishedAt=new Date().toISOString();}
 if(action==="draft"){x.status="Draft";x.publishedAt="";}
 save(list);renderCircularTable();
}
showView("overview");
function readGallery(){try{return JSON.parse(localStorage.getItem(GALLERY_KEY)||"[]");}catch{return [];}}
function saveGallery(list){localStorage.setItem(GALLERY_KEY,JSON.stringify(list));}
function manageGallery(){
 const directPublish=isSuper;
 main.innerHTML='<h1>Photo Gallery</h1><p>Upload a school-approved Scout or Guide activity photograph. '+(directPublish?'Your Super Administrator uploads can be published immediately.':'Your upload will remain pending until an Administrator or Super Administrator verifies it.')+'</p><div class="dash-alert"><b>Preview mode:</b> Photos are stored only in this browser for now. Shared cloud storage will be connected in the database phase. Upload only school-approved photos and avoid images showing private student information.</div><form id="galleryForm"><div class="dash-form-grid"><div class="dash-field full"><label for="galleryTitle">Photo Title</label><input id="galleryTitle" required placeholder="e.g. World Thinking Day Celebration"></div><div class="dash-field full"><label for="galleryCaption">Caption / Activity Details</label><textarea id="galleryCaption" rows="3" placeholder="Add date, activity or a short caption"></textarea></div><div class="dash-field full"><label for="galleryImage">Choose Photograph (JPG, PNG or WebP; max 400 KB)</label><input id="galleryImage" type="file" accept="image/jpeg,image/png,image/webp" required></div></div><p><button class="dash-primary" type="submit">Submit Photo for Verification</button></p></form><h2>Uploaded Photographs</h2><div id="galleryTable"></div>';
 document.getElementById("galleryForm").addEventListener("submit",uploadGalleryPhoto);
 renderGalleryTable();
}
async function uploadGalleryPhoto(event){
 event.preventDefault();
 const file=document.getElementById("galleryImage").files[0];
 if(!file)return;
 if(!["image/jpeg","image/png","image/webp"].includes(file.type)){alert("Please choose a JPG, PNG or WebP image.");return;}
 if(file.size>400*1024){alert("Please choose an image smaller than 400 KB for this preview.");return;}
 const imageData=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
 const list=readGallery();
 list.unshift({id:"photo-"+Date.now(),title:document.getElementById("galleryTitle").value.trim(),caption:document.getElementById("galleryCaption").value.trim(),fileName:file.name,imageData,status:isSuper?"Published":"Pending",uploadedBy:session?.name||role,uploadedRole:role,createdAt:new Date().toISOString(),verifiedBy:isSuper?(session?.name||"Super Administrator"):""});
 try{saveGallery(list);}catch{alert("Browser storage is full. Please use a smaller image or remove older preview photos.");return;}
 document.getElementById("galleryForm").reset();renderGalleryTable();
 alert(isSuper?"Photo published in this browser preview. It is not yet visible to other devices.":"Photo submitted for verification. It will appear in the public gallery only after an Administrator or Super Administrator approves it.");
}
function renderGalleryTable(){
 const root=document.getElementById("galleryTable");if(!root)return;
 const list=readGallery().filter(x=>isSuper||x.uploadedBy===(session?.name||role)||x.uploadedRole===role);
 if(!list.length){root.innerHTML='<div class="dash-empty">No photo uploads yet.</div>';return;}
 root.innerHTML='<div class="gallery-admin-grid">'+list.map(x=>'<article class="gallery-admin-card"><img src="'+x.imageData+'" alt=""><div><b>'+esc(x.title)+'</b><p>'+esc(x.caption||x.fileName)+'</p><span class="dash-tag '+(x.status==="Published"?"published":"")+'">'+esc(x.status)+'</span>'+(x.status==="Pending"?"<p>Waiting for verification</p>":"")+'<button class="dash-danger" data-remove="'+esc(x.id)+'">Remove</button></div></article>').join("")+'</div>';
 root.querySelectorAll("[data-remove]").forEach(button=>button.addEventListener("click",()=>{if(!confirm("Remove this photo from the preview gallery?"))return;saveGallery(readGallery().filter(x=>x.id!==button.dataset.remove));renderGalleryTable();}));
}

function reviewGallery(){
 if(!canReview){overview();return;}
 const pending=readGallery().filter(x=>x.status==="Pending");
 main.innerHTML='<h1>Verify Photo Uploads</h1><p>Review submitted photographs before they are displayed on the public homepage.</p><div class="dash-alert">Only approved photographs are shown in the public gallery. Check that each photo is suitable for the school website and has an appropriate caption.</div><div id="pendingGallery"></div>';
 const root=document.getElementById("pendingGallery");
 if(!pending.length){root.innerHTML='<div class="dash-empty">There are no photographs waiting for verification.</div>';return;}
 root.innerHTML='<div class="gallery-admin-grid">'+pending.map(x=>'<article class="gallery-admin-card"><img src="'+x.imageData+'" alt=""><div><b>'+esc(x.title)+'</b><p>'+esc(x.caption||x.fileName)+'</p><small>Submitted by: '+esc(x.uploadedBy||x.uploadedRole||"Portal user")+'</small><p><button class="dash-primary" data-approve="'+esc(x.id)+'">Approve &amp; Publish</button> <button class="dash-danger" data-reject="'+esc(x.id)+'">Reject</button></p></div></article>').join("")+'</div>';
 root.querySelectorAll("[data-approve]").forEach(b=>b.addEventListener("click",()=>verifyGalleryPhoto(b.dataset.approve,true)));
 root.querySelectorAll("[data-reject]").forEach(b=>b.addEventListener("click",()=>verifyGalleryPhoto(b.dataset.reject,false)));
}
function verifyGalleryPhoto(id,approved){
 const list=readGallery();const photo=list.find(x=>x.id===id);if(!photo)return;
 photo.status=approved?"Published":"Rejected";
 photo.verifiedBy=session?.name||role;
 photo.verifiedAt=new Date().toISOString();
 saveGallery(list);
 reviewGallery();
}
