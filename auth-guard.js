(async function(){
 const client=window.oymsSupabase,slug=document.body.dataset.role||"";
 const expected={"super-admin":"super_admin","administrator":"administrator","unit-leader":"unit_leader","assistant-unit-leader":"assistant_unit_leader","patrol-leader":"patrol_leader","assistant-patrol-leader":"assistant_patrol_leader","member":"member"};
 const display={"super_admin":"Super Administrator","administrator":"Administrator","unit_leader":"Unit Leader","assistant_unit_leader":"Assistant Unit Leader","patrol_leader":"Patrol Leader","assistant_patrol_leader":"Assistant Patrol Leader","member":"Member"};
 const loginPath="../../login/"+slug+"/";
 const fail=async()=>{try{await client?.auth.signOut();}catch{}sessionStorage.removeItem("kvs_oyms_demo_session");window.location.replace(loginPath);};
 if(!client||!expected[slug]){window.location.replace("../../login/");return;}
 const {data:{session},error}=await client.auth.getSession();
 if(error||!session){await fail();return;}
 const {data:profile,error:profileError}=await client.from("profiles").select("id,full_name,role,login_id,is_active,must_change_password,profile_completed_at").eq("id",session.user.id).maybeSingle();
 if(profileError||!profile||!profile.is_active||profile.role!==expected[slug]){await fail();return;}
 sessionStorage.setItem("kvs_oyms_demo_session",JSON.stringify({role:display[profile.role],roleSlug:slug,loginId:profile.login_id||"",name:profile.full_name||profile.login_id||display[profile.role],demo:false}));
 if(profile.must_change_password){window.location.replace("../../change-password.html");return;}
 if(profile.role==="patrol_leader"&&!profile.profile_completed_at){window.location.replace("../../profile-setup.html");return;}
 const load=src=>new Promise((resolve,reject)=>{const el=document.createElement("script");el.src=src;el.onload=resolve;el.onerror=reject;document.body.appendChild(el);});
 try{await load("../../dashboard.js?v=20261115b");await load("../../user-management.js?v=20261115b");await load("../../launch-countdown.js?v=20261115k");}
 catch(e){document.getElementById("dashMain").innerHTML="<div class='dash-alert'>The dashboard could not load. Refresh this page.</div>";console.error(e);}
})();