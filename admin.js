const cfg = window.PIZZAPOLISEN_CONFIG || {};
const client = (window.supabase && cfg.supabaseUrl && cfg.supabaseAnonKey)
  ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;
const $ = id => document.getElementById(id);
const setup = $("setup-notice"), authStatus = $("auth-status"), editorStatus = $("editor-status");
const loginCard = $("login-card"), editorCard = $("editor-card"), existingCard = $("existing-card");
function message(el, text, kind="") { el.textContent = text; el.className = "status " + kind; }
function setSignedIn(user) {
  loginCard.classList.toggle("hidden", !!user);
  editorCard.classList.toggle("hidden", !user);
  existingCard.classList.toggle("hidden", !user);
  setup.classList.toggle("hidden", !!client);
}
function clearForm() { $("review-form").reset(); $("review-id").value = ""; editorStatus.textContent = ""; }
async function refreshEntries() {
  if (!client) return;
  const {data,error} = await client.from("reviews").select("*").order("created_at",{ascending:false});
  if (error) { message(editorStatus, "Kunde inte läsa ärenden: "+error.message, "error"); return; }
  $("entry-list").innerHTML = (data||[]).map(r=>`<div class="entry-item"><div><strong>${esc(r.pizzeria)}</strong><p>${esc(r.location||"")} · ${Number(r.score).toLocaleString("sv-SE")}/10 · ${esc(r.visit_date||"Datum saknas")}</p></div><div class="admin-actions"><button type="button" data-edit="${r.id}">Redigera</button><button type="button" data-delete="${r.id}">Radera</button></div></div>`).join("") || '<p class="muted">Inga publicerade ärenden ännu.</p>';
}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function checkSession() {
  if (!client) { setSignedIn(null); return; }
  const {data} = await client.auth.getSession();
  setSignedIn(data.session?.user || null);
  if (data.session?.user) refreshEntries();
  client.auth.onAuthStateChange((_event,session)=>{setSignedIn(session?.user||null); if(session?.user) refreshEntries();});
}
$("login-form").addEventListener("submit",async e=>{
  e.preventDefault();
  if(!client){message(authStatus,"Inloggningen är inte aktiverad ännu. Följ driftsättningsprotokollet nedan.","error");return;}
  message(authStatus,"Kontrollerar behörighet…");
  const {error}=await client.auth.signInWithPassword({email:$("email").value,password:$("password").value});
  message(authStatus,error ? "Inloggning misslyckades. Kontrollera uppgifterna eller kontakta administratören." : "Inloggad. Välkommen till tjänst, konstapeln.",error?"error":"ok");
});
$("reset-password").addEventListener("click",async()=>{
  if(!client){message(authStatus,"Lösenordsåterställning aktiveras när backend är konfigurerad.","error");return;}
  const email=$("email").value;
  if(!email){message(authStatus,"Ange din e-postadress först.","error");return;}
  const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+"/admin.html"});
  message(authStatus,error?"Kunde inte skicka återställningslänk.":"Om adressen är registrerad skickas en återställningslänk.",error?"error":"ok");
});
$("logout").addEventListener("click",async()=>{if(client) await client.auth.signOut();setSignedIn(null);});
$("clear-form").addEventListener("click",clearForm);
$("review-form").addEventListener("submit",async e=>{
 e.preventDefault();
 if(!client){message(editorStatus,"Backend saknas; ingenting har publicerats.","error");return;}
 const score=Number($("score").value);
 if(score<0||score>10){message(editorStatus,"Betyget måste vara mellan 0 och 10.","error");return;}
 const record={pizzeria:$("pizzeria").value.trim(),location:$("location").value.trim(),pizza:$("pizza").value.trim(),visit_date:$("visit-date").value||null,score,photo_url:$("photo-url").value.trim()||null,review_text:$("review-text").value.trim()};
 const id=$("review-id").value;
 const result=id ? await client.from("reviews").update(record).eq("id",id) : await client.from("reviews").insert(record);
 if(result.error){message(editorStatus,"Kunde inte spara: "+result.error.message,"error");return;}
 message(editorStatus,"Protokollet är sparat och publicerat.","ok");clearForm();refreshEntries();
});
$("entry-list").addEventListener("click",async e=>{
 if(!client)return;
 const edit=e.target.dataset.edit, del=e.target.dataset.delete;
 if(edit){
   const {data,error}=await client.from("reviews").select("*").eq("id",edit).single();
   if(error){message(editorStatus,"Kunde inte öppna ärendet.","error");return;}
   $("review-id").value=data.id;$("pizzeria").value=data.pizzeria;$("location").value=data.location||"";$("pizza").value=data.pizza||"";$("visit-date").value=data.visit_date||"";$("score").value=data.score;$("photo-url").value=data.photo_url||"";$("review-text").value=data.review_text;
   window.scrollTo({top:0,behavior:"smooth"});
 }
 if(del && confirm("Radera detta protokoll permanent?")){
   const {error}=await client.from("reviews").delete().eq("id",del);
   if(error)message(editorStatus,"Kunde inte radera ärendet.","error");else {message(editorStatus,"Ärendet har raderats.","ok");refreshEntries();}
 }
});
checkSession();