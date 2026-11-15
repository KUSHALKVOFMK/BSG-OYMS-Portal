(function(){
  const URL="https://kasnukztvipaxtqniktj.supabase.co";
  const KEY="sb_publishable_fcvOMSaKVJGMEXgUqB7CFg_NbwaLVJ0";
  if(!window.supabase||!window.supabase.createClient){console.error("Supabase client library did not load.");return;}
  window.oymsSupabase=window.supabase.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
})();