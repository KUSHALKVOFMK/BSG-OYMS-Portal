/* SANKALP 2.0 — scoped account management preview.
   Passwords are never stored or displayed. Supabase Auth + RLS will enforce this hierarchy later. */
(function(){
 "use strict";
 const KEY="sankalp20_scoped_accounts_demo_v1";
 const nav=document.getElementById("dashNav"),main=document.getElementById("dashMain");
 let session=null;try{session=JSON.parse(sessionStorage.getItem("kvs_oyms_demo_session")||"null");}catch{}
 const actorRole=session?.role||"";
 const isSuper=actorRole==="Super Administrator";
 const isAdmin=actorRole==="Administrator";
 if(!nav||!main||!session?.demo||(!isSuper&&!isAdmin))return;
 const roles=isSuper?["Administrator"]:["Unit Leader","Assistant Unit Leader","Patrol Leader","Assistant Patrol Leader","Member"];
 const prefixes={"Administrator":"ADMIN","Unit Leader":"UNIT","Assistant Unit Leader":"AUNIT","Patrol Leader":"PATROL","Assistant Patrol Leader":"APATROL","Member":"MEMBER"};
 let search="";
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const read=()=>{try{const d=JSON.parse(localStorage.getItem(KEY)||"null");if(d&&Array.isArray(d.accounts))return d;}catch{}return{accounts:[],counters:{}};};
 const save=d=>{try{localStorage.setItem(KEY,JSON.stringify(d));}catch{}};
 const allowed=a=>a&&roles.includes(a.role);
 const nextId=(d,role)=>{const p=prefixes[role]||"USER";d.counters[role]=(Number(d.counters[role])||0)+1;return "DEMO-"+p+"-"+String(d.counters[role]).padStart(4,"0");};
 function openModal(title,body,after){
  const root=document.getElementById("sankalpAccountModal");root.innerHTML='<div class="um-modal-backdrop" data-backdrop><section class="um-modal" role="dialog" aria-modal="true"><div class="um-modal-head"><h2>'+esc(title)+'</h2><button type="button" class="um-modal-x" data-close>×</button></div><div class="um-modal-body">'+body+'</div></section></div>';
  root.querySelector("[data-close]").onclick=()=>root.innerHTML="";
  root.querySelector("[data-backdrop]").onclick=e=>{if(e.target.matches("[data-backdrop]"))root.innerHTML="";};
  if(after)after(root);
 }
 function render(){
  const d=read(),list=d.accounts.filter(allowed).filter(a=>!search||[a.name,a.loginId,a.role].join(" ").toLowerCase().includes(search.toLowerCase()));
  const all=d.accounts.filter(allowed),active=all.filter(a=>a.status==="Active").length;
  main.innerHTML='<div class="um-page-head"><div><span class="um-eyebrow">'+(isSuper?"SUPER ADMINISTRATOR":"ADMINISTRATOR")+' · ACCOUNT CONTROL</span><h1>'+(isSuper?"Admin Account Management":"User Account Management")+'</h1><p>'+(isSuper?"Create and manage Administrator login IDs only.":"Create and manage Unit Leader, Assistant Unit Leader, Patrol Leader, Assistant Patrol Leader and Member login IDs.")+'</p></div><span class="um-demo-label">DEMO PREVIEW</span></div>'+
   '<div class="um-demo-notice"><strong>Preview only:</strong> This browser can create sample Login IDs, but cannot activate real sign-in or send passwords. Passwords are never shown. Supabase Auth will securely issue/reset passwords after database integration.</div>'+
   '<div class="um-stat-grid"><article class="um-stat-card"><span>Managed accounts</span><strong>'+all.length+'</strong><small>Only accounts in your permitted scope</small></article><article class="um-stat-card"><span>Active</span><strong>'+active+'</strong><small>Active demo records</small></article><article class="um-stat-card"><span>Available roles</span><strong>'+roles.length+'</strong><small>Within your permission level</small></article></div>'+
   '<section class="um-panel"><div class="um-section-head"><div><h2>'+(isSuper?"Administrator Accounts":"Other Portal Users")+'</h2><p>Only accounts you are allowed to manage are listed.</p></div><button class="um-primary" id="sankalpCreate">＋ '+(isSuper?"Create Admin":"Create User")+'</button></div>'+
   '<label class="um-search"><span class="sr-only">Search accounts</span><input id="sankalpSearch" type="search" placeholder="Search Login ID or name…" value="'+esc(search)+'"></label>'+
   '<div class="um-table-wrap"><table class="um-table"><thead><tr><th>Login ID</th><th>Name</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+
   (list.length?list.map(a=>'<tr><td><strong>'+esc(a.loginId)+'</strong></td><td>'+esc(a.name)+'</td><td>'+esc(a.role)+'</td><td><span class="um-pill '+(a.status==="Active"?"um-good":"um-warn")+'">'+esc(a.status)+'</span></td><td><div class="um-row-actions"><button data-edit="'+esc(a.id)+'">Edit</button><button data-reset="'+esc(a.id)+'">Reset Password</button><button data-toggle="'+esc(a.id)+'">'+(a.status==="Active"?"Suspend":"Activate")+'</button></div></td></tr>').join(""):'<tr><td colspan="5" class="um-empty">No accounts yet. Use Create '+(isSuper?"Admin":"User")+' to add the first demo account.</td></tr>')+
   '</tbody></table></div><p class="um-modal-intro">'+(isSuper?"Super Admin can manage Administrator accounts only. Admins manage other role accounts.":"Administrator cannot view or change Super Admin or other Administrator accounts.")+'</p></section><div id="sankalpAccountModal"></div>';
  document.getElementById("sankalpSearch").addEventListener("input",e=>{search=e.target.value;const p=e.target.selectionStart;render();const x=document.getElementById("sankalpSearch");x.focus();x.setSelectionRange(p,p);});
  document.getElementById("sankalpCreate").onclick=create;
  main.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>edit(b.dataset.edit));
  main.querySelectorAll("[data-reset]").forEach(b=>b.onclick=()=>reset(b.dataset.reset));
  main.querySelectorAll("[data-toggle]").forEach(b=>b.onclick=()=>toggle(b.dataset.toggle));
 }
 function create(){
  const options=roles.map(r=>'<option value="'+esc(r)+'">'+esc(r)+'</option>').join("");
  openModal(isSuper?"Create Administrator":"Create Portal User",'<form id="sankalpCreateForm" class="um-form-grid"><label class="um-field um-full"><span>Full name</span><input name="name" required maxlength="80"></label>'+
   (isSuper?'<input type="hidden" name="role" value="Administrator">':'<label class="um-field um-full"><span>Role</span><select name="role" required>'+options+'</select></label>')+
   '<div class="um-modal-foot um-full"><button type="submit" class="um-primary">Create Login ID</button></div></form>',root=>{
    root.querySelector("form").onsubmit=e=>{e.preventDefault();const fd=new FormData(e.currentTarget),role=String(fd.get("role")),name=String(fd.get("name")||"").trim();if(!roles.includes(role)||!name)return;const d=read(),id=nextId(d,role);d.accounts.push({id,loginId:id,name,role,status:"Active",createdAt:new Date().toISOString(),createdBy:actorRole});save(d);root.innerHTML='<div class="um-empty-state"><strong>Demo Login ID created: '+esc(id)+'</strong><p>No password is generated or displayed in this preview. Secure password setup will be handled by Supabase Auth later.</p><button class="um-primary" id="done">Done</button></div>';root.querySelector("#done").onclick=render;};
   });
 }
 function find(id){const d=read(),a=d.accounts.find(x=>x.id===id&&allowed(x));return a?{d,a}:null;}
 function edit(id){const found=find(id);if(!found)return;const {d,a}=found;
  openModal("Edit Account",'<form id="sankalpEdit" class="um-form-grid"><label class="um-field um-full"><span>Login ID</span><input value="'+esc(a.loginId)+'" disabled></label><label class="um-field um-full"><span>Full name</span><input name="name" value="'+esc(a.name)+'" required maxlength="80"></label><div class="um-modal-foot um-full"><button class="um-primary" type="submit">Save</button></div></form>',root=>{root.querySelector("form").onsubmit=e=>{e.preventDefault();a.name=String(new FormData(e.currentTarget).get("name")).trim();a.updatedAt=new Date().toISOString();save(d);render();};});
 }
 function reset(id){const f=find(id);if(!f)return;if(!confirm("Record a password reset request for "+f.a.loginId+"? The password will not be revealed."))return;f.a.passwordResetRequestedAt=new Date().toISOString();save(f.d);alert("Password reset request recorded in this demo. No password was displayed or emailed.");render();}
 function toggle(id){const f=find(id);if(!f)return;f.a.status=f.a.status==="Active"?"Suspended":"Active";f.a.updatedAt=new Date().toISOString();save(f.d);render();}
 if(!nav.querySelector('[data-view="users"]')){const b=document.createElement("button");b.type="button";b.className="um-nav-button";b.textContent="User Management";b.dataset.accountManager="true";b.onclick=render;
 const overview=nav.querySelector('[data-view="overview"]');if(overview&&overview.nextSibling)nav.insertBefore(b,overview.nextSibling);else nav.appendChild(b);}
 window.OYMSUserManagementDemo={open:render};
})();