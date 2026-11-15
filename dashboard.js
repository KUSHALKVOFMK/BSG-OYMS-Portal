const SESSION_KEY="kvs_oyms_demo_session";
const ACCOUNTS_KEY="kvs_oyms_demo_accounts_v2";
const APPROVALS_KEY="kvs_oyms_demo_admin_approvals_v1";
const FREEZE_KEY="kvs_oyms_demo_freeze_requests_v1";
const SECTIONS_KEY="kvs_oyms_demo_sections_v1";
const SCHOOL_KEY="kvs_oyms_demo_school_profile_v1";
const SETTINGS_KEY="kvs_oyms_demo_portal_settings_v1";
const LOGS_KEY="kvs_oyms_demo_activity_logs_v1";
let session=null;
try{session=JSON.parse(sessionStorage.getItem(SESSION_KEY)||"null");}catch{}
if(!session||!session.demo){window.location.replace("../../login/");}
const role=session?.role||"Member";
const roleSlug=session?.roleSlug||"member";
const routeRoleSlug=document.body.dataset.role||"";
if(session?.demo&&routeRoleSlug&&routeRoleSlug!==roleSlug)window.location.replace("../../"+roleSlug+"/dashboard/");
const isSuper=role==="Super Administrator";
const canReview=isSuper;
const canManageCirculars=isSuper;
const canManageEvents=isSuper;
const canUploadGallery=isSuper;
const main=document.getElementById("dashMain");
const nav=document.getElementById("dashNav");
const actor=session?.name||role;
document.getElementById("signedInAs").textContent=actor+" · Demo preview";
if(!isSuper){document.body.classList.add("role-workspace-page");document.body.dataset.role=roleSlug;}
document.getElementById("logout").addEventListener("click",()=>{sessionStorage.removeItem(SESSION_KEY);window.location.href="../../login/";});

function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function readLocal(key,fallback){try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback;}catch{return fallback;}}
function writeLocal(key,value){localStorage.setItem(key,JSON.stringify(value));}
function logAction(action,detail){const logs=readLocal(LOGS_KEY,[]);logs.unshift({id:"log-"+Date.now(),action,detail,by:actor,role,at:new Date().toISOString()});writeLocal(LOGS_KEY,logs.slice(0,500));}
function defaultAccounts(){return [{id:"DEMO-SUPER-001",role:"Super Administrator",status:"Active",kind:"Demo preview"},{id:"DEMO-USER-001",role:"Selected non-super role",status:"Active",kind:"Shared role-preview account"}];}
function getAccounts(){let a=readLocal(ACCOUNTS_KEY,null);if(!Array.isArray(a)){a=defaultAccounts();writeLocal(ACCOUNTS_KEY,a);}return a;}

const NOTIFICATIONS_KEY="kvs_oyms_demo_login_notifications_v1";
function recipientAccounts(){
 const base=getAccounts().map(x=>({loginId:x.id,name:x.name||x.id,role:x.role,status:x.status||"Active"}));
 const scoped=readLocal("sankalp20_scoped_accounts_demo_v1",{accounts:[]});
 (Array.isArray(scoped?.accounts)?scoped.accounts:[]).forEach(x=>base.push({loginId:x.loginId||x.id,name:x.name||x.loginId||x.id,role:x.role,status:x.status||"Active"}));
 const seen=new Set();
 return base.filter(x=>x.loginId&&x.status==="Active"&&!seen.has(x.loginId)&&seen.add(x.loginId));
}
function sendNotifications(){
 if(!isSuper){overview();return;}
 const accounts=recipientAccounts(),items=readLocal(NOTIFICATIONS_KEY,[]);
 main.innerHTML='<h1>Send Notifications</h1><p>Send a message to selected Login IDs or every active account.</p><div class="dash-alert">Preview mode: notifications are saved in this browser only. They are not yet delivered across devices. Shared delivery will be enabled during the secure database phase.</div>'+
 '<form id="loginNoticeForm" class="dash-panel"><div class="dash-field full"><label for="noticeTitle">Notification Title</label><input id="noticeTitle" maxlength="100" required placeholder="Enter a short title"></div><div class="dash-field full"><label for="noticeMessage">Message</label><textarea id="noticeMessage" rows="5" maxlength="2000" required placeholder="Write the message for the selected Login IDs"></textarea></div>'+
 '<div class="notice-recipient-head"><h2>Select Recipients</h2><label><input type="checkbox" id="noticeAll"> Select All active Login IDs</label></div><div class="notice-recipient-list">'+(accounts.length?accounts.map(a=>'<label class="notice-recipient"><input type="checkbox" name="noticeRecipient" value="'+esc(a.loginId)+'"><span><b>'+esc(a.loginId)+'</b><small>'+esc(a.name)+' · '+esc(a.role)+'</small></span></label>').join(""):'<p class="dash-empty">No active Login IDs are registered yet.</p>')+'</div><button class="dash-primary" type="submit" '+(!accounts.length?'disabled':'')+'>Send Notification</button></form>'+
 '<h2>Sent Notification History</h2><div class="dash-table-wrap">'+(items.length?'<table class="dash-table"><thead><tr><th>Sent</th><th>Title</th><th>Recipients</th><th>Message</th></tr></thead><tbody>'+items.map(n=>'<tr><td>'+esc(new Date(n.sentAt).toLocaleString())+'</td><td>'+esc(n.title)+'</td><td>'+esc(n.recipients.length===accounts.length?'All active Login IDs':n.recipients.join(", "))+'</td><td>'+esc(n.message)+'</td></tr>').join("")+'</tbody></table>':'<div class="dash-empty">No notifications sent yet.</div>')+'</div>';
 const all=document.getElementById("noticeAll"),checks=[...main.querySelectorAll('input[name="noticeRecipient"]')];
 all.addEventListener("change",()=>checks.forEach(c=>c.checked=all.checked));
 checks.forEach(c=>c.addEventListener("change",()=>{all.checked=checks.length>0&&checks.every(x=>x.checked);all.indeterminate=checks.some(x=>x.checked)&&!all.checked;}));
 document.getElementById("loginNoticeForm").addEventListener("submit",e=>{e.preventDefault();const recipients=checks.filter(c=>c.checked).map(c=>c.value);if(!recipients.length){alert("Select at least one Login ID or choose Select All.");return;}const rows=readLocal(NOTIFICATIONS_KEY,[]);rows.unshift({id:"notice-"+Date.now(),title:document.getElementById("noticeTitle").value.trim(),message:document.getElementById("noticeMessage").value.trim(),recipients,sentAt:new Date().toISOString(),sentBy:session?.loginId||actor});writeLocal(NOTIFICATIONS_KEY,rows.slice(0,500));logAction("Sent login notification",rows[0].title+" · "+recipients.length+" recipient(s)");alert("Notification saved for "+recipients.length+" Login ID(s) in this browser preview.");sendNotifications();});
}
function myNotifications(){
 const rows=readLocal(NOTIFICATIONS_KEY,[]),loginId=session?.loginId||"";
 const received=rows.filter(n=>Array.isArray(n.recipients)&&n.recipients.includes(loginId));
 const readKey="kvs_oyms_demo_login_notifications_read_"+loginId;
 const readIds=readLocal(readKey,[]);
 main.innerHTML='<h1>My Notifications</h1><p>Messages addressed to your Login ID: <b>'+esc(loginId)+'</b></p>'+
 (received.length?received.map(n=>'<article class="login-notice-card"><div><span class="dash-tag">'+esc(new Date(n.sentAt).toLocaleString())+'</span><h2>'+esc(n.title)+'</h2></div><p>'+esc(n.message).replace(/\n/g,"<br>")+'</p><small>Sent by '+esc(n.sentBy||"Portal Administrator")+'</small></article>').join(""):'<div class="dash-empty">You have no notifications yet.</div>');
 const unread=received.filter(n=>!readIds.includes(n.id)).map(n=>n.id);
 if(unread.length)writeLocal(readKey,[...new Set([...readIds,...unread])]);
}
function getApprovals(){return readLocal(APPROVALS_KEY,[]);}
function getFreezeRequests(){return readLocal(FREEZE_KEY,[]);}
function getSections(){let s=readLocal(SECTIONS_KEY,null);if(!Array.isArray(s)){s=[{id:"cubs",name:"Cubs",units:[]},{id:"bulbuls",name:"Bulbuls",units:[]},{id:"scouts",name:"Scouts",units:[]},{id:"guides",name:"Guides",units:[]}];writeLocal(SECTIONS_KEY,s);}return s;}
const superGroups=[
 ["ADMIN MANAGEMENT",[["users","Admin Management"],["approvals","Administrator Approvals"],["loginIds","Login ID Registry"],["accounts","Account Controls"]]],
 ["PORTAL MANAGEMENT",[["gallery","Photo & Video Gallery"],["reviewGallery","Gallery Review Queue"],["circularsManage","Notifications & Circulars"],["slideshow","Homepage Slides"],["events","Events & Activities"],["instantPopup","Instant Announcements"],["settings","Portal Settings"],["notificationsSend","Send Notifications"]]],
 ["MONITORING",[["reports","Reports & Analytics"],["logs","Activity Logs"]]]
];
const superItems=superGroups.flatMap(group=>group[1]);
const memberItems=[["overview","Dashboard"],["profile","My Profile"],["notifications","Notifications"],["circulars","Circulars"],["gallery","Photo Gallery"]];
const roleItems={
 Administrator:[["overview","Dashboard"],["notifications","Notifications"]],
 "Unit Leader":[["overview","Dashboard"],["profile","My Profile"],["notifications","Notifications"],["unitOverview","Unit Overview"],["circulars","Circulars"],["activityCalendar","Activity Calendar"],["gallery","Photo Gallery"]],
 "Assistant Unit Leader":[["overview","Dashboard"],["profile","My Profile"],["unitOverview","Unit Overview"],["circulars","Circulars"],["activityCalendar","Activity Calendar"],["gallery","Photo Gallery"]],
 "Patrol Leader":[["overview","Dashboard"],["profile","My Profile"],["notifications","Notifications"],["patrolWorkspace","My Patrol"],["circulars","Circulars"],["activityCalendar","Activity Calendar"],["gallery","Photo Gallery"]],
 "Assistant Patrol Leader":[["overview","Dashboard"],["profile","My Profile"],["patrolWorkspace","My Patrol"],["circulars","Circulars"],["activityCalendar","Activity Calendar"],["gallery","Photo Gallery"]],
 Member:memberItems
};
if(isSuper){
 const home=document.createElement("button");home.type="button";home.textContent="Dashboard";home.dataset.view="overview";home.addEventListener("click",()=>showView("overview"));nav.appendChild(home);
 superGroups.forEach(([heading,links])=>{
  const label=document.createElement("div");label.className="dash-nav-group-label";label.textContent=heading;label.style.cssText="margin:18px 10px 7px;padding-top:12px;border-top:1px solid #e7e0ef;color:#8a789c;font-size:10px;font-weight:850;letter-spacing:1.2px;";
  nav.appendChild(label);
  links.forEach(([id,title])=>{const b=document.createElement("button");b.type="button";b.textContent=title;b.dataset.view=id;b.addEventListener("click",()=>showView(id));nav.appendChild(b);});
 });
}else{
 const items=roleItems[role]||memberItems;
 items.forEach(([id,label])=>{const b=document.createElement("button");b.type="button";b.textContent=label;b.dataset.view=id;b.addEventListener("click",()=>showView(id));nav.appendChild(b);});
}
const documentsLink=document.createElement("a");
documentsLink.className="dash-external-nav";
documentsLink.href="https://documents.bsgindia.org/";
documentsLink.target="_blank";
documentsLink.rel="noopener noreferrer";
documentsLink.textContent="BSG Documents ↗";
if(!isSuper&&role!=="Administrator")nav.appendChild(documentsLink);

async function showView(view){
 document.querySelectorAll("#dashNav button").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
 if(view==="overview")return overview();
 if(view==="users"&&(isSuper||role==="Administrator"))return window.OYMSUserManagementDemo?.open();
 if(isSuper&&view==="notificationsSend")return sendNotifications();
 if(view==="notifications")return myNotifications();
 if(isSuper&&view==="instantPopup")return instantAnnouncementAdmin();
 if(isSuper&&view==="circularsManage")return manageCirculars();
 if(isSuper&&view==="gallery")return manageGallery();
 if(isSuper&&view==="reviewGallery")return reviewGallery();
 if(isSuper&&view==="events")return eventManagement();
 if(isSuper&&view==="slideshow")return manageSlideshow();
 if(isSuper&&view==="approvals")return adminApprovals();
 if(isSuper&&view==="loginIds")return loginIds();
 if(isSuper&&view==="accounts")return accountControls();
 if(isSuper&&view==="settings")return portalSettings();
 if(isSuper&&view==="notificationsSend")return sendNotifications();
 if(isSuper&&view==="reports")return reports();
 if(isSuper&&view==="logs")return activityLogs();
 if(view==="school"&&isSuper)return schoolDetails();
 if(view==="profile")return profile();
 if(view==="circulars")return circulars();
 if(view==="manage"&&canManageCirculars)return manageCirculars();
 if(view==="gallery")return manageGallery();
 if(view==="reviewGallery"&&canReview)return reviewGallery();
 if(view==="unitOverview"&&(role==="Unit Leader"||role==="Assistant Unit Leader"))return unitOverview();
 if(view==="patrolWorkspace"&&(role==="Patrol Leader"||role==="Assistant Patrol Leader"))return patrolWorkspace();
 if(view==="activityCalendar"&&!isSuper)return activityCalendar();
 if(view==="approvals"&&isSuper)return adminApprovals();
 if(view==="loginIds"&&isSuper)return loginIds();
 if(view==="sections"&&isSuper)return manageSections();
 if(view==="patrols"&&isSuper)return patrolRegistry();
 if(view==="progression"&&isSuper)return progressionAppreciation();
 if(view==="events"&&canManageEvents)return eventManagement();
 if(view==="slideshow"&&isSuper)return manageSlideshow();
 if(view==="instantPopup"&&isSuper)return instantAnnouncementAdmin();
 if(view==="reports"&&isSuper)return reports();
 if(view==="logs"&&isSuper)return activityLogs();
 if(view==="accounts"&&isSuper)return accountControls();
 if(view==="settings"&&isSuper)return portalSettings();
 if(view==="freeze"&&isSuper)return freezeRequests();
 if(view==="demo"&&isSuper)return demoAccounts();
 overview();
}

function schoolDetails(){
 const p=readLocal(SCHOOL_KEY,{school:"PM SHRI Kendriya Vidyalaya Ordnance Factory Medak",unit:"Alluri",kvCode:"1525",region:"Hyderabad",district:"Sangareddy",pin:"502205",name:session?.name||"",designation:"Super Administrator",email:"",mobile:""});
 main.innerHTML='<h1>School &amp; Personal Details</h1><p>Review the school identity and the Super Administrator profile used in this local preview.</p><form id="schoolForm" class="dash-panel"><h2>School Details</h2><div class="dash-form-grid">'+
 '<div class="dash-field full"><label for="schoolName">School Name</label><input id="schoolName" value="'+esc(p.school)+'" required></div>'+
 '<div class="dash-field"><label for="unitName">BSG Unit Name</label><input id="unitName" value="'+esc(p.unit)+'"></div>'+
 '<div class="dash-field"><label for="kvCode">KV Code</label><input id="kvCode" value="'+esc(p.kvCode)+'"></div>'+
 '<div class="dash-field"><label for="region">KVS Region</label><input id="region" value="'+esc(p.region)+'"></div>'+
 '<div class="dash-field"><label for="district">District</label><input id="district" value="'+esc(p.district)+'"></div>'+
 '<div class="dash-field"><label for="pin">PIN Code</label><input id="pin" value="'+esc(p.pin)+'"></div>'+
 '</div><h2>Personal Details</h2><div class="dash-form-grid">'+
 '<div class="dash-field"><label for="personalName">Display Name</label><input id="personalName" value="'+esc(p.name)+'"></div>'+
 '<div class="dash-field"><label for="designation">Designation</label><input id="designation" value="'+esc(p.designation)+'"></div>'+
 '<div class="dash-field"><label for="personalEmail">Email (optional)</label><input id="personalEmail" type="email" value="'+esc(p.email)+'"></div>'+
 '<div class="dash-field"><label for="personalMobile">Mobile (optional)</label><input id="personalMobile" value="'+esc(p.mobile)+'"></div>'+
 '</div><div class="dash-alert">Preview only: these details are saved in this browser. Shared profile records and secure account editing require the database phase.</div><button class="dash-primary" type="submit">Save School &amp; Personal Details</button></form>';
 document.getElementById("schoolForm").addEventListener("submit",e=>{e.preventDefault();const v={school:document.getElementById("schoolName").value.trim(),unit:document.getElementById("unitName").value.trim(),kvCode:document.getElementById("kvCode").value.trim(),region:document.getElementById("region").value.trim(),district:document.getElementById("district").value.trim(),pin:document.getElementById("pin").value.trim(),name:document.getElementById("personalName").value.trim(),designation:document.getElementById("designation").value.trim(),email:document.getElementById("personalEmail").value.trim(),mobile:document.getElementById("personalMobile").value.trim()};writeLocal(SCHOOL_KEY,v);logAction("Updated school profile","School and personal details updated in this browser.");alert("Saved in this browser preview.");});
}

async function roleOverview(){
 let circularRows=[],photoRows=[];
 try{await PortalStorage.init();circularRows=await PortalStorage.allCirculars();photoRows=await PortalStorage.allPhotos();}catch(error){}
 const eventData=readLocal("kvs_oyms_demo_events_v1",[]);
 const events=Array.isArray(eventData)?eventData:[];
 const today=new Date().toISOString().slice(0,10);
 const publishedCirculars=circularRows.filter(x=>x.status==="Published"&&!x.archived).length;
 const publishedPhotos=photoRows.filter(x=>x.status==="Published"&&!x.archived).length;
 const upcomingEvents=events.filter(x=>x.status==="Published"&&!x.archived&&x.date>=today).length;
 const myUploads=photoRows.filter(x=>x.uploadedBy===actor&&x.uploadedRole===role).length;
 const copy={
  Administrator:{eyebrow:"SCHOOL ADMINISTRATION",title:"Administrator Workspace",description:"Coordinate school-level circulars and events, review submitted photographs and keep approved information organised.",note:"Administrator actions in this preview are stored only in this browser. They do not publish information to every visitor or create real accounts."},
  "Unit Leader":{eyebrow:"UNIT COORDINATION",title:"Unit Leader Workspace",description:"Keep track of school BSG notices, unit structure and the activity calendar for Cubs, Bulbuls, Scouts and Guides.",note:"The unit assignment and individual member roster are not connected in this front-end preview. No student details are displayed."},
  "Assistant Unit Leader":{eyebrow:"UNIT SUPPORT",title:"Assistant Unit Leader Workspace",description:"Support unit coordination by checking published notices, the unit structure and upcoming programme dates.",note:"This preview does not assign live unit permissions or synchronise records between devices."},
  "Patrol Leader":{eyebrow:"PATROL COORDINATION",title:"Patrol Leader Workspace",description:"Check school BSG notices, activity dates and approved photographs relevant to your patrol.",note:"The patrol assignment and member roster are not connected in this demo. Do not enter student personal information."},
  "Assistant Patrol Leader":{eyebrow:"PATROL SUPPORT",title:"Assistant Patrol Leader Workspace",description:"Support your Patrol Leader by keeping up with notices, programme dates and approved activity photographs.",note:"No live patrol assignment, member list or student records are connected in this browser preview."},
  Member:{eyebrow:"MEMBER SPACE",title:"Member Workspace",description:"Read published school notices, view approved Scout and Guide photographs and check upcoming BSG activities.",note:"Your profile is read-only in this demo. Do not enter personal student details or passwords."}
 };
 const details=copy[role]||copy.Member;
 const stats=[["Published circulars",publishedCirculars],["Upcoming activities",upcomingEvents],["Approved gallery items",publishedPhotos],["My media submissions",myUploads]];
 const shortcuts=items.filter(x=>x[0]!=="overview");
 main.innerHTML='<div class="role-workspace-head"><div><span class="role-workspace-eyebrow">'+esc(details.eyebrow)+'</span><h1>'+esc(details.title)+'</h1><p>'+esc(details.description)+'</p></div><span class="role-workspace-badge">DEMO PREVIEW</span></div>'+
 '<div class="role-workspace-notice"><b>Front-end demo:</b> This workspace uses browser-only sample data. It is not secure authentication and does not synchronise across devices.</div>'+
 '<div class="role-workspace-stats">'+stats.map(x=>'<article class="role-workspace-stat"><strong>'+x[1]+'</strong><span>'+esc(x[0])+'</span></article>').join("")+'</div>'+
 '<section class="role-workspace-section"><div class="role-workspace-section-head"><div><span>YOUR WORKSPACE</span><h2>Quick Access</h2></div><p>Choose a section to continue</p></div><div class="role-workspace-grid">'+shortcuts.map(x=>'<button class="role-workspace-card" type="button" data-role-go="'+esc(x[0])+'"><strong>'+esc(x[1])+'</strong><span>Open section →</span></button>').join("")+'</div></section>'+
 '<section class="role-workspace-note"><h2>Important information</h2><p>'+esc(details.note)+'</p></section>';
 main.querySelectorAll("[data-role-go]").forEach(button=>button.addEventListener("click",()=>showView(button.dataset.roleGo)));
}

function unitOverview(){
 const groups=getSections();
 const total=groups.reduce((sum,group)=>sum+(Array.isArray(group.units)?group.units.length:0),0);
 main.innerHTML='<div class="role-workspace-head"><div><span class="role-workspace-eyebrow">UNIT STRUCTURE</span><h1>Unit Overview</h1><p>Browse the four BSG sections and the group or unit entries saved in this browser preview.</p></div><span class="role-workspace-badge">READ ONLY</span></div>'+
 '<div class="role-workspace-stats"><article class="role-workspace-stat"><strong>'+groups.length+'</strong><span>BSG sections</span></article><article class="role-workspace-stat"><strong>'+total+'</strong><span>Local group / unit entries</span></article><article class="role-workspace-stat"><strong>Not linked</strong><span>Assigned unit</span></article></div>'+
 '<div class="role-workspace-grid">'+groups.map(group=>'<article class="role-workspace-card role-workspace-card-static"><strong>'+esc(group.name)+'</strong><span>'+(Array.isArray(group.units)?group.units.length:0)+' local entries</span></article>').join("")+'</div>'+
 '<div class="role-workspace-note"><h2>Member records</h2><p>Individual student names, dates of birth, contact details and BSG UIDs are not loaded in this public preview. The figures above describe only local sample structure.</p></div>';
}

function patrolWorkspace(){
 main.innerHTML='<div class="role-workspace-head"><div><span class="role-workspace-eyebrow">PATROL AREA</span><h1>My Patrol</h1><p>A simple overview for Patrol Leaders and Assistant Patrol Leaders.</p></div><span class="role-workspace-badge">DEMO PREVIEW</span></div>'+
 '<div class="role-workspace-stats"><article class="role-workspace-stat"><strong>Not assigned</strong><span>Patrol name</span></article><article class="role-workspace-stat"><strong>Not connected</strong><span>Member roster</span></article><article class="role-workspace-stat"><strong>Available</strong><span>Published notices</span></article></div>'+
 '<div class="role-workspace-note"><h2>Patrol information</h2><p>Your patrol name, leader details and member list will appear here after the authorised setup. This preview intentionally does not collect or display student personal information.</p></div>'+
 '<div class="role-workspace-grid"><button class="role-workspace-card" type="button" data-role-go="circulars"><strong>Official Circulars</strong><span>Read published notices →</span></button><button class="role-workspace-card" type="button" data-role-go="activityCalendar"><strong>Activity Calendar</strong><span>View programme dates →</span></button><button class="role-workspace-card" type="button" data-role-go="gallery"><strong>Photo Gallery</strong><span>View approved photographs →</span></button></div>';
 main.querySelectorAll("[data-role-go]").forEach(button=>button.addEventListener("click",()=>showView(button.dataset.roleGo)));
}

function activityCalendar(){
 const today=new Date().toISOString().slice(0,10);
 const eventData=readLocal("kvs_oyms_demo_events_v1",[]);
 const rows=(Array.isArray(eventData)?eventData:[]).filter(x=>x.status==="Published"&&!x.archived).sort((a,b)=>(a.date||"").localeCompare(b.date||""));
 const upcoming=rows.filter(x=>x.date>=today),past=rows.filter(x=>x.date<today).reverse();
 const dateLabel=value=>{if(!value)return "Date not set";const d=new Date(value+"T00:00:00");return isNaN(d.getTime())?value:d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});};
 const renderEvent=x=>'<article class="role-event-card"><div class="role-event-date">'+esc(dateLabel(x.date))+(x.time?'<span>'+esc(x.time)+'</span>':"")+'</div><div><h3>'+esc(x.title||"School BSG Activity")+'</h3><p>'+esc(x.description||"No additional details were provided.")+'</p><small>'+esc(x.section||"All Sections")+' · '+esc(x.venue||"Venue to be announced")+'</small></div></article>';
 main.innerHTML='<div class="role-workspace-head"><div><span class="role-workspace-eyebrow">SCHOOL PROGRAMME</span><h1>Activity Calendar</h1><p>Published school and unit activities available in this browser preview.</p></div><span class="role-workspace-badge">READ ONLY</span></div>'+
 '<h2>Upcoming Activities</h2><div class="role-event-list">'+(upcoming.length?upcoming.map(renderEvent).join(""):'<div class="dash-empty">No upcoming activities have been published in this browser preview.</div>')+'</div>'+
 (past.length?'<h2>Previous Activities</h2><div class="role-event-list">'+past.map(renderEvent).join("")+'</div>':"")+
 '<div class="role-workspace-note"><p>Only events published by an Administrator or Super Administrator in this same browser are shown here.</p></div>';
}

async function roleGallery(){
 await PortalStorage.init();
 const all=await PortalStorage.allPhotos();
 const published=all.filter(x=>x.status==="Published"&&!x.archived).sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||""));
 const pending=all.filter(x=>x.status==="Pending"&&!x.archived&&x.uploadedBy===actor&&x.uploadedRole===role);
 const mediaCard=x=>{
  const blob=x.mediaBlob||x.imageBlob;
  if(!blob)return "";
  const src=URL.createObjectURL(blob),video=(x.mediaType||"").startsWith("video/");
  return '<article class="role-media-card">'+(video?'<video src="'+src+'" controls playsinline preload="metadata"></video>':'<img src="'+src+'" alt="'+esc(x.title||"Approved BSG activity photograph")+'">')+'<div><strong>'+esc(x.title||"BSG activity")+'</strong><p>'+esc(x.caption||"")+'</p><small>'+esc(x.uploadedRole||"Portal user")+'</small></div></article>';
 };
 main.innerHTML='<div class="role-workspace-head"><div><span class="role-workspace-eyebrow">SCHOOL ACTIVITIES</span><h1>Photo Gallery</h1><p>View approved school Scouts and Guides activity photographs.</p></div><span class="role-workspace-badge">APPROVED MEDIA</span></div>'+
 (canUploadGallery?'<form id="roleGalleryForm" class="dash-panel"><h2>Submit a Photograph</h2><p>Submit only school-approved activity photographs. Avoid student names, contact details and other private information.</p><div class="dash-form-grid"><div class="dash-field"><label for="roleGalleryTitle">Photo Title</label><input id="roleGalleryTitle" required maxlength="100" placeholder="Activity title"></div><div class="dash-field full"><label for="roleGalleryCaption">Caption (optional)</label><textarea id="roleGalleryCaption" rows="2" maxlength="240" placeholder="Short activity caption"></textarea></div><div class="dash-field full"><label for="roleGalleryImage">Photograph (JPG, PNG or WebP; up to 8 MB)</label><input id="roleGalleryImage" type="file" accept="image/jpeg,image/png,image/webp" required></div></div><button class="dash-primary" type="submit">Submit for Verification</button></form>':'<div class="role-workspace-note"><p>Gallery viewing is available in this member preview. Photograph submissions are reserved for authorised school and unit leaders.</p></div>')+
 '<h2>Published Gallery</h2><div class="role-gallery-grid">'+(published.length?published.map(mediaCard).join(""):'<div class="dash-empty">No approved photographs have been published in this browser preview.</div>')+'</div>'+
 (pending.length?'<h2>My Pending Submissions</h2><div class="role-gallery-grid">'+pending.map(mediaCard).join("")+'</div>':"");
 const form=document.getElementById("roleGalleryForm");
 if(form)form.addEventListener("submit",uploadRoleGalleryPhoto);
}
async function uploadRoleGalleryPhoto(event){
 event.preventDefault();
 const file=document.getElementById("roleGalleryImage").files[0];
 if(!file)return;
 if(!["image/jpeg","image/png","image/webp"].includes(file.type)){alert("Please choose a JPG, PNG or WebP photograph.");return;}
 if(file.size>8*1024*1024){alert("Please choose a photograph smaller than 8 MB.");return;}
 try{
  await PortalStorage.requestPersistentStorage();
  const title=document.getElementById("roleGalleryTitle").value.trim();
  await PortalStorage.savePhoto({id:"photo-"+Date.now(),title,caption:document.getElementById("roleGalleryCaption").value.trim(),fileName:file.name,imageBlob:file,mediaBlob:file,mediaType:file.type,status:"Pending",uploadedBy:actor,uploadedRole:role,createdAt:new Date().toISOString(),archived:false});
  logAction("Submitted gallery photograph",title);
  await roleGallery();
  alert("Photograph submitted for review in this browser preview. It is not shared to other devices.");
 }catch(error){alert("The browser could not store this photograph. Try a smaller file or check device storage.");console.error(error);}
}

async function overview(){
 if(!isSuper)return roleOverview();
 let circulars=[],photos=[];try{await PortalStorage.init();circulars=await PortalStorage.allCirculars();photos=await PortalStorage.allPhotos();}catch(error){}
 const published=circulars.filter(x=>x.status==="Published"&&!x.archived).length;
 const visiblePhotos=photos.filter(x=>x.status==="Published"&&!x.archived).length;
 const pendingAdmins=getApprovals().filter(x=>x.status==="Pending").length;
 const pendingFreeze=getFreezeRequests().filter(x=>x.status==="Pending").length;
 const accounts=getAccounts().length;
 main.innerHTML='<h1>'+(isSuper?"Super Administrator Dashboard":esc(role)+" Dashboard")+'</h1><p>Welcome to the KVS-OYMS 2.0 role-based preview.</p><div class="dash-alert"><b>Preview mode:</b> Changes are stored in this browser only. This is not secure live authentication and does not synchronise between devices.</div>'+
 '<div class="dash-stat-grid"><div class="dash-stat"><strong>'+accounts+'</strong><span>Demo Login ID records</span></div><div class="dash-stat"><strong>'+published+'</strong><span>Published circulars</span></div><div class="dash-stat"><strong>'+visiblePhotos+'</strong><span>Published gallery photos</span></div><div class="dash-stat"><strong>'+pendingAdmins+'</strong><span>Pending admin approvals</span></div><div class="dash-stat"><strong>'+pendingFreeze+'</strong><span>Pending freeze requests</span></div></div>'+
 (isSuper?'<h2>Admin Management</h2><div class="dash-quick-grid">'+superGroups[0][1].map(x=>'<button class="dash-quick" data-go="'+x[0]+'">'+esc(x[1])+' <span>Open section →</span></button>').join("")+'</div><h2>Portal Management</h2><div class="dash-quick-grid">'+superGroups[1][1].map(x=>'<button class="dash-quick" data-go="'+x[0]+'">'+esc(x[1])+' <span>Open section →</span></button>').join("")+'</div><h2>Monitoring</h2><div class="dash-quick-grid">'+superGroups[2][1].map(x=>'<button class="dash-quick" data-go="'+x[0]+'">'+esc(x[1])+' <span>Open section →</span></button>').join("")+'</div>':'<h2>Quick access</h2><p>Open Circulars to read notices and Photo Gallery to view or submit school-approved activity photographs.</p>');
 main.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.go)));
}

function profile(){
 main.innerHTML="<h1>My Profile</h1><p>Signed in as "+esc(session?.name)+".</p><div class=\"dash-form-grid\"><div class=\"dash-field\"><label>Role</label><input value=\""+esc(role)+"\" disabled></div><div class=\"dash-field\"><label>Preview Login ID</label><input value=\""+esc(session?.loginId)+"\" disabled></div><div class=\"dash-field full\"><label>School</label><input value=\"PM SHRI Kendriya Vidyalaya Ordnance Factory Medak\" disabled></div></div><div class=\"dash-alert\">Profile editing and account settings will be enabled after secure authentication and database setup.</div>";
}

async function circulars(){
 await PortalStorage.init();
 const info=await PortalStorage.estimate();
 const list=(await PortalStorage.allCirculars()).filter(x=>x.status==="Published"&&!x.archived).sort((a,b)=>(b.publishedAt||b.date||"").localeCompare(a.publishedAt||a.date||""));
 const audiences=[...new Set(list.map(x=>x.audience||"All Sections"))].sort();
 main.innerHTML='<div class="circular-page-head"><div><span class="circular-eyebrow">INFORMATION CENTRE</span><h1>Official Circulars</h1><p>Browse published school and Scouts &amp; Guides notices. Select a circular to read its full details or open its PDF.</p></div><div class="circular-total"><strong>'+list.length+'</strong><span>Published circulars</span></div></div>'+
 '<div class="circular-storage-note"><b>Browser storage:</b> '+PortalStorage.formatBytes(info.usage)+' used · '+PortalStorage.formatBytes(info.available)+' available on this device.</div>'+
 '<div class="circular-toolbar"><label class="circular-search"><span>Search circulars</span><input id="circularSearch" type="search" placeholder="Search by title, number or keyword"></label><label class="circular-filter"><span>Audience</span><select id="circularAudience"><option value="">All sections</option>'+audiences.map(a=>'<option value="'+esc(a)+'">'+esc(a)+'</option>').join("")+'</select></label><span class="circular-results" id="circularResults"></span></div>'+
 '<div id="publicCirculars" class="circular-card-list"></div>';
 const root=document.getElementById("publicCirculars");
 const search=document.getElementById("circularSearch");
 const audience=document.getElementById("circularAudience");
 const results=document.getElementById("circularResults");
 const render=()=>{
  const q=search.value.trim().toLowerCase(),selected=audience.value;
  const filtered=list.filter(x=>{
   const hay=[x.title,x.number,x.summary,x.issuer,x.audience].join(" ").toLowerCase();
   return (!q||hay.includes(q))&&(!selected||(x.audience||"All Sections")===selected);
  });
  results.textContent=filtered.length+" of "+list.length+" circulars";
  root.innerHTML=filtered.length?filtered.map(x=>'<article class="circular-card"><div class="circular-card-top"><span class="circular-number">'+esc(x.number||"OFFICIAL CIRCULAR")+'</span><span class="circular-status">PUBLISHED</span></div><h2>'+esc(x.title)+'</h2><div class="circular-meta"><span><b>Issued:</b> '+esc(x.date||"Date not specified")+'</span><span><b>For:</b> '+esc(x.audience||"All Sections")+'</span></div><p>'+esc(x.summary||"Open this circular to view its full details.")+'</p><div class="circular-card-bottom">'+(x.fileBlob?'<span class="circular-file">PDF attached · '+esc(x.fileName||"Circular PDF")+'</span>':'<span class="circular-file">Notice</span>')+'<button class="dash-primary" type="button" data-open-circular="'+esc(x.id)+'">TOUCH TO VIEW</button></div></article>').join(""):'<div class="circular-empty"><strong>No matching circulars</strong><span>Try a different keyword or audience filter.</span></div>';
  root.querySelectorAll("[data-open-circular]").forEach(b=>b.addEventListener("click",()=>viewCircularDetail(b.dataset.openCircular,false)));
 };
 search.addEventListener("input",render);audience.addEventListener("change",render);render();
}

async function viewCircularDetail(id,allowDraft=false){
 await PortalStorage.init();
 const item=(await PortalStorage.allCirculars()).find(x=>x.id===id&&!x.archived);
 if(!item||(!allowDraft&&item.status!=="Published")){await circulars();return;}
 const pdfUrl=item.fileBlob?URL.createObjectURL(item.fileBlob):"";
 main.innerHTML='<div class="circular-detail-page"><button class="dash-secondary circular-back" id="backToCirculars" type="button">← Back to '+(allowDraft?'Circular Management':'Circulars')+'</button><article class="circular-detail"><div class="circular-detail-heading"><span class="circular-eyebrow">SCHOOL COMMUNICATION</span><span class="dash-tag '+(item.status==="Published"?'published':'')+'">'+esc(item.status||"Published")+'</span></div><h1>'+esc(item.title)+'</h1><div class="circular-detail-meta"><div><small>CIRCULAR NUMBER</small><strong>'+esc(item.number||"Not assigned")+'</strong></div><div><small>ISSUE DATE</small><strong>'+esc(item.date||"Not specified")+'</strong></div><div><small>APPLICABLE TO</small><strong>'+esc(item.audience||"All Sections")+'</strong></div><div><small>ISSUED BY</small><strong>'+esc(item.issuer||"School Administration")+'</strong></div></div><section class="circular-description"><h2>Notice / Description</h2><p>'+esc(item.summary||"No additional description was provided.")+'</p></section>'+(pdfUrl?'<section class="circular-document"><div class="circular-document-head"><div><h2>Attached Circular</h2><span>'+esc(item.fileName||"Circular PDF")+'</span></div><a class="dash-primary circular-download" href="'+pdfUrl+'" target="_blank" rel="noopener" download="'+esc(item.fileName||"circular.pdf")+'">Open / Download PDF</a></div><iframe title="Circular PDF preview" src="'+pdfUrl+'#toolbar=1&navpanes=0" loading="lazy"></iframe></section>':'<div class="circular-no-file">No PDF is attached to this circular. Please read the notice details above.</div>')+'</article></div>';
 document.getElementById("backToCirculars").addEventListener("click",()=>allowDraft?manageCirculars():circulars());
}

async function manageCirculars(){
 if(!isSuper&&!canManageCirculars){overview();return;}
 await PortalStorage.init();
 const info=await PortalStorage.estimate();
 main.innerHTML='<h1>Manage Circulars</h1><p>Create, save, publish, unpublish or archive school circulars.</p><div class="dash-alert"><b>Expanded browser storage:</b> PDFs are now saved in IndexedDB instead of the old 1 MB localStorage limit. Browser/device quota applies; this is not yet shared cloud storage.</div><div id="circularQuota" class="dash-storage-line">Storage used: '+PortalStorage.formatBytes(info.usage)+' · Available: '+PortalStorage.formatBytes(info.available)+'</div><form id="circularForm" class="dash-panel"><div class="dash-form-grid">'+
 '<div class="dash-field"><label for="cNumber">Circular Number</label><input id="cNumber" placeholder="e.g. BSG/2026/01"></div>'+
 '<div class="dash-field"><label for="cDate">Issue Date</label><input id="cDate" type="date" required></div>'+
 '<div class="dash-field full"><label for="cTitle">Circular Title / Subject</label><input id="cTitle" required placeholder="Enter circular subject"></div>'+
 '<div class="dash-field"><label for="cIssuer">Issued By</label><input id="cIssuer" value="'+esc(isSuper?"Super Administrator":actor)+'" required></div>'+
 '<div class="dash-field"><label for="cAudience">Applicable To</label><select id="cAudience"><option>All Sections</option><option>Cubs</option><option>Bulbuls</option><option>Scouts</option><option>Guides</option><option>Unit Leaders</option><option>Patrol Leaders</option></select></div>'+
 '<div class="dash-field full"><label for="cSummary">Short Description</label><textarea id="cSummary" rows="4" placeholder="Add a short summary for the public notice list"></textarea></div>'+
 '<div class="dash-field full"><label for="cPdf">Attach Circular PDF (browser quota applies)</label><input id="cPdf" type="file" accept="application/pdf,.pdf"></div>'+
 '</div><p><button class="dash-primary" type="submit">Save as Draft</button> <button class="dash-primary" type="button" id="publishNow">Publish Circular</button></p></form><h2>Saved Circulars</h2><div id="circularTable"></div>';
 document.getElementById("cDate").value=new Date().toISOString().slice(0,10);
 document.getElementById("circularForm").addEventListener("submit",e=>{e.preventDefault();storeCircular("Draft");});
 document.getElementById("publishNow").addEventListener("click",()=>storeCircular("Published"));
 await renderCircularTable();
}
async function storeCircular(status){
 if(!isSuper&&!canManageCirculars){alert("You do not have permission to manage circulars in this preview.");return;}
 const title=document.getElementById("cTitle").value.trim();if(!title){alert("Please enter a circular title.");return;}
 const file=document.getElementById("cPdf").files[0];if(file&&file.type!=="application/pdf"){alert("Please choose a PDF file.");return;}
 try{
  await PortalStorage.requestPersistentStorage();
  const now=new Date().toISOString();
  await PortalStorage.saveCircular({id:"circ-"+Date.now(),number:document.getElementById("cNumber").value.trim(),date:document.getElementById("cDate").value,title,issuer:document.getElementById("cIssuer").value.trim(),audience:document.getElementById("cAudience").value,summary:document.getElementById("cSummary").value.trim(),fileName:file?.name||"",fileBlob:file||null,status,createdAt:now,publishedAt:status==="Published"?now:"",archived:false});
  logAction(status+" circular",title);
  document.getElementById("circularForm").reset();document.getElementById("cIssuer").value=isSuper?"Super Administrator":actor;document.getElementById("cDate").value=new Date().toISOString().slice(0,10);
  await renderCircularTable();
  const info=await PortalStorage.estimate();document.getElementById("circularQuota").textContent="Storage used: "+PortalStorage.formatBytes(info.usage)+" · Available: "+PortalStorage.formatBytes(info.available);
  alert(status==="Published"?"Circular published in this browser preview. It is not shared to other devices.":"Circular saved as a draft in this browser preview.");
 }catch(error){alert("The browser could not store this file. Check available device storage or choose a smaller PDF.");console.error(error);}
}
async function renderCircularTable(){
 const root=document.getElementById("circularTable");if(!root)return;
 const list=(await PortalStorage.allCirculars()).filter(x=>!x.archived);
 if(!list.length){root.innerHTML='<div class="dash-empty">No circulars saved yet.</div>';return;}
 root.innerHTML='<div class="dash-table-wrap"><table class="dash-table"><thead><tr><th>Number / Subject</th><th>Date</th><th>Audience</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+list.map(x=>'<tr><td><b>'+esc(x.number||"—")+'</b><br>'+esc(x.title)+(x.fileName?'<br><small>'+esc(x.fileName)+'</small>':"")+'</td><td>'+esc(x.date)+'</td><td>'+esc(x.audience)+'</td><td><span class="dash-tag '+(x.status==="Published"?"published":"")+'">'+esc(x.status)+'</span></td><td><button class="dash-secondary" data-action="view" data-id="'+esc(x.id)+'">Preview</button> '+(x.status==="Published"?'<button class="dash-secondary" data-action="draft" data-id="'+esc(x.id)+'">Unpublish</button>':'<button class="dash-primary" data-action="publish" data-id="'+esc(x.id)+'">Publish</button>')+' <button class="dash-danger" data-action="archive" data-id="'+esc(x.id)+'">Archive</button></td></tr>').join("")+'</tbody></table></div>';
 root.querySelectorAll("button[data-action]").forEach(b=>b.addEventListener("click",()=>b.dataset.action==="view"?viewCircularDetail(b.dataset.id,true):changeCircular(b.dataset.id,b.dataset.action)));
}
async function changeCircular(id,action){
 if(!isSuper&&!canManageCirculars){alert("You do not have permission to change circulars in this preview.");return;}
 const list=await PortalStorage.allCirculars();const x=list.find(item=>item.id===id);if(!x)return;
 if(action==="archive"){x.archived=true;x.status="Archived";}
 if(action==="publish"){x.status="Published";x.publishedAt=new Date().toISOString();}
 if(action==="draft"){x.status="Draft";x.publishedAt="";}
 await PortalStorage.saveCircular(x);logAction(action+" circular",x.title);await renderCircularTable();
}

async function manageGallery(){
 if(!isSuper)return roleGallery();
 await PortalStorage.init();
 const info=await PortalStorage.estimate();
 main.innerHTML='<h1>Photo Gallery</h1><p>Upload school-approved Scout and Guide activity photographs.</p><div class="dash-alert"><b>Expanded browser storage:</b> Photos are stored in IndexedDB, not localStorage. Browser/device quota applies. This preview does not sync photos to other devices. Upload only school-approved photographs and avoid private student information.</div><div id="galleryQuota" class="dash-storage-line">Storage used: '+PortalStorage.formatBytes(info.usage)+' · Available: '+PortalStorage.formatBytes(info.available)+'</div><form id="galleryForm" class="dash-panel"><div class="dash-form-grid"><div class="dash-field full"><label for="galleryTitle">Photo Title</label><input id="galleryTitle" required placeholder="e.g. World Thinking Day Celebration"></div><div class="dash-field full"><label for="galleryCaption">Caption / Activity Details</label><textarea id="galleryCaption" rows="3" placeholder="Add date, activity or a short caption"></textarea></div><div class="dash-field full"><label for="galleryImage">Choose Photograph or Video (JPG, PNG, WebP, MP4 or WebM)</label><input id="galleryImage" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" required></div></div><p><button class="dash-primary" type="submit">Submit Media for Verification</button></p></form><h2>Uploaded Photographs</h2><div id="galleryTable"></div>';
 document.getElementById("galleryForm").addEventListener("submit",uploadGalleryPhoto);
 await renderGalleryTable();
}
async function uploadGalleryPhoto(event){
 event.preventDefault();
 const file=document.getElementById("galleryImage").files[0];if(!file)return;
 if(!["image/jpeg","image/png","image/webp","video/mp4","video/webm"].includes(file.type)){alert("Please choose a JPG, PNG, WebP, MP4 or WebM file.");return;}
 try{
  await PortalStorage.requestPersistentStorage();
  const list=await PortalStorage.allPhotos();
  await PortalStorage.savePhoto({id:"photo-"+Date.now(),title:document.getElementById("galleryTitle").value.trim(),caption:document.getElementById("galleryCaption").value.trim(),fileName:file.name,imageBlob:file,mediaBlob:file,mediaType:file.type,status:isSuper?"Published":"Pending",uploadedBy:actor,uploadedRole:role,createdAt:new Date().toISOString(),verifiedBy:isSuper?actor:"",archived:false});
  logAction("Uploaded gallery media",document.getElementById("galleryTitle").value.trim());
  document.getElementById("galleryForm").reset();await renderGalleryTable();
  const info=await PortalStorage.estimate();document.getElementById("galleryQuota").textContent="Storage used: "+PortalStorage.formatBytes(info.usage)+" · Available: "+PortalStorage.formatBytes(info.available);
  alert(isSuper?"Media published in this browser preview. It is not yet visible to other devices.":"Media submitted for verification.");
 }catch(error){alert("The browser could not store this photo. Check available device storage or choose a smaller image.");console.error(error);}
}
async function renderGalleryTable(){
 const root=document.getElementById("galleryTable");if(!root)return;
 const all=await PortalStorage.allPhotos();
 const list=all.filter(x=>isSuper||x.uploadedBy===actor||x.uploadedRole===role);
 if(!list.length){root.innerHTML='<div class="dash-empty">No photo uploads yet.</div>';return;}
 root.innerHTML='<div class="gallery-admin-grid">'+list.map(x=>{const blob=x.mediaBlob||x.imageBlob,src=URL.createObjectURL(blob),isVideo=(x.mediaType||"").startsWith("video/");return '<article class="gallery-admin-card">'+(isVideo?'<video src="'+src+'" controls playsinline preload="metadata"></video>':'<img src="'+src+'" alt="'+esc(x.title)+'">')+'<div><b>'+esc(x.title)+'</b><p>'+esc(x.caption||x.fileName)+'</p><span class="dash-tag '+(x.status==="Published"?"published":"")+'">'+esc(x.status)+'</span>'+(x.status==="Pending"?"<p>Waiting for verification</p>":"")+'<button class="dash-danger" data-remove="'+esc(x.id)+'">Remove</button></div></article>';}).join("")+'</div>';
 root.querySelectorAll("[data-remove]").forEach(button=>button.addEventListener("click",async()=>{if(!confirm("Remove this photo from the preview gallery?"))return;await PortalStorage.removePhoto(button.dataset.remove);logAction("Removed gallery photo",button.dataset.remove);await renderGalleryTable();}));
}
async function reviewGallery(){
 if(!canReview){overview();return;}
 await PortalStorage.init();
 const pending=(await PortalStorage.allPhotos()).filter(x=>x.status==="Pending");
 main.innerHTML='<h1>Verify Photo Uploads</h1><p>Review submitted photographs before publication.</p><div class="dash-alert">Check that every photograph is school-approved and suitable for public display.</div><div id="pendingGallery"></div>';
 const root=document.getElementById("pendingGallery");
 if(!pending.length){root.innerHTML='<div class="dash-empty">There are no photographs waiting for verification.</div>';return;}
 root.innerHTML='<div class="gallery-admin-grid">'+pending.map(x=>{const blob=x.mediaBlob||x.imageBlob,src=URL.createObjectURL(blob),isVideo=(x.mediaType||"").startsWith("video/");return '<article class="gallery-admin-card">'+(isVideo?'<video src="'+src+'" controls playsinline preload="metadata"></video>':'<img src="'+src+'" alt="'+esc(x.title)+'">')+'<div><b>'+esc(x.title)+'</b><p>'+esc(x.caption||x.fileName)+'</p><small>Submitted by: '+esc(x.uploadedBy||x.uploadedRole||"Portal user")+'</small><p><button class="dash-primary" data-approve="'+esc(x.id)+'">Approve &amp; Publish</button> <button class="dash-danger" data-reject="'+esc(x.id)+'">Reject</button></p></div></article>';}).join("")+'</div>';
 root.querySelectorAll("[data-approve]").forEach(b=>b.addEventListener("click",()=>verifyGalleryPhoto(b.dataset.approve,true)));
 root.querySelectorAll("[data-reject]").forEach(b=>b.addEventListener("click",()=>verifyGalleryPhoto(b.dataset.reject,false)));
}
async function verifyGalleryPhoto(id,approved){
 if(!canReview){overview();return;}
 const list=await PortalStorage.allPhotos();const photo=list.find(x=>x.id===id);if(!photo)return;
 photo.status=approved?"Published":"Rejected";photo.verifiedBy=actor;photo.verifiedAt=new Date().toISOString();
 await PortalStorage.savePhoto(photo);logAction(approved?"Approved photo":"Rejected photo",photo.title);await reviewGallery();
}

function adminApprovals(){
 const list=getApprovals();
 main.innerHTML='<h1>Administrator Approval</h1><p>Review administrator access requests. Approve or suspend preview records.</p><div class="dash-alert">These are local preview records only. Live invitations, identity verification and secure account activation require backend authentication.</div><form id="approvalForm" class="dash-panel"><h2>Add a Preview Approval Request</h2><div class="dash-form-grid"><div class="dash-field"><label for="adminName">Applicant Name</label><input id="adminName" required></div><div class="dash-field"><label for="adminLogin">Requested Login ID</label><input id="adminLogin" placeholder="e.g. DEMO-ADMIN-02" required></div></div><button class="dash-primary" type="submit">Add Pending Request</button></form><h2>Administrator Requests</h2><div id="approvalTable"></div>';
 document.getElementById("approvalForm").addEventListener("submit",e=>{e.preventDefault();const rows=getApprovals();rows.unshift({id:"adm-"+Date.now(),name:document.getElementById("adminName").value.trim(),loginId:document.getElementById("adminLogin").value.trim(),role:"Administrator",status:"Pending",createdAt:new Date().toISOString()});writeLocal(APPROVALS_KEY,rows);logAction("Created admin approval request",rows[0].loginId);adminApprovals();});
 const root=document.getElementById("approvalTable");
 root.innerHTML=list.length?'<div class="dash-table-wrap"><table class="dash-table"><thead><tr><th>Applicant</th><th>Login ID</th><th>Requested Role</th><th>Status</th><th>Decision</th></tr></thead><tbody>'+list.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+esc(x.loginId)+'</td><td>'+esc(x.role)+'</td><td><span class="dash-tag '+(x.status==="Approved"?"published":"")+'">'+esc(x.status)+'</span></td><td>'+(x.status==="Pending"?'<button class="dash-primary" data-approve="'+esc(x.id)+'">Approve</button> <button class="dash-danger" data-reject="'+esc(x.id)+'">Reject</button>':x.status==="Approved"?'<button class="dash-danger" data-suspend="'+esc(x.id)+'">Suspend</button>':'<button class="dash-secondary" data-reactivate="'+esc(x.id)+'">Reactivate</button>')+'</td></tr>').join("")+'</tbody></table></div>':'<div class="dash-empty">No administrator requests yet. Add a preview request above to test approval.</div>';
 root.querySelectorAll("[data-approve],[data-reject],[data-suspend],[data-reactivate]").forEach(b=>b.addEventListener("click",()=>{const rows=getApprovals(),x=rows.find(a=>a.id===b.dataset.approve||a.id===b.dataset.reject||a.id===b.dataset.suspend||a.id===b.dataset.reactivate);if(!x)return;x.status=b.dataset.approve?"Approved":b.dataset.reject?"Rejected":b.dataset.suspend?"Suspended":"Approved";x.reviewedBy=actor;x.reviewedAt=new Date().toISOString();writeLocal(APPROVALS_KEY,rows);logAction("Admin request "+x.status,x.loginId);adminApprovals();}));
}

function loginIds(){
 const rows=getAccounts();
 main.innerHTML='<h1>All Login IDs</h1><p>View the login identifiers included in this demonstration.</p><div class="dash-alert">Only preview IDs are listed. New real accounts and credential resets must be handled by secure authentication, not by public browser code.</div><div class="dash-table-wrap"><table class="dash-table"><thead><tr><th>Login ID</th><th>Role</th><th>Account Type</th><th>Status</th><th>Credential Tools</th></tr></thead><tbody>'+rows.map(x=>'<tr><td><b>'+esc(x.id)+'</b></td><td>'+esc(x.role)+'</td><td>'+esc(x.kind||"Preview")+'</td><td><span class="dash-tag '+(x.status==="Active"?"published":"")+'">'+esc(x.status)+'</span></td><td><button class="dash-secondary" data-reset-id="'+esc(x.id)+'" disabled>Reset Login ID</button> <button class="dash-secondary" data-reset-pass="'+esc(x.id)+'" disabled>Reset Password</button></td></tr>').join("")+'</tbody></table></div><p class="dash-muted">Reset controls are shown but disabled until secure backend and email verification are connected.</p>';
}

function manageSections(){
 const groups=getSections();
 main.innerHTML='<h1>Cubs, Bulbuls, Scouts &amp; Guides Management</h1><p>Organise the four BSG sections and create local preview groups, units, flocks, Sixes or patrols.</p><div class="dash-alert">Changes are saved in this browser preview only. Shared unit/member records will require the database phase.</div><div class="section-admin-grid">'+groups.map(g=>'<section class="dash-panel"><div class="section-admin-head"><h2>'+esc(g.name)+'</h2><button class="dash-secondary" data-rename="'+esc(g.id)+'">Rename</button></div><p>'+g.units.length+' group / unit / patrol records</p><form data-add="'+esc(g.id)+'" class="inline-add"><label for="unit-'+esc(g.id)+'">Add to '+esc(g.name)+'</label><input id="unit-'+esc(g.id)+'" name="unit" placeholder="Enter unit, flock, Six or patrol name" required><button class="dash-primary" type="submit">Add</button></form><ul class="unit-list">'+(g.units.length?g.units.map(u=>'<li><span>'+esc(u.name)+'</span><button class="dash-danger" data-remove-unit="'+esc(g.id)+'|'+esc(u.id)+'">Remove</button></li>').join(""):'<li class="dash-muted">No groups added yet.</li>')+'</ul></section>').join("")+'</div>';
 main.querySelectorAll("form[data-add]").forEach(f=>f.addEventListener("submit",e=>{e.preventDefault();const rows=getSections(),g=rows.find(x=>x.id===f.dataset.add);if(!g)return;g.units.push({id:"unit-"+Date.now(),name:f.elements.unit.value.trim()});writeLocal(SECTIONS_KEY,rows);logAction("Added BSG group",g.name+" · "+f.elements.unit.value.trim());manageSections();}));
 main.querySelectorAll("[data-rename]").forEach(b=>b.addEventListener("click",()=>{const rows=getSections(),g=rows.find(x=>x.id===b.dataset.rename);const name=prompt("Enter the section display name:",g?.name||"");if(!g||!name?.trim())return;g.name=name.trim();writeLocal(SECTIONS_KEY,rows);logAction("Renamed BSG section",g.name);manageSections();}));
 main.querySelectorAll("[data-remove-unit]").forEach(b=>b.addEventListener("click",()=>{const [gid,uid]=b.dataset.removeUnit.split("|"),rows=getSections(),g=rows.find(x=>x.id===gid);if(!g)return;g.units=g.units.filter(u=>u.id!==uid);writeLocal(SECTIONS_KEY,rows);logAction("Removed BSG group",gid);manageSections();}));
}

async function reports(){
 await PortalStorage.init();
 const circ=await PortalStorage.allCirculars(),photos=await PortalStorage.allPhotos(),groups=getSections(),admins=getApprovals(),freezes=getFreezeRequests(),accounts=getAccounts();
 const stats=[["Login ID records",accounts.length],["Sections",groups.length],["Groups / units / patrols",groups.reduce((n,g)=>n+g.units.length,0)],["Circulars",circ.length],["Published circulars",circ.filter(x=>x.status==="Published"&&!x.archived).length],["Gallery uploads",photos.length],["Published photos",photos.filter(x=>x.status==="Published"&&!x.archived).length],["Admin requests pending",admins.filter(x=>x.status==="Pending").length],["Freeze requests pending",freezes.filter(x=>x.status==="Pending").length]];
 main.innerHTML='<h1>Reports &amp; Analytics</h1><p>Summary of this browser preview data.</p><div class="dash-stat-grid">'+stats.map(x=>'<div class="dash-stat"><strong>'+x[1]+'</strong><span>'+esc(x[0])+'</span></div>').join("")+'</div><div class="dash-alert">These figures include only records saved in this browser. They are not school-wide reports.</div>';
}
function activityLogs(){
 const logs=readLocal(LOGS_KEY,[]);
 main.innerHTML='<h1>Activity Logs</h1><p>Recent actions performed in this browser preview.</p><div class="dash-table-wrap"><table class="dash-table"><thead><tr><th>Time</th><th>Action</th><th>Details</th><th>Actor</th></tr></thead><tbody>'+(logs.length?logs.map(x=>'<tr><td>'+esc(new Date(x.at).toLocaleString())+'</td><td>'+esc(x.action)+'</td><td>'+esc(x.detail)+'</td><td>'+esc(x.by)+'<br><small>'+esc(x.role)+'</small></td></tr>').join(""):'<tr><td colspan="4">No activity recorded yet.</td></tr>')+'</tbody></table></div>';
}
function accountControls(){
 const rows=getAccounts();
 main.innerHTML='<h1>Account Controls</h1><p>Control demo preview account status.</p><div class="dash-alert">These controls affect only the local preview records. The primary Super Administrator preview account cannot be frozen here. Real account suspension and password resets require secure server-side permissions.</div><div class="dash-table-wrap"><table class="dash-table"><thead><tr><th>Login ID</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>'+rows.map(x=>'<tr><td>'+esc(x.id)+'</td><td>'+esc(x.role)+'</td><td><span class="dash-tag '+(x.status==="Active"?"published":"")+'">'+esc(x.status)+'</span></td><td>'+(x.id==="DEMO-SUPER-001"?"Protected preview account":'<button class="'+(x.status==="Active"?"dash-danger":"dash-primary")+'" data-toggle-account="'+esc(x.id)+'">'+(x.status==="Active"?"Freeze":"Unfreeze")+'</button>')+'</td></tr>').join("")+'</tbody></table></div>';
 main.querySelectorAll("[data-toggle-account]").forEach(b=>b.addEventListener("click",()=>{const a=getAccounts(),x=a.find(y=>y.id===b.dataset.toggleAccount);if(!x)return;x.status=x.status==="Active"?"Frozen":"Active";writeLocal(ACCOUNTS_KEY,a);logAction(x.status+" demo account",x.id);accountControls();}));
}
function portalSettings(){
 const s=readLocal(SETTINGS_KEY,{maintenance:false,showGallery:true,announcement:""});
 main.innerHTML='<h1>Portal Settings</h1><p>Local preview display settings.</p><form id="settingsForm" class="dash-panel"><div class="dash-field full"><label for="announcement">Homepage announcement text</label><textarea id="announcement" rows="3">'+esc(s.announcement)+'</textarea></div><label class="setting-check"><input id="maintenance" type="checkbox" '+(s.maintenance?"checked":"")+'> Maintenance mode (preview flag only)</label><label class="setting-check"><input id="showGallery" type="checkbox" '+(s.showGallery?"checked":"")+'> Show gallery section (preview setting)</label><div class="dash-alert">These settings are stored locally and do not change the public homepage for other visitors.</div><button class="dash-primary" type="submit">Save Portal Settings</button></form>';
 document.getElementById("settingsForm").addEventListener("submit",e=>{e.preventDefault();writeLocal(SETTINGS_KEY,{announcement:document.getElementById("announcement").value.trim(),maintenance:document.getElementById("maintenance").checked,showGallery:document.getElementById("showGallery").checked});logAction("Updated portal settings","Preview settings saved.");alert("Settings saved in this browser preview.");});
}
function freezeRequests(){
 const list=getFreezeRequests();
 main.innerHTML='<h1>Freeze / Unfreeze Requests</h1><p>Every request requires a Super Administrator Yes / No decision.</p><div class="dash-alert">This is a preview approval workflow only. It does not change real user access.</div><form id="freezeForm" class="dash-panel"><h2>Create a Preview Request</h2><div class="dash-form-grid"><div class="dash-field"><label for="freezeLogin">Login ID</label><input id="freezeLogin" required placeholder="Enter preview Login ID"></div><div class="dash-field"><label for="freezeAction">Requested Action</label><select id="freezeAction"><option>Freeze</option><option>Unfreeze</option></select></div><div class="dash-field full"><label for="freezeReason">Reason</label><textarea id="freezeReason" rows="2" required></textarea></div></div><button class="dash-primary" type="submit">Submit Preview Request</button></form><h2>Requests Awaiting Decision</h2><div id="freezeTable"></div>';
 document.getElementById("freezeForm").addEventListener("submit",e=>{e.preventDefault();const rows=getFreezeRequests();rows.unshift({id:"frz-"+Date.now(),loginId:document.getElementById("freezeLogin").value.trim(),action:document.getElementById("freezeAction").value,reason:document.getElementById("freezeReason").value.trim(),status:"Pending",requestedBy:actor,createdAt:new Date().toISOString()});writeLocal(FREEZE_KEY,rows);logAction("Submitted "+rows[0].action+" request",rows[0].loginId);freezeRequests();});
 const root=document.getElementById("freezeTable");
 root.innerHTML=list.length?'<div class="dash-table-wrap"><table class="dash-table"><thead><tr><th>Login ID</th><th>Action</th><th>Reason</th><th>Requested By</th><th>Status / Decision</th></tr></thead><tbody>'+list.map(x=>'<tr><td>'+esc(x.loginId)+'</td><td>'+esc(x.action)+'</td><td>'+esc(x.reason)+'</td><td>'+esc(x.requestedBy)+'</td><td>'+esc(x.status)+(x.status==="Pending"?'<br><button class="dash-primary" data-yes="'+esc(x.id)+'">Yes, Approve</button> <button class="dash-danger" data-no="'+esc(x.id)+'">No, Reject</button>':"")+'</td></tr>').join("")+'</tbody></table></div>':'<div class="dash-empty">No freeze or unfreeze requests yet.</div>';
 root.querySelectorAll("[data-yes],[data-no]").forEach(b=>b.addEventListener("click",()=>{const rows=getFreezeRequests(),x=rows.find(y=>y.id===b.dataset.yes||y.id===b.dataset.no);if(!x)return;x.status=b.dataset.yes?"Approved":"Rejected";x.decidedBy=actor;x.decidedAt=new Date().toISOString();writeLocal(FREEZE_KEY,rows);logAction(x.status+" "+x.action+" request",x.loginId);freezeRequests();}));
}
function demoAccounts(){
 main.innerHTML='<h1>Demo Accounts</h1><p>Use these values only to explore the public preview.</p><div class="dash-panel"><h2>Super Administrator</h2><p><b>Login ID:</b> DEMO-SUPER-001</p><p><b>Password:</b> DEMO-ONLY</p><p><b>Role:</b> Super Administrator</p></div><div class="dash-panel"><h2>Other Role Preview</h2><p><b>Login ID:</b> DEMO-USER-001</p><p><b>Password:</b> DEMO-ONLY</p><p><b>Role:</b> Select any non-Super Administrator role on the login page.</p></div><div class="dash-alert">These are public demonstration credentials, not real accounts. Do not use real student information or passwords.</div>';
}


function patrolRegistry(){
 const groups=getSections();
 main.innerHTML='<h1>Patrol &amp; Member Registry</h1><p>View the Scouts and Guides patrol structure and the Cub/Bulbul group structure.</p><div class="section-admin-grid">'+groups.map(g=>'<section class="dash-panel"><h2>'+esc(g.name)+'</h2><p>'+g.units.length+' registered preview groups / units / patrols</p><ul class="unit-list">'+(g.units.length?g.units.map(u=>'<li>'+esc(u.name)+'</li>').join(""):'<li class="dash-muted">No units or patrols added yet.</li>')+'</ul><button class="dash-secondary" data-edit-section="'+esc(g.id)+'">Manage '+esc(g.name)+'</button></section>').join("")+'</div><div class="dash-alert"><b>Member registry:</b> Individual student names, dates of birth, contact details and BSG UIDs are intentionally not collected in this public browser preview. Add the secure, permission-controlled member registry after database setup.</div>';
 main.querySelectorAll("[data-edit-section]").forEach(b=>b.addEventListener("click",()=>showView("sections")));
}
function progressionAppreciation(){
 const key="kvs_oyms_demo_progression_v1",rows=readLocal(key,[]);
 main.innerHTML='<h1>Progression &amp; Special Appreciation</h1><p>Record patrol-leader progression milestones and appreciation notes in this browser preview.</p><div class="dash-alert">Use demo Login IDs only. Do not enter student names or personal contact information here.</div><form id="progressionForm" class="dash-panel"><div class="dash-form-grid"><div class="dash-field"><label for="leaderLogin">Patrol Leader Login ID</label><input id="leaderLogin" required placeholder="Demo Login ID only"></div><div class="dash-field"><label for="leaderPatrol">Patrol / Unit</label><input id="leaderPatrol" required></div><div class="dash-field"><label for="progressLevel">Latest Progression</label><select id="progressLevel"><option>Pravesh</option><option>Pratham Sopan</option><option>Dwitiya Sopan</option><option>Tritiya Sopan</option><option>Rajya Puraskar</option><option>Rashtrapati Award</option></select></div><div class="dash-field"><label for="passDate">Date of Passing</label><input id="passDate" type="date" required></div><div class="dash-field full"><label for="appreciation">Special Appreciation (optional)</label><textarea id="appreciation" rows="3" placeholder="Short appreciation note"></textarea></div></div><button class="dash-primary" type="submit">Save Progression Record</button></form><h2>Saved Preview Records</h2><div id="progressionTable"></div>';
 document.getElementById("progressionForm").addEventListener("submit",e=>{e.preventDefault();const list=readLocal(key,[]);list.unshift({id:"prog-"+Date.now(),loginId:document.getElementById("leaderLogin").value.trim(),patrol:document.getElementById("leaderPatrol").value.trim(),level:document.getElementById("progressLevel").value,date:document.getElementById("passDate").value,appreciation:document.getElementById("appreciation").value.trim(),createdAt:new Date().toISOString()});writeLocal(key,list);logAction("Saved progression record",list[0].loginId+" · "+list[0].level);progressionAppreciation();});
 const root=document.getElementById("progressionTable");
 root.innerHTML=rows.length?'<div class="dash-table-wrap"><table class="dash-table"><thead><tr><th>Login ID</th><th>Patrol</th><th>Progression</th><th>Date of Passing</th><th>Appreciation</th></tr></thead><tbody>'+rows.map(x=>'<tr><td>'+esc(x.loginId)+'</td><td>'+esc(x.patrol)+'</td><td>'+esc(x.level)+'</td><td>'+esc(x.date)+'</td><td>'+esc(x.appreciation||"—")+'</td></tr>').join("")+'</tbody></table></div>':'<div class="dash-empty">No progression records have been entered.</div>';
}
async function eventManagement(){
 if(!isSuper&&!canManageEvents){overview();return;}
 const key="kvs_oyms_demo_events_v1",rows=readLocal(key,[]);
 main.innerHTML='<h1>Events &amp; Activities</h1><p>Add a programme to a date and publish it to the homepage Activity Calendar and Upcoming Programmes strip.</p><div class="dash-alert"><b>How it appears on the homepage:</b> Save a programme as a draft, then choose <b>Publish</b>. Published future programmes appear in the Upcoming Programmes strip; all published events appear on the Activity Calendar. Details are saved in this browser only.</div><form id="eventForm" class="dash-panel"><div class="dash-form-grid"><div class="dash-field"><label for="eventTitle">Event / Activity Title</label><input id="eventTitle" required maxlength="120" placeholder="e.g. Scout and Guide Meeting"></div><div class="dash-field"><label for="eventDate">Programme Date</label><input id="eventDate" type="date" required></div><div class="dash-field"><label for="eventTime">Programme Time (optional)</label><input id="eventTime" type="time"></div><div class="dash-field"><label for="eventSection">Section</label><select id="eventSection"><option>All Sections</option><option>Cubs</option><option>Bulbuls</option><option>Scouts</option><option>Guides</option></select></div><div class="dash-field"><label for="eventVenue">Venue</label><input id="eventVenue" placeholder="School / venue"></div><div class="dash-field"><label for="eventOrganiser">Organiser</label><input id="eventOrganiser" placeholder="Unit / teacher / team"></div><div class="dash-field full"><label for="eventDescription">Description</label><textarea id="eventDescription" rows="3" placeholder="Add programme details for visitors"></textarea></div><div class="dash-field"><label for="eventAttachment">Programme Attachment URL (optional)</label><input id="eventAttachment" type="url" placeholder="https://…"><small class="field-help">Link to an approved PDF or programme document.</small></div><div class="dash-field"><label for="eventRegistration">Registration Link (optional)</label><input id="eventRegistration" type="url" placeholder="https://…"></div></div><button class="dash-primary" type="submit">Save Event as Draft</button></form><h2>Saved Events</h2><p class="muted">Only Published events appear on the public homepage.</p><div id="eventTable"></div>';
 document.getElementById("eventForm").addEventListener("submit",e=>{
  e.preventDefault();
  const attachment=document.getElementById("eventAttachment").value.trim(),registration=document.getElementById("eventRegistration").value.trim();
  const validUrl=value=>{if(!value)return true;try{const u=new URL(value);return u.protocol==="https:"||u.protocol==="http:";}catch{return false;}};
  if(!validUrl(attachment)||!validUrl(registration)){alert("Please use a valid HTTP or HTTPS link for attachments and registration.");return;}
  const list=readLocal(key,[]);
  list.unshift({id:"evt-"+Date.now(),title:document.getElementById("eventTitle").value.trim(),date:document.getElementById("eventDate").value,time:document.getElementById("eventTime").value,section:document.getElementById("eventSection").value,venue:document.getElementById("eventVenue").value.trim(),organiser:document.getElementById("eventOrganiser").value.trim(),description:document.getElementById("eventDescription").value.trim(),attachmentUrl:attachment,registrationUrl:registration,status:"Draft",archived:false,createdAt:new Date().toISOString()});
  writeLocal(key,list);logAction("Created event draft",list[0].title);eventManagement();
 });
 const root=document.getElementById("eventTable");
 root.innerHTML=rows.length?'<div class="dash-table-wrap"><table class="dash-table"><thead><tr><th>Event / Details</th><th>Date &amp; Time</th><th>Section</th><th>Venue / Organiser</th><th>Status</th><th>Action</th></tr></thead><tbody>'+rows.map(x=>'<tr><td><b>'+esc(x.title)+'</b><br>'+esc(x.description||"")+(x.attachmentUrl?'<br><small>Attachment link added</small>':"")+(x.registrationUrl?'<br><small>Registration link added</small>':"")+'</td><td>'+esc(x.date)+(x.time?"<br>"+esc(x.time):"")+'</td><td>'+esc(x.section)+'</td><td>'+esc(x.venue||"—")+(x.organiser?"<br>"+esc(x.organiser):"")+'</td><td><span class="dash-tag '+(x.status==="Published"?"published":"")+'">'+esc(x.status)+'</span></td><td><button class="dash-primary" data-event-publish="'+esc(x.id)+'">'+(x.status==="Published"?"Unpublish":"Publish")+'</button> <button class="dash-danger" data-event-delete="'+esc(x.id)+'">Delete</button></td></tr>').join("")+'</tbody></table></div>':'<div class="dash-empty">No events have been added.</div>';
 root.querySelectorAll("[data-event-publish],[data-event-delete]").forEach(b=>b.addEventListener("click",()=>{const list=readLocal(key,[]),x=list.find(y=>y.id===b.dataset.eventPublish||y.id===b.dataset.eventDelete);if(!x)return;if(b.dataset.eventDelete){writeLocal(key,list.filter(y=>y.id!==x.id));logAction("Deleted event",x.title);}else{x.status=x.status==="Published"?"Draft":"Published";x.publishedAt=x.status==="Published"?new Date().toISOString():"";writeLocal(key,list);logAction(x.status+" event",x.title);}eventManagement();}));
}
async function orderedHomepageSlides(){
 const slides=await PortalStorage.allSlides();
 slides.sort((a,b)=>(a.createdAt||"").localeCompare(b.createdAt||""));
 let changed=false;
 slides.forEach((x,i)=>{if(!Number.isFinite(Number(x.order))){x.order=i+1;changed=true;}});
 if(changed)for(const x of slides)await PortalStorage.saveSlide(x);
 return slides.sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
}
function setSlideUploadStatus(message,type){
 const status=document.getElementById("slideUploadStatus");if(!status)return;
 status.textContent=message;status.className="slide-upload-status "+(type||"");
}
async function manageSlideshow(){
 if(!isSuper){alert("Only the Super Administrator can manage homepage slides.");return;}
 try{await PortalStorage.init();}catch(error){main.innerHTML='<div class="dash-alert">Browser file storage could not be opened. '+esc(error.message)+'</div>';return;}
 const info=await PortalStorage.estimate();
 main.innerHTML='<h1>Homepage Slideshow</h1><p>Upload and arrange campaign and school activity images for the public homepage.</p><div class="dash-alert"><b>Super Administrator only:</b> You can reorder slides, hide or show them, and set an optional display end date. Uploaded images are saved in this browser and are visible on the homepage when opened in the same browser on this device.</div><div id="slideStorageInfo" class="dash-storage-line">Browser storage used: '+PortalStorage.formatBytes(info.usage)+' · Available: '+PortalStorage.formatBytes(info.available)+'</div><form id="slideForm" class="dash-panel"><div class="dash-form-grid"><div class="dash-field full"><label for="slideTitle">Slide Title</label><input id="slideTitle" required maxlength="100" placeholder="e.g. World Scout Day Celebration"></div><div class="dash-field full"><label for="slideCaption">Short Caption (optional)</label><textarea id="slideCaption" rows="2" maxlength="180" placeholder="Add a short description for the slide"></textarea></div><div class="dash-field"><label for="slideEndDate">Display Until (optional)</label><input id="slideEndDate" type="date"><small class="field-help">The slide is hidden automatically after this date.</small></div><div class="dash-field full"><label for="slideImage">Choose Slideshow Image (JPG, PNG or WebP)</label><input id="slideImage" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" required><small class="field-help">Choose a JPG, PNG or WebP image up to 32 MB.</small></div></div><div id="slideUploadStatus" class="slide-upload-status" role="status" aria-live="polite">Choose an image and select Upload Slide.</div><button class="dash-primary" id="slideUploadButton" type="submit">Upload Slide</button></form><h2>Uploaded Homepage Slides</h2><div id="homepageSlideList" class="slide-admin-grid"></div>';
 document.getElementById("slideForm").addEventListener("submit",uploadHomepageSlide);
 await renderHomepageSlides();
}
async function uploadHomepageSlide(event){
 event.preventDefault();
 if(!isSuper){setSlideUploadStatus("Only the Super Administrator can upload homepage slides.","error");return;}
 const form=document.getElementById("slideForm"),button=document.getElementById("slideUploadButton"),file=document.getElementById("slideImage")?.files?.[0];
 if(!file){setSlideUploadStatus("Please choose an image file first.","error");return;}
 const ext=(file.name.split(".").pop()||"").toLowerCase(),typeByExt={jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",webp:"image/webp"};
 const mime=["image/jpeg","image/png","image/webp"].includes(file.type)?file.type:typeByExt[ext];
 if(!mime){setSlideUploadStatus("Unsupported image format. Please choose a JPG, PNG or WebP image.","error");return;}
 if(!file.size){setSlideUploadStatus("The selected image is empty. Please choose another image.","error");return;}
  if(file.size>32*1024*1024){setSlideUploadStatus("This image is larger than 32 MB. Please choose a smaller image.","error");return;}
 if(button){button.disabled=true;button.textContent="Uploading…";}setSlideUploadStatus("Preparing image and saving it to this browser…","loading");
 try{
  await PortalStorage.init();
  const imageBlob=file.slice(0,file.size,mime);
  if(typeof createImageBitmap==="function"){
   const bitmap=await createImageBitmap(imageBlob);
   if(!bitmap.width||!bitmap.height){bitmap.close();throw new Error("The selected image has no readable dimensions.");}
   bitmap.close();
  }
  await PortalStorage.requestPersistentStorage();
  const title=document.getElementById("slideTitle").value.trim();
  if(!title)throw new Error("Please enter a title for this slide.");
  const existing=await orderedHomepageSlides(),nextOrder=existing.reduce((max,x)=>Math.max(max,Number(x.order)||0),0)+1;
  const id="slide-"+Date.now();
  const record={id,title,caption:document.getElementById("slideCaption").value.trim(),altText:title,imageBlob,mediaType:mime,status:"Published",uploadedBy:actor,createdAt:new Date().toISOString(),archived:false,order:nextOrder,displayUntil:document.getElementById("slideEndDate").value};
  await PortalStorage.saveSlide(record);
  const saved=(await PortalStorage.allSlides()).find(x=>x.id===id);
  if(!saved||!(saved.imageBlob instanceof Blob))throw new Error("The browser did not confirm that the image was saved. Check available browser storage and try again.");
  logAction("Uploaded homepage slide",title);
  form.reset();await renderHomepageSlides();
  const info=await PortalStorage.estimate();
  document.getElementById("slideStorageInfo").textContent="Browser storage used: "+PortalStorage.formatBytes(info.usage)+" · Available: "+PortalStorage.formatBytes(info.available);
  setSlideUploadStatus("✓ "+title+" was uploaded and saved. Refresh the homepage to see the new slide.","success");
 }catch(error){
  console.error("Homepage slideshow upload failed.",error);
  setSlideUploadStatus("Upload failed: "+(error?.message||"The browser could not save this image.")+" Try a JPG, PNG or WebP file under 32 MB.","error");
 }finally{
  if(button){button.disabled=false;button.textContent="Upload Slide";}
 }
}
async function renderHomepageSlides(){
 const root=document.getElementById("homepageSlideList");if(!root)return;
 const slides=await orderedHomepageSlides();
 if(!slides.length){root.innerHTML='<div class="dash-empty">No custom homepage slides have been uploaded yet. The built-in slides will continue to appear.</div>';return;}
 root.innerHTML=slides.map((x,i)=>{const src=URL.createObjectURL(x.imageBlob),visible=x.status==="Published",end=x.displayUntil||"";return '<article class="slide-admin-card"><img src="'+src+'" alt="'+esc(x.altText||x.title)+'"><div><b>'+esc(x.title)+'</b><p>'+esc(x.caption||"No caption")+'</p><span class="dash-tag '+(visible?"published":"")+'">'+(visible?"Visible":"Hidden")+'</span><small class="slide-end-label">Display until: '+esc(end||"No end date")+'</small><div class="slide-admin-actions"><button class="dash-secondary" type="button" data-slide-move="up" data-slide-id="'+esc(x.id)+'" '+(i===0?"disabled":"")+'>Move Up ↑</button><button class="dash-secondary" type="button" data-slide-move="down" data-slide-id="'+esc(x.id)+'" '+(i===slides.length-1?"disabled":"")+'>Move Down ↓</button></div><div class="slide-admin-actions"><button class="dash-secondary" type="button" data-slide-visibility="'+esc(x.id)+'">'+(visible?"Hide Slide":"Show Slide")+'</button><label class="slide-date-edit">End date <input type="date" value="'+esc(end)+'" data-slide-date="'+esc(x.id)+'"></label><button class="dash-secondary" type="button" data-slide-save-date="'+esc(x.id)+'">Save Date</button></div><button class="dash-danger" type="button" data-remove-slide="'+esc(x.id)+'">Remove from Slideshow</button></div></article>';}).join("");
 root.querySelectorAll("[data-slide-move]").forEach(button=>button.addEventListener("click",async()=>{
  const list=await orderedHomepageSlides(),index=list.findIndex(x=>x.id===button.dataset.slideId),target=index+(button.dataset.slideMove==="up"?-1:1);
  if(index<0||target<0||target>=list.length)return;
  const currentOrder=list[index].order;list[index].order=list[target].order;list[target].order=currentOrder;
  await PortalStorage.saveSlide(list[index]);await PortalStorage.saveSlide(list[target]);logAction("Reordered homepage slide",list[index].title);await renderHomepageSlides();
 }));
 root.querySelectorAll("[data-slide-visibility]").forEach(button=>button.addEventListener("click",async()=>{
  const list=await PortalStorage.allSlides(),item=list.find(x=>x.id===button.dataset.slideVisibility);if(!item)return;
  item.status=item.status==="Published"?"Hidden":"Published";await PortalStorage.saveSlide(item);logAction(item.status+" homepage slide",item.title);await renderHomepageSlides();
 }));
 root.querySelectorAll("[data-slide-save-date]").forEach(button=>button.addEventListener("click",async()=>{
  const list=await PortalStorage.allSlides(),item=list.find(x=>x.id===button.dataset.slideSaveDate),field=root.querySelector('[data-slide-date="'+button.dataset.slideSaveDate+'"]');if(!item||!field)return;
  item.displayUntil=field.value;await PortalStorage.saveSlide(item);logAction("Updated slide display end date",item.title);await renderHomepageSlides();
 }));
 root.querySelectorAll("[data-remove-slide]").forEach(button=>button.addEventListener("click",async()=>{
  if(!confirm("Remove this image from the homepage slideshow?"))return;
  await PortalStorage.removeSlide(button.dataset.removeSlide);logAction("Removed homepage slide",button.dataset.removeSlide);await renderHomepageSlides();
 }));
}


/* Announcement media is stored in IndexedDB rather than localStorage. */
const ANNOUNCEMENT_MEDIA_DB="kvs_oyms_announcement_media_v1";
function announcementMediaDb(){return new Promise((resolve,reject)=>{const q=indexedDB.open(ANNOUNCEMENT_MEDIA_DB,1);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains("media"))q.result.createObjectStore("media");};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error||new Error("Could not open media storage."));});}
async function saveAnnouncementMedia(file){const db=await announcementMediaDb(),id="announcement-media-"+Date.now();await new Promise((resolve,reject)=>{const tx=db.transaction("media","readwrite");tx.objectStore("media").put(file,id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error("Could not save media."));});db.close();return id;}
async function getAnnouncementMedia(id){const db=await announcementMediaDb(),value=await new Promise((resolve,reject)=>{const q=db.transaction("media","readonly").objectStore("media").get(id);q.onsuccess=()=>resolve(q.result||null);q.onerror=()=>reject(q.error);});db.close();return value;}
async function showAnnouncementMedia(id,type,root){if(!root)return;try{const blob=await getAnnouncementMedia(id);if(!blob){root.textContent="Attached media is unavailable in this browser.";return;}const url=URL.createObjectURL(blob),el=document.createElement(String(type||blob.type).startsWith("video/")?"video":"img");el.src=url;if(el.tagName==="VIDEO"){el.controls=true;el.playsInline=true;el.preload="metadata";el.style.maxWidth="100%";el.style.maxHeight="min(42vh,320px)";}else{el.alt="Announcement image";el.style.maxWidth="100%";el.style.maxHeight="min(42vh,320px)";el.style.width="auto";el.style.height="auto";el.style.objectFit="contain";}root.replaceChildren(el);}catch(e){root.textContent="Could not load attached media.";}}
function checkAnnouncementVideoDuration(file){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),v=document.createElement("video");v.preload="metadata";v.onloadedmetadata=()=>{URL.revokeObjectURL(url);resolve(v.duration);};v.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("Could not read this video file."));};v.src=url;});}
/* Instant announcement preview: browser-local demo only until shared storage is connected. */
const ANNOUNCEMENT_KEY="kvs_oyms_demo_instant_announcement_v1";
const ANNOUNCEMENT_SEEN_KEY="kvs_oyms_demo_instant_announcement_seen_v1";
let announcementTicker=null;
let announcementNoticeShownFor="";
function getInstantAnnouncement(){return readLocal(ANNOUNCEMENT_KEY,null);}
function setInstantAnnouncement(item){writeLocal(ANNOUNCEMENT_KEY,item);}
function updateAnnouncementStatus(item){
 if(!item)return null;
 const now=Date.now();
 if(item.status==="Scheduled"&&now>=Number(item.publishAt||0)){
  item.status="Published";item.publishedAt=new Date().toISOString();setInstantAnnouncement(item);
 }
 if(item.status==="Published"&&Number(item.endAt||0)>0&&now>=Number(item.endAt)){
  item.status="Expired";item.expiredAt=new Date().toISOString();setInstantAnnouncement(item);
 }
 return item;
}
function announcementSeenIds(){return readLocal(ANNOUNCEMENT_SEEN_KEY,{});}
function announcementSeenKey(item){return String(item?.id||"")+"::"+String(session?.loginId||roleSlug||"user");}
function hasSeenAnnouncement(item){return Boolean(announcementSeenIds()[announcementSeenKey(item)]);}
function markAnnouncementSeen(item){
 const seen=announcementSeenIds();seen[announcementSeenKey(item)]=new Date().toISOString();writeLocal(ANNOUNCEMENT_SEEN_KEY,seen);
}
function instantAnnouncementAdmin(){
 const item=updateAnnouncementStatus(getInstantAnnouncement());
 main.innerHTML='<h1>Send Instant Pop Up</h1><p>Create a short announcement for portal users. The announcement appears after the countdown you choose.</p>'+
 '<div class="dash-alert"><b>Demo preview limitation:</b> This version saves announcements in this browser only. It will work for testing on this same browser/device. To deliver announcements to users on different devices, shared database storage must be connected later.</div>'+
 '<form id="instantAnnouncementForm" class="dash-panel"><div class="dash-form-grid">'+
 '<div class="dash-field full"><label for="instantAnnouncementTitle">Subject / Title</label><input id="instantAnnouncementTitle" maxlength="100" required placeholder="e.g. Important SANKALP 2.0 Update"></div>'+
 '<div class="dash-field full"><label for="instantAnnouncementDescription">Description</label><textarea id="instantAnnouncementDescription" rows="5" maxlength="1200" required placeholder="Write the update that portal users should read"></textarea></div>'+
 '<div class="dash-field full"><label for="instantAnnouncementMedia">Image or video (optional)</label><input id="instantAnnouncementMedia" type="file" accept="image/*,video/mp4,video/webm,video/quicktime"><small class="field-help">Image: auto-fits the popup and shows for 10 seconds. Video: auto-fits and the popup timer matches the video length (maximum 30 seconds). File limit: 80 MB.</small><div id="instantAnnouncementMediaPreview" class="instant-media-preview"></div></div>'+
 '<div class="dash-field"><label>Launch countdown</label><input value="30 seconds" readonly><small class="field-help">The website will be hidden during this countdown. After launch, each visitor sees the announcement for 10 seconds until its end date.</small></div>'+'<div class="dash-field"><label for="instantAnnouncementEndDate">Announcement end date and time</label><input id="instantAnnouncementEndDate" type="datetime-local" required><small class="field-help">New visitors will continue seeing this announcement until this date and time.</small></div>'+
 '</div><div id="instantAnnouncementStatus" class="instant-announcement-status" role="status" aria-live="polite">Ready to create an announcement.</div><button class="dash-primary" id="sendInstantAnnouncement" type="submit">Send Announcement</button></form>'+
 '<section class="dash-panel instant-current"><h2>Current Announcement</h2><div id="instantAnnouncementCurrent"></div></section>';
 const form=document.getElementById("instantAnnouncementForm");
 document.getElementById("instantAnnouncementMedia").addEventListener("change",async e=>{const f=e.target.files?.[0],p=document.getElementById("instantAnnouncementMediaPreview");if(!p)return;p.innerHTML="";if(!f)return;if(f.size>80*1024*1024){e.target.value="";alert("Media must be 80 MB or smaller.");return;}if(f.type.startsWith("video/")){try{if(await checkAnnouncementVideoDuration(f)>30.25){e.target.value="";alert("Video must be 30 seconds or shorter.");return;}}catch(err){e.target.value="";alert(err.message);return;}}const u=URL.createObjectURL(f),el=document.createElement(f.type.startsWith("video/")?"video":"img");el.src=u;if(el.tagName==="VIDEO"){el.controls=true;el.playsInline=true;}else el.alt="Announcement preview";p.appendChild(el);});
 form.addEventListener("submit",e=>{
  e.preventDefault();
  const title=document.getElementById("instantAnnouncementTitle").value.trim();
  const description=document.getElementById("instantAnnouncementDescription").value.trim();
  const endDateValue=document.getElementById("instantAnnouncementEndDate").value;
  const mediaFile=document.getElementById("instantAnnouncementMedia")?.files?.[0]||null;
  if(!title||!description||!endDateValue){alert("Please enter the subject, description and announcement end date.");return;}
  const endAt=new Date(endDateValue).getTime();
  if(!Number.isFinite(endAt)||endAt<=Date.now()+30000){alert("Choose an end date and time at least 30 seconds after launch.");return;}
  (async()=>{try{
   if(mediaFile&&mediaFile.size>80*1024*1024)throw new Error("Media must be 80 MB or smaller.");
   if(mediaFile&&!mediaFile.type.startsWith("image/")&&!mediaFile.type.startsWith("video/"))throw new Error("Choose an image or video file.");
   let videoDuration=0;
   if(mediaFile&&mediaFile.type.startsWith("video/")){videoDuration=await checkAnnouncementVideoDuration(mediaFile);if(videoDuration>30.25)throw new Error("Video must be 30 seconds or shorter.");}
   const popupDurationMs=mediaFile&&mediaFile.type.startsWith("video/")?Math.min(120000,Math.max(10000,Math.ceil(videoDuration*1000))):10000;
   const now=Date.now(),next={id:"announcement-"+now,title,description,delaySeconds:30,createdAt:new Date(now).toISOString(),publishAt:now+30000,endAt,status:"Scheduled",createdBy:actor,popupDurationMs,videoDuration};
   if(mediaFile){next.mediaId=await saveAnnouncementMedia(mediaFile);next.mediaType=mediaFile.type;}
   setInstantAnnouncement(next);
   writeLocal("kvs_oyms_demo_launch_event_v1",{id:next.id,title,description,mediaId:next.mediaId||"",mediaType:next.mediaType||"",startedAt:now,countdownEndsAt:now+30000,announcementEndsAt:endAt,popupDurationMs});
   logAction("Launched instant announcement",title);
   form.reset();document.getElementById("instantAnnouncementMediaPreview").innerHTML="";
   window.location.href="../../index.html";
  }catch(err){document.getElementById("instantAnnouncementStatus").textContent="Could not launch: "+(err.message||"Please try another file.");}})();
 });
 renderInstantAnnouncementCurrent();
 if(item?.status==="Scheduled")startAnnouncementAdminTicker();
}
function renderInstantAnnouncementCurrent(){
 const root=document.getElementById("instantAnnouncementCurrent");if(!root)return;
 const item=updateAnnouncementStatus(getInstantAnnouncement());
 if(!item){root.innerHTML='<p class="dash-empty">No announcement has been created yet.</p>';return;}
 const remaining=Math.max(0,Math.ceil((Number(item.publishAt||0)-Date.now())/1000));
 const status=item.status==="Scheduled"?"Publishing in "+remaining+" seconds":item.status==="Expired"?"Expired":"Published";
 root.innerHTML='<div class="instant-current-card"><span class="dash-tag '+(item.status==="Published"?"published":"")+'">'+esc(status)+'</span><h3>'+esc(item.title)+'</h3><p>'+esc(item.description).replace(/\n/g,"<br>")+'</p><div id="instantCurrentMedia"></div><small>Created: '+esc(new Date(item.createdAt).toLocaleString())+'</small></div>';if(item.mediaId)showAnnouncementMedia(item.mediaId,item.mediaType,document.getElementById("instantCurrentMedia"));
}
function startAnnouncementAdminTicker(){
 if(announcementTicker)clearInterval(announcementTicker);
 announcementTicker=setInterval(()=>{
  const item=updateAnnouncementStatus(getInstantAnnouncement());
  const status=document.getElementById("instantAnnouncementStatus");
  if(!item||item.status==="Published"){
   if(status)status.textContent="✓ Announcement is now published. Users will see a Tap to view update notice when they open their dashboard.";
   renderInstantAnnouncementCurrent();clearInterval(announcementTicker);announcementTicker=null;return;
  }
  if(status)status.textContent="Publishing in "+Math.max(0,Math.ceil((item.publishAt-Date.now())/1000))+" seconds…";
  renderInstantAnnouncementCurrent();
 },250);
}
function checkForUserAnnouncement(){
 if(isSuper)return;
 const launchEvent=readLocal("kvs_oyms_demo_launch_event_v1",null);
 if(launchEvent&&launchEvent.id===getInstantAnnouncement()?.id&&Date.now()<Number(launchEvent.announcementEndsAt||launchEvent.endAt||0))return;
 const item=updateAnnouncementStatus(getInstantAnnouncement());
 if(!item||item.status!=="Published"||hasSeenAnnouncement(item)||announcementNoticeShownFor===item.id)return;
 announcementNoticeShownFor=item.id;
 let notice=document.getElementById("instantAnnouncementNotice");
 if(!notice){
  notice=document.createElement("button");notice.type="button";notice.id="instantAnnouncementNotice";notice.className="instant-announcement-notice";
  const shell=document.querySelector(".dash-shell");
  if(shell)shell.parentNode.insertBefore(notice,shell);
 }
 notice.innerHTML='<span class="instant-notice-icon">✦</span><span><b>New update available</b><small>'+esc(item.title)+'</small></span><strong>Tap to view →</strong>';
 notice.onclick=()=>openInstantAnnouncement(item);
}
async function openInstantAnnouncement(item){
 if(!item)return;
 const overlay=document.createElement("div");overlay.className="instant-announcement-overlay";overlay.id="instantAnnouncementOverlay";
 overlay.innerHTML='<section class="instant-announcement-modal" role="dialog" aria-modal="true" aria-labelledby="instantAnnouncementModalTitle"><button type="button" class="instant-announcement-close" aria-label="Close announcement">×</button><div class="instant-announcement-spark">✦</div><p class="instant-announcement-kicker">SANKALP 2.0 · PORTAL UPDATE</p><h2 id="instantAnnouncementModalTitle">'+esc(item.title)+'</h2><div class="instant-announcement-copy">'+esc(item.description).replace(/\n/g,"<br>")+'</div><div class="instant-announcement-media" id="instantAnnouncementModalMedia"></div><button type="button" class="dash-primary instant-announcement-done">Got it</button></section>';
 document.body.appendChild(overlay);if(item.mediaId)await showAnnouncementMedia(item.mediaId,item.mediaType,overlay.querySelector("#instantAnnouncementModalMedia"));
 const close=()=>{markAnnouncementSeen(item);overlay.remove();document.getElementById("instantAnnouncementNotice")?.remove();launchAnnouncementConfetti();};
 overlay.querySelector(".instant-announcement-close").addEventListener("click",close);
 overlay.querySelector(".instant-announcement-done").addEventListener("click",close);
 overlay.addEventListener("click",e=>{if(e.target===overlay)close();});
 launchAnnouncementConfetti();
}
function launchAnnouncementConfetti(){
 const colors=["#e7b94d","#7c3aed","#16a34a","#ec4899","#2563eb"];
 for(let i=0;i<42;i++){
  const bit=document.createElement("i");bit.className="instant-confetti";
  bit.style.left=(Math.random()*100)+"%";bit.style.background=colors[i%colors.length];
  bit.style.animationDelay=(Math.random()*.7)+"s";bit.style.setProperty("--fall",(65+Math.random()*55)+"vh");
  document.body.appendChild(bit);setTimeout(()=>bit.remove(),2400);
 }
}
window.addEventListener("storage",e=>{if(e.key===ANNOUNCEMENT_KEY)checkForUserAnnouncement();});
window.addEventListener("focus",checkForUserAnnouncement);


PortalStorage.init().then(()=>{showView(role==="Administrator"?"users":"overview");checkForUserAnnouncement();}).catch(error=>{main.innerHTML='<div class="dash-alert">Browser file storage could not be opened. '+esc(error.message)+'</div>';showView((isSuper||role==="Administrator")?"users":"overview");checkForUserAnnouncement();});