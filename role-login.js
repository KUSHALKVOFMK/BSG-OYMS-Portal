const form=document.getElementById("loginForm");
const message=document.getElementById("authMessage");
const slug=form.dataset.role;
const roleNames={"super-admin":"Super Administrator","administrator":"Administrator","unit-leader":"Unit Leader","assistant-unit-leader":"Assistant Unit Leader","patrol-leader":"Patrol Leader","assistant-patrol-leader":"Assistant Patrol Leader","member":"Member"};
const role=roleNames[slug];
function showMessage(text){message.textContent=text;message.style.display="block";}
document.getElementById("forgot").addEventListener("click",()=>showMessage("Secure password recovery will be available after the database and email service are connected. This preview does not send reset emails."));
form.addEventListener("submit",event=>{
 event.preventDefault();
 const id=document.getElementById("loginId").value.trim();
 const password=document.getElementById("password").value;
 let account=null;
 try{const rows=JSON.parse(localStorage.getItem("kvs_oyms_demo_accounts_v2")||"[]");account=rows.find(x=>x.id===id);}catch{}
 if(account&&account.status==="Frozen"){showMessage("This preview account is currently frozen by the Super Administrator.");return;}
 const expectedId=slug==="super-admin"?"DEMO-SUPER-001":"DEMO-USER-001";
 if(id===expectedId&&password==="DEMO-ONLY"){
  sessionStorage.setItem("kvs_oyms_demo_session",JSON.stringify({role,roleSlug:slug,loginId:id,name:"Demo "+role,demo:true}));
  window.location.href="../../"+slug+"/dashboard/";
  return;
 }
 showMessage("The details do not match this role's preview account. Use the demo credentials shown on this page. Real account sign-in will be enabled after secure authentication is connected.");
});