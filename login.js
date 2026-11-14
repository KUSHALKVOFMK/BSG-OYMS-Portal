const form=document.getElementById("loginForm");
const message=document.getElementById("authMessage");
function showMessage(text){message.textContent=text;message.style.display="block";}
document.getElementById("forgot").addEventListener("click",()=>showMessage("Secure password recovery will be enabled after the database and email service are connected. No reset email is sent by this preview."));
form.addEventListener("submit",event=>{
 event.preventDefault();
 const id=document.getElementById("loginId").value.trim();
 const password=document.getElementById("password").value;
 const role=document.getElementById("role").value;
 if(role==="Super Administrator"&&id==="DEMO-SUPER-001"&&password==="DEMO-ONLY"){
  sessionStorage.setItem("kvs_oyms_demo_session",JSON.stringify({role,loginId:id,name:"Demo Super Administrator",demo:true}));
  window.location.href="dashboard.html";return;
 }
 if(role&&id==="DEMO-USER-001"&&password==="DEMO-ONLY"){
  sessionStorage.setItem("kvs_oyms_demo_session",JSON.stringify({role,loginId:id,name:"Demo "+role,demo:true}));
  window.location.href="dashboard.html";return;
 }
 showMessage("The details do not match a preview account. Use the demo credentials shown below. Real accounts will work after secure authentication is connected.");
});