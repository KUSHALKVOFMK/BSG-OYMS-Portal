/* OYMS Sankalp 2.0 — Super Admin User Management demo.
   Browser-only preview. Replace the data adapter with Supabase later; retain this UI/workflow. */
(function () {
  "use strict";
  const KEY = "oyms_sankalp_2_user_management_demo_v1";
  const ROLES = ["Super Administrator", "Administrator", "Unit Leader", "Patrol Leader", "Patrol Member"];
  const SUPER_ID = "DEMO-SUPER-001";
  const nav = document.getElementById("dashNav");
  const main = document.getElementById("dashMain");
  let memory = null, roleFilter = "All", query = "";
  let session = null;
  try { session = JSON.parse(sessionStorage.getItem("kvs_oyms_demo_session") || "null"); } catch (e) {}
  if (!nav || !main || !session || session.role !== "Super Administrator" || !session.demo) return;

  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function now() { return new Date().toISOString(); }
  function initial() {
    const stamp = now();
    return {
      accounts: [{
        id: SUPER_ID, name: "Demo Super Administrator", loginId: SUPER_ID,
        bsgUid: "", role: "Super Administrator", unit: "PM SHRI KV OF Medak",
        memberType: "", patrol: "", dob: "", email: "", phone: "",
        status: "Active", profileStatus: "Verified", profileCompletion: 35,
        createdAt: stamp, lastLogin: stamp, protected: true,
        history: [{at:stamp,action:"Demo account initialised",by:"System"}]
      }],
      logs: [{at:stamp,action:"Demo User Management initialised",accountId:SUPER_ID,by:"System"}],
      nextAdmin: 1
    };
  }
  function read() {
    try {
      const value = localStorage.getItem(KEY);
      if (value) {
        const parsed = JSON.parse(value);
        if (parsed && Array.isArray(parsed.accounts) && Array.isArray(parsed.logs)) return parsed;
      }
    } catch (e) {}
    if (!memory) memory = initial();
    write(memory);
    return memory;
  }
  function write(data) {
    memory = data;
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch (e) { console.warn("Temporary in-memory demo storage is active.", e); }
  }
  function record(data, action, account) {
    const entry = {at:now(),action:action,accountId:account ? account.id : "",by:session.name || "Demo Super Administrator"};
    data.logs.unshift(entry);
    if (account) {
      account.history = account.history || [];
      account.history.unshift({at:entry.at,action:action,by:entry.by});
    }
    data.logs = data.logs.slice(0,500);
  }
  function dateText(value) {
    if (!value) return "Not provided";
    const date = new Date(value);
    return isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
  }
  function pill(value) {
    const cls = value === "Active" || value === "Verified" ? "good" : value === "Suspended" || value === "Correction Requested" ? "warn" : "pending";
    return '<span class="um-pill um-' + cls + '">' + esc(value || "Pending") + '</span>';
  }
  function setNav() {
    nav.querySelectorAll("button").forEach(function (b) { b.classList.remove("active"); });
    const button = nav.querySelector('[data-um-view="users"]');
    if (button) button.classList.add("active");
  }
  function render() {
    setNav();
    const data = read(), accounts = data.accounts;
    const active = accounts.filter(a => a.status === "Active").length;
    const pending = accounts.filter(a => a.profileStatus === "Pending" || a.profileStatus === "Correction Requested").length;
    const suspended = accounts.filter(a => a.status === "Suspended").length;
    const filtered = accounts.filter(function (a) {
      const roleOk = roleFilter === "All" || a.role === roleFilter;
      const q = query.trim().toLowerCase();
      const text = [a.name,a.loginId,a.role,a.unit,a.bsgUid].join(" ").toLowerCase();
      return roleOk && (!q || text.indexOf(q) !== -1);
    });
    const roleNames = ["Super Admin","Admins","Unit Leaders","Patrol Leaders","Patrol Members"];
    const roleCards = ROLES.map(function (role, i) {
      const count = accounts.filter(a => a.role === role).length;
      return '<button class="um-role-card ' + (roleFilter === role ? "selected" : "") + '" data-role-filter="' + esc(role) + '"><span>' + roleNames[i] + '</span><strong>' + count + '</strong></button>';
    }).join("");
    const rows = filtered.map(function (a) {
      return '<tr><td><strong>' + esc(a.name || "Name not provided") + '</strong><small>' + esc(a.loginId) + '</small></td>' +
        '<td>' + esc(a.role) + '</td><td>' + esc(a.unit || "—") + '</td><td>' + pill(a.status) + '</td><td>' + pill(a.profileStatus) + '</td>' +
        '<td><div class="um-row-actions"><button data-action="view" data-id="' + esc(a.id) + '">View Profile</button><button data-action="edit" data-id="' + esc(a.id) + '">Edit Account</button><button data-action="history" data-id="' + esc(a.id) + '">History</button>' +
        (a.protected ? "" : '<button data-action="' + (a.status === "Suspended" ? "activate" : "suspend") + '" data-id="' + esc(a.id) + '">' + (a.status === "Suspended" ? "Activate" : "Suspend") + '</button>') +
        '<button data-action="reset" data-id="' + esc(a.id) + '">Reset Password</button></div></td></tr>';
    }).join("");
    main.innerHTML =
      '<div class="um-page-head"><div><span class="um-eyebrow">SUPER ADMINISTRATOR CONSOLE</span><h1>User Management</h1><p>Manage all role accounts, profile reviews and account history.</p></div><span class="um-demo-label">DEMO PREVIEW</span></div>' +
      '<div class="um-demo-notice"><strong>Demo mode:</strong> Changes are saved in this browser only. No real accounts, emails, password resets or cross-device updates are performed. Use sample information only.</div>' +
      '<div class="um-stat-grid"><article class="um-stat-card"><span>Total Accounts</span><strong>' + accounts.length + '</strong><small>Includes the one protected Super Admin</small></article>' +
      '<article class="um-stat-card"><span>Active Accounts</span><strong>' + active + '</strong><small>Active in this demo</small></article>' +
      '<article class="um-stat-card"><span>Pending Profiles</span><strong>' + pending + '</strong><small>Awaiting review or correction</small></article>' +
      '<article class="um-stat-card"><span>Suspended Accounts</span><strong>' + suspended + '</strong><small>Temporarily restricted</small></article></div>' +
      '<section class="um-panel"><div class="um-section-head"><div><h2>Account Categories</h2><p>Select a role to filter the directory.</p></div><button class="um-primary" id="umCreateAdmin">＋ Create Admin</button></div>' +
      '<div class="um-role-grid"><button class="um-role-card ' + (roleFilter === "All" ? "selected" : "") + '" data-role-filter="All"><span>All accounts</span><strong>' + accounts.length + '</strong></button>' + roleCards + '</div></section>' +
      '<section class="um-panel"><div class="um-section-head um-directory-head"><div><h2>Account Directory</h2><p>Search by Login ID, name, role or unit.</p></div><label class="um-search"><span class="sr-only">Search accounts</span><input id="umSearch" type="search" placeholder="Search Login ID or name…" value="' + esc(query) + '"></label></div>' +
      '<div class="um-table-wrap"><table class="um-table"><thead><tr><th>Name / Login ID</th><th>Role</th><th>Unit</th><th>Account Status</th><th>Profile Status</th><th>Actions</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="6" class="um-empty">No accounts match this filter. Create an Admin demo account to test the workflow.</td></tr>') +
      '</tbody></table></div><div class="um-directory-footer"><span>Showing ' + filtered.length + ' of ' + accounts.length + ' accounts</span><button class="um-secondary" id="umApprovals">View Approvals (' + pending + ')</button></div></section>' +
      '<section class="um-panel um-control-panel"><div><h2>Special Controls</h2><p>Actions require confirmation and are recorded in account history.</p></div><div class="um-control-notes"><span>✓ Exactly one protected Super Admin</span><span>✓ Passwords are never displayed</span><span>✓ Approval hierarchy respected</span><span>✓ Administrative changes logged</span></div></section><div id="umModalRoot"></div>';

    document.getElementById("umSearch").addEventListener("input", function (e) { query = e.target.value; const pos = query.length; render(); const input = document.getElementById("umSearch"); input.focus(); input.setSelectionRange(pos,pos); });
    main.querySelectorAll("[data-role-filter]").forEach(function (b) { b.addEventListener("click",function(){roleFilter=b.dataset.roleFilter;render();}); });
    main.querySelectorAll("[data-action]").forEach(function (b) { b.addEventListener("click",function(){action(b.dataset.action,b.dataset.id);}); });
    document.getElementById("umCreateAdmin").addEventListener("click",createAdmin);
    document.getElementById("umApprovals").addEventListener("click",approvals);
  }
  function modal(title, content, callback) {
    const root = document.getElementById("umModalRoot");
    root.innerHTML = '<div class="um-modal-backdrop" data-backdrop><section class="um-modal" role="dialog" aria-modal="true" aria-labelledby="umTitle"><div class="um-modal-head"><h2 id="umTitle">' + esc(title) + '</h2><button type="button" class="um-modal-x" data-close aria-label="Close">×</button></div><div class="um-modal-body">' + content + '</div></section></div>';
    root.querySelector("[data-backdrop]").addEventListener("click",function(e){if(e.target.matches("[data-backdrop]"))root.innerHTML="";});
    root.querySelector("[data-close]").addEventListener("click",function(){root.innerHTML="";});
    if (callback) callback(root);
  }
  function fields(a, editable) {
    const defs = [["name","Full name","text"],["loginId","Login ID","text"],["bsgUid","Official BSG UID","text"],["role","Role","text"],["unit","School / Unit","text"],["memberType","Scout or Guide","text"],["patrol","Patrol","text"],["dob","Date of birth","date"],["email","Registered email","email"],["phone","Contact number","tel"]];
    let html = '<div class="um-profile-grid">';
    defs.forEach(function(d){const locked = !editable || d[0] === "loginId" || d[0] === "role";html += '<label class="um-field"><span>' + d[1] + '</span><input type="' + d[2] + '" value="' + esc(a[d[0]] || "") + '" data-field="' + d[0] + '" ' + (locked ? "disabled" : "") + '></label>';});
    html += '<div class="um-profile-meta"><span>Profile completion</span><strong>' + (Number(a.profileCompletion)||0) + '%</strong><span>Verification status</span><strong>' + esc(a.profileStatus || "Pending") + '</strong><span>Account creation date</span><strong>' + dateText(a.createdAt) + '</strong><span>Last login</span><strong>' + dateText(a.lastLogin) + '</strong></div></div>';
    return html;
  }
  function action(type,id) {
    const data=read(),a=data.accounts.find(x=>x.id===id);if(!a)return;
    if(type==="view") modal("Account Profile",'<div class="um-profile-top"><div class="um-avatar">' + esc((a.name||"U").slice(0,1).toUpperCase()) + '</div><div><strong>' + esc(a.name||"Name not provided") + '</strong><small>' + esc(a.loginId) + ' · ' + esc(a.role) + '</small></div></div>' + fields(a,false) + '<div class="um-modal-foot">' + pill(a.status) + pill(a.profileStatus) + '</div>');
    if(type==="edit") modal("Edit Account",'<p class="um-modal-intro">Role and Login ID are locked. Profile changes are marked for review.</p><form id="umEditForm">' + fields(a,true) + '<div class="um-modal-foot"><button type="button" class="um-secondary" data-close>Cancel</button><button class="um-primary" type="submit">Save Changes</button></div></form>',function(root){
      root.querySelector("[data-close]").addEventListener("click",function(){root.innerHTML="";});
      root.querySelector("#umEditForm").addEventListener("submit",function(e){e.preventDefault();root.querySelectorAll("[data-field]").forEach(function(input){if(!input.disabled)a[input.dataset.field]=input.value.trim();});a.profileStatus="Correction Requested";a.profileCompletion=Math.round(["name","bsgUid","unit","memberType","patrol","dob","email","phone"].filter(k=>!!a[k]).length/8*100);record(data,"Edited permitted account information; profile marked for review",a);write(data);render();});
    });
    if(type==="history"){const list=(a.history||[]).map(x=>'<li><strong>'+esc(x.action)+'</strong><small>'+dateText(x.at)+' · '+esc(x.by||"System")+'</small></li>').join("");modal("Account History",'<p class="um-modal-intro">History is preserved in this browser demo.</p><ol class="um-history">' + (list||"<li>No history recorded.</li>") + '</ol>');}
    if(type==="reset"){if(!confirm("Initiate a demo password-reset request for "+a.loginId+"? No email will be sent."))return;record(data,"Password reset initiated (demo only; no email sent)",a);write(data);modal("Password Reset",'<div class="um-empty-state">A demo reset request was recorded for <strong>'+esc(a.loginId)+'</strong>. No password was displayed, changed or emailed.</div>');}
    if(type==="suspend"||type==="activate"){
      if(a.protected){modal("Protected Super Admin",'<div class="um-empty-state">The single Super Admin account cannot be suspended or deactivated through normal dashboard controls.</div>');return;}
      const next=type==="suspend"?"Suspended":"Active";
      if(!confirm("Are you sure you want to "+type+" "+a.name+"? This action will be recorded."))return;
      a.status=next;record(data,type==="suspend"?"Suspended account":"Activated account",a);write(data);render();
    }
  }
  function createAdmin() {
    modal("Create Admin Account",'<p class="um-modal-intro">Creates a demo Administrator profile with Pending status. The Super Admin must approve it.</p><form id="umCreateForm" class="um-form-grid"><label class="um-field"><span>Full name</span><input name="name" required maxlength="80"></label><label class="um-field"><span>Registered email</span><input name="email" type="email" required></label><label class="um-field"><span>Contact number</span><input name="phone" type="tel"></label><label class="um-field"><span>Official BSG UID</span><input name="bsgUid"></label><label class="um-field um-full"><span>School / Unit</span><input name="unit" value="PM SHRI KV OF Medak" required></label><div class="um-modal-foot um-full"><button type="button" class="um-secondary" data-close>Cancel</button><button class="um-primary" type="submit">Create Demo Admin</button></div></form>',function(root){
      root.querySelector("[data-close]").addEventListener("click",function(){root.innerHTML="";});
      root.querySelector("#umCreateForm").addEventListener("submit",function(e){
        e.preventDefault();const form=new FormData(e.currentTarget),data=read(),num=String(data.nextAdmin++).padStart(3,"0"),id="DEMO-ADMIN-"+num;
        const a={id:id,loginId:id,name:String(form.get("name")||"").trim(),email:String(form.get("email")||"").trim(),phone:String(form.get("phone")||"").trim(),bsgUid:String(form.get("bsgUid")||"").trim(),unit:String(form.get("unit")||"").trim(),role:"Administrator",memberType:"",patrol:"",dob:"",status:"Active",profileStatus:"Pending",profileCompletion:50,createdAt:now(),lastLogin:"",protected:false,history:[]};
        data.accounts.push(a);record(data,"Created Administrator demo account; awaiting profile approval",a);write(data);render();
      });
    });
  }
  function approvals() {
    const data=read(),pending=data.accounts.filter(a=>a.role==="Administrator"&&(a.profileStatus==="Pending"||a.profileStatus==="Correction Requested"));
    const html=pending.length?'<div class="um-approval-list">'+pending.map(a=>'<article><div><strong>'+esc(a.name)+'</strong><small>'+esc(a.loginId)+' · '+esc(a.unit)+'</small>'+pill(a.profileStatus)+'</div><div class="um-row-actions"><button data-approve="yes" data-id="'+esc(a.id)+'">Approve</button><button data-approve="unlock" data-id="'+esc(a.id)+'">Unlock for correction</button></div></article>').join("")+'</div>':'<div class="um-empty-state">No Admin profiles are waiting for approval.</div>';
    modal("Profile Approvals",'<p class="um-modal-intro">Approval hierarchy: Super Admin reviews Admins. Other roles are reviewed by their designated next-level approver.</p>'+html,function(root){
      root.querySelectorAll("[data-approve]").forEach(function(b){b.addEventListener("click",function(){const store=read(),a=store.accounts.find(x=>x.id===b.dataset.id);if(!a)return;a.profileStatus=b.dataset.approve==="yes"?"Verified":"Correction Requested";record(store,b.dataset.approve==="yes"?"Approved Admin profile":"Unlocked Admin profile for correction",a);write(store);render();approvals();});});
    });
  }
  const button=document.createElement("button");
  button.type="button";button.dataset.umView="users";button.className="um-nav-button";button.textContent="User Management";
  button.addEventListener("click",render);
  const overview=nav.querySelector('[data-view="overview"]');
  if(overview&&overview.nextSibling)nav.insertBefore(button,overview.nextSibling);else nav.appendChild(button);
  window.OYMSUserManagementDemo={open:render,exportPreviewData:function(){return JSON.parse(JSON.stringify(read()));}};
})();