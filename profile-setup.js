(async function(){
 const client=window.oymsSupabase,form=document.getElementById("profileSetupForm"),msg=document.getElementById("profileMessage");
 const show=t=>{msg.textContent=t;msg.style.display="block";};
 const {data:{session}}=await client.auth.getSession();if(!session){window.location.replace("login/");return;}
 const {data:profile,error}=await client.from("profiles").select("id,full_name,role,login_id,category,mobile_number,profile_completed_at").eq("id",session.user.id).single();
 if(error||!profile||profile.role!=="patrol_leader"){window.location.replace("login/");return;}
 if(profile.profile_completed_at){window.location.replace("patrol-leader/dashboard/");return;}
 document.getElementById("plName").value=profile.full_name||"";
 document.getElementById("plMobileSetup").value=profile.mobile_number||"";
 form.addEventListener("submit",async e=>{
  e.preventDefault();const photo=document.getElementById("plPhoto").files[0],button=form.querySelector("button");
  if(!photo){show("Please select your profile photograph.");return;}
  if(!["image/jpeg","image/png","image/webp"].includes(photo.type)||photo.size>5*1024*1024){show("Choose a JPG, PNG or WebP image up to 5 MB.");return;}
  const dob=document.getElementById("plDob").value;if(!dob||new Date(dob)>new Date()){show("Enter a valid date of birth.");return;}
  button.disabled=true;button.textContent="Saving profile…";
  let path="";
  try{
   path=session.user.id+"/profile/"+crypto.randomUUID()+"."+({ "image/jpeg":"jpg","image/png":"png","image/webp":"webp"}[photo.type]);
   const {error:uploadError}=await client.storage.from("member-photos").upload(path,photo,{contentType:photo.type,upsert:false});if(uploadError)throw uploadError;
   const {error:updateError}=await client.from("profiles").update({full_name:document.getElementById("plName").value.trim(),date_of_birth:dob,gender:document.getElementById("plGender").value,blood_group:document.getElementById("plBlood").value,residential_address:document.getElementById("plAddress").value.trim(),mobile_number:document.getElementById("plMobileSetup").value.trim(),profile_photo_path:path,profile_completed_at:new Date().toISOString()}).eq("id",session.user.id);
   if(updateError)throw updateError;
   window.location.replace("patrol-leader/dashboard/");
  }catch(error){if(path)await client.storage.from("member-photos").remove([path]);show(error.message||"Could not save your profile. Please try again.");button.disabled=false;button.textContent="Save Profile & Continue";}
 });
})();