const publicConfig = window.PIZZAPOLISEN_CONFIG || {};
let supabaseClient = null;
try {
  if (window.supabase && publicConfig.supabaseUrl && publicConfig.supabaseAnonKey) {
    supabaseClient = window.supabase.createClient(publicConfig.supabaseUrl, publicConfig.supabaseAnonKey);
  }
} catch (e) { console.warn("Supabase kunde inte initieras.", e); }

function escapeHtml(value="") {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function formatDate(value) {
  if (!value) return "Datum ej angivet";
  const d = new Date(value + (String(value).length === 10 ? "T12:00:00" : ""));
  return Number.isNaN(d.getTime()) ? escapeHtml(value) : d.toLocaleDateString("sv-SE");
}
async function loadReviews() {
  const grid = document.getElementById("review-grid");
  const rank = document.getElementById("ranking-list");
  if (!grid || !rank) return;
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient.from("reviews").select("*").order("visit_date", {ascending:false});
  if (error) { console.error(error); return; }
  renderReviews(data || []);
}
function renderReviews(reviews) {
  const grid = document.getElementById("review-grid");
  const rank = document.getElementById("ranking-list");
  if (!grid || !rank) return;
  if (!reviews.length) return;
  grid.innerHTML = reviews.map(r => `<article class="review-card">${r.photo_url ? `<img class="review-photo" src="${escapeHtml(r.photo_url)}" alt="Pizza från ${escapeHtml(r.pizzeria)}" loading="lazy">` : `<div class="review-photo" aria-label="Ingen bild uppladdad"></div>`}<div class="review-body"><span class="review-meta">ÄRENDE PP-${String(r.case_no || r.id).slice(0,8)} · ${formatDate(r.visit_date)}</span><h3>${escapeHtml(r.pizzeria)}</h3><p class="review-meta">${escapeHtml(r.location || "")} · ${escapeHtml(r.pizza || "Pizza ej angiven")}</p><span class="review-score">TOTALBETYG: ${Number(r.score).toLocaleString("sv-SE")} / 55</span><p class="review-subratings">Smak ${r.taste_score ?? "–"}/11 · Pris ${r.price_score ?? "–"}/11 · Inredning ${r.interior_score ?? "–"}/11 · Klientel ${r.clientele_score ?? "–"}/11 · Svennefaktor ${r.svennefaktor_score ?? "–"}/11</p><p class="review-text">${escapeHtml(r.review_text)}</p></div></article>`).join("");
  const sorted = [...reviews].sort((a,b)=>Number(b.score)-Number(a.score));
  rank.innerHTML = sorted.slice(0,5).map((r,i)=>`<div class="rank-row"><span>${String(i+1).padStart(2,"0")}</span><div><b>${escapeHtml(r.pizzeria)}</b><small>${escapeHtml(r.location || "")}</small></div><div class="rank-score">${Number(r.score).toLocaleString("sv-SE")}/55</div></div>`).join("");
}
const tipForm = document.getElementById("tip-form");
if (tipForm) tipForm.addEventListener("submit", e => {
  e.preventDefault();
  const status = document.getElementById("tip-status");
  status.textContent = "Tack för tipset! Tipstjänsten är ännu inte kopplad till en mottagare. Kontakta webbplatsens administratör tills vidare.";
  status.classList.add("error");
});
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
loadReviews();