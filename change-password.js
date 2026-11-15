(async function(){
 const client=window.oymsSupabase,form=document.getElementById("changePasswordForm"),msg=document.getElementById("changeMessage");
 const show=t=>{msg.textContent=t;msg.style.display="block";};
 const {data:{session}}=await client.auth.getSession();if(!session){window.location.replace("login/");return;}
 form.addEventListener("submit",async e=>{
  e.preventDefault();const a=document.getElementById("newPassword").value,b=document.getElementById("confirmPassword").value;
  if(a.length<10){show("Use at least 10 characters.");return;}if(a!==b){show("The passwords do not match.");return;}
  const button=form.querySelector("button");button.disabled=true;button.textContent="Saving…";
  try{
   const {error}=await client.auth.updateUser({password:a});if(error)throw error;
   const {error:profileError}=await client.from("profiles").update({must_change_password:false}).eq("id",session.user.id);if(profileError)throw profileError;
   const {data:profile}=await client.from("profiles").select("role").eq("id",session.user.id).single();
   const slug=({"super_admin":"super-admin","patrol_leader":"patrol-leader","administrator":"administrator","unit_leader":"unit-leader","assistant_unit_leader":"assistant-unit-leader","assistant_patrol_leader":"assistant-patrol-leader","member":"member"})[profile.role];
   window.location.replace(slug+"/dashboard/");
  }catch(error){show(error.message||"Could not update the password. Try again.");button.disabled=false;button.textContent="Save New Password";}
 });
})();