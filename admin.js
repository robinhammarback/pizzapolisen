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
function totalScore() {
  return ["taste-score","price-score","interior-score","clientele-score","svennefaktor-score"].reduce((sum,id)=>sum+Number($(id).value||0),0);
}
function updateTotal() { $("score").value = totalScore(); }
["taste-score","price-score","interior-score","clientele-score","svennefaktor-score"].forEach(id=>$(id).addEventListener("input",updateTotal));
function clearForm() { $("review-form").reset(); $("review-id").value = ""; updateTotal(); editorStatus.textContent = ""; }
async function refreshEntries() {
  if (!client) return;
  const {data,error} = await client.from("reviews").select("*").order("created_at",{ascending:false});
  if (error) { message(editorStatus, "Kunde inte läsa ärenden: "+error.message, "error"); return; }
  $("entry-list").innerHTML = (data||[]).map(r=>`<div class="entry-item"><div><strong>${esc(r.pizzeria)}</strong><p>${esc(r.location||"")} · ${Number(r.score).toLocaleString("sv-SE")}/55 · ${esc(r.visit_date||"Datum saknas")}</p></div><div class="admin-actions"><button type="button" data-edit="${r.id}">Redigera</button><button type="button" data-delete="${r.id}">Radera</button></div></div>`).join("") || '<p class="muted">Inga publicerade ärenden ännu.</p>';
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
 const categoryIds=["taste-score","price-score","interior-score","clientele-score","svennefaktor-score"];
 const categoryScores=categoryIds.map(id=>Number($(id).value));
 if(categoryScores.some(n=>!Number.isInteger(n)||n<1||n>11)){message(editorStatus,"Alla delbetyg måste vara heltal mellan 1 och 11.","error");return;}
 const score=categoryScores.reduce((a,b)=>a+b,0);
 const record={pizzeria:$("pizzeria").value.trim(),location:$("location").value.trim(),pizza:$("pizza").value.trim(),visit_date:$("visit-date").value||null,score,taste_score:categoryScores[0],price_score:categoryScores[1],interior_score:categoryScores[2],clientele_score:categoryScores[3],svennefaktor_score:categoryScores[4],photo_url:$("photo-url").value.trim()||null,review_text:$("review-text").value.trim()};
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
   $("review-id").value=data.id;$("pizzeria").value=data.pizzeria;$("location").value=data.location||"";$("pizza").value=data.pizza||"";$("visit-date").value=data.visit_date||"";$("taste-score").value=data.taste_score||6;$("price-score").value=data.price_score||6;$("interior-score").value=data.interior_score||6;$("clientele-score").value=data.clientele_score||6;$("svennefaktor-score").value=data.svennefaktor_score||6;updateTotal();$("photo-url").value=data.photo_url||"";$("review-text").value=data.review_text;
   window.scrollTo({top:0,behavior:"smooth"});
 }
 if(del && confirm("Radera detta protokoll permanent?")){
   const {error}=await client.from("reviews").delete().eq("id",del);
   if(error)message(editorStatus,"Kunde inte radera ärendet.","error");else {message(editorStatus,"Ärendet har raderats.","ok");refreshEntries();}
 }
});
checkSession();