import { useState, useEffect, useCallback } from "react";
import { getUsers, saveUsers, getPronos, saveProno, subscribeToScores, subscribeToPronos } from "./firebase";

// ─── FLAGS ────────────────────────────────────────────────────────────────
const FLAGS = {
  "Mexico":"🇲🇽","South Africa":"🇿🇦","South Korea":"🇰🇷","Czechia":"🇨🇿",
  "Canada":"🇨🇦","Bosnia and Herzegovina":"🇧🇦","Qatar":"🇶🇦","Switzerland":"🇨🇭",
  "Brazil":"🇧🇷","Morocco":"🇲🇦","Haiti":"🇭🇹","Scotland":"🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "USA":"🇺🇸","Paraguay":"🇵🇾","Australia":"🇦🇺","Turkey":"🇹🇷",
  "Germany":"🇩🇪","Curaçao":"🇨🇼","Ivory Coast":"🇨🇮","Ecuador":"🇪🇨",
  "Netherlands":"🇳🇱","Japan":"🇯🇵","Sweden":"🇸🇪","Tunisia":"🇹🇳",
  "Belgium":"🇧🇪","Egypt":"🇪🇬","Iran":"🇮🇷","New Zealand":"🇳🇿",
  "Spain":"🇪🇸","Cape Verde":"🇨🇻","Saudi Arabia":"🇸🇦","Uruguay":"🇺🇾",
  "France":"🇫🇷","Senegal":"🇸🇳","Norway":"🇳🇴","Argentina":"🇦🇷",
  "Algeria":"🇩🇿","Austria":"🇦🇹","Jordan":"🇯🇴","Portugal":"🇵🇹",
  "DR Congo":"🇨🇩","Colombia":"🇨🇴","Uzbekistan":"🇺🇿","England":"🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Croatia":"🇭🇷","Ghana":"🇬🇭","Panama":"🇵🇦","Iraq":"🇮🇶",
};

// Groupes officiels FIFA (tirage au sort du 5 décembre 2025)
// A: Mexico, South Africa, South Korea, Czechia
// B: Canada, Bosnia and Herzegovina, Qatar, Switzerland
// C: Brazil, Morocco, Haiti, Scotland
// D: USA, Paraguay, Australia, Turkey
// E: Germany, Curaçao, Ivory Coast, Ecuador
// F: Netherlands, Japan, Sweden, Tunisia
// G: Belgium, Egypt, Iran, New Zealand
// H: Spain, Cape Verde, Saudi Arabia, Uruguay
// I: France, Senegal, Iraq, Norway
// J: Argentina, Algeria, Austria, Jordan
// K: Portugal, DR Congo, Uzbekistan, Colombia
// L: England, Croatia, Ghana, Panama

const CDM_MATCHES = [
  // GROUPE A
  {id:1,group:"Groupe A",phase:"group",date:"2026-06-11",time:"19:00",home:"Mexico",away:"South Africa",stadium:"Azteca, Mexico City"},
  {id:2,group:"Groupe A",phase:"group",date:"2026-06-12",time:"04:00",home:"South Korea",away:"Czechia",stadium:"Estadio Akron, Guadalajara"},
  {id:3,group:"Groupe A",phase:"group",date:"2026-06-18",time:"18:00",home:"Czechia",away:"South Africa",stadium:"Mercedes-Benz, Atlanta"},
  {id:4,group:"Groupe A",phase:"group",date:"2026-06-18",time:"21:00",home:"Mexico",away:"South Korea",stadium:"Levi's Stadium, SF"},
  {id:5,group:"Groupe A",phase:"group",date:"2026-06-25",time:"03:00",home:"Mexico",away:"Czechia",stadium:"Estadio Azteca, Mexico City"},
  {id:6,group:"Groupe A",phase:"group",date:"2026-06-25",time:"03:00",home:"South Africa",away:"South Korea",stadium:"NRG Stadium, Houston"},
  // GROUPE B
  {id:7,group:"Groupe B",phase:"group",date:"2026-06-12",time:"21:00",home:"Canada",away:"Bosnia and Herzegovina",stadium:"BMO Field, Toronto"},
  {id:8,group:"Groupe B",phase:"group",date:"2026-06-13",time:"21:00",home:"Qatar",away:"Switzerland",stadium:"Levi's Stadium, SF"},
  {id:9,group:"Groupe B",phase:"group",date:"2026-06-18",time:"21:00",home:"Bosnia and Herzegovina",away:"Qatar",stadium:"SoFi Stadium, LA"},
  {id:10,group:"Groupe B",phase:"group",date:"2026-06-19",time:"00:00",home:"Canada",away:"Switzerland",stadium:"BC Place, Vancouver"},
  {id:11,group:"Groupe B",phase:"group",date:"2026-06-24",time:"21:00",home:"Canada",away:"Qatar",stadium:"BC Place, Vancouver"},
  {id:12,group:"Groupe B",phase:"group",date:"2026-06-24",time:"21:00",home:"Switzerland",away:"Bosnia and Herzegovina",stadium:"Lumen Field, Seattle"},
  // GROUPE C
  {id:13,group:"Groupe C",phase:"group",date:"2026-06-14",time:"00:00",home:"Brazil",away:"Morocco",stadium:"Mercedes-Benz, Atlanta"},
  {id:14,group:"Groupe C",phase:"group",date:"2026-06-14",time:"03:00",home:"Haiti",away:"Scotland",stadium:"SoFi Stadium, LA"},
  {id:15,group:"Groupe C",phase:"group",date:"2026-06-19",time:"21:00",home:"Morocco",away:"Haiti",stadium:"Hard Rock, Miami"},
  {id:16,group:"Groupe C",phase:"group",date:"2026-06-20",time:"00:00",home:"Brazil",away:"Scotland",stadium:"MetLife, New York"},
  {id:17,group:"Groupe C",phase:"group",date:"2026-06-25",time:"00:00",home:"Brazil",away:"Haiti",stadium:"Arrowhead, Kansas City"},
  {id:18,group:"Groupe C",phase:"group",date:"2026-06-25",time:"00:00",home:"Scotland",away:"Morocco",stadium:"Gillette Stadium, Boston"},
  // GROUPE D
  {id:19,group:"Groupe D",phase:"group",date:"2026-06-14",time:"03:00",home:"USA",away:"Paraguay",stadium:"MetLife, New York"},
  {id:20,group:"Groupe D",phase:"group",date:"2026-06-14",time:"06:00",home:"Australia",away:"Turkey",stadium:"BC Place, Vancouver"},
  {id:21,group:"Groupe D",phase:"group",date:"2026-06-20",time:"03:00",home:"Turkey",away:"Paraguay",stadium:"Levi's Stadium, SF"},
  {id:22,group:"Groupe D",phase:"group",date:"2026-06-20",time:"05:00",home:"USA",away:"Australia",stadium:"Lumen Field, Seattle"},
  {id:23,group:"Groupe D",phase:"group",date:"2026-06-25",time:"04:00",home:"USA",away:"Turkey",stadium:"SoFi Stadium, LA"},
  {id:24,group:"Groupe D",phase:"group",date:"2026-06-25",time:"04:00",home:"Paraguay",away:"Australia",stadium:"Arrowhead, Kansas City"},
  // GROUPE E
  {id:25,group:"Groupe E",phase:"group",date:"2026-06-14",time:"19:00",home:"Germany",away:"Curaçao",stadium:"NRG Stadium, Houston"},
  {id:26,group:"Groupe E",phase:"group",date:"2026-06-15",time:"01:00",home:"Ivory Coast",away:"Ecuador",stadium:"AT&T Stadium, Dallas"},
  {id:27,group:"Groupe E",phase:"group",date:"2026-06-20",time:"22:00",home:"Germany",away:"Ivory Coast",stadium:"BMO Field, Toronto"},
  {id:28,group:"Groupe E",phase:"group",date:"2026-06-21",time:"01:00",home:"Ecuador",away:"Curaçao",stadium:"Hard Rock, Miami"},
  {id:29,group:"Groupe E",phase:"group",date:"2026-06-26",time:"00:00",home:"Germany",away:"Ecuador",stadium:"Gillette Stadium, Boston"},
  {id:30,group:"Groupe E",phase:"group",date:"2026-06-26",time:"00:00",home:"Curaçao",away:"Ivory Coast",stadium:"Lincoln Financial, Philly"},
  // GROUPE F
  {id:31,group:"Groupe F",phase:"group",date:"2026-06-14",time:"22:00",home:"Netherlands",away:"Japan",stadium:"Mercedes-Benz, Atlanta"},
  {id:32,group:"Groupe F",phase:"group",date:"2026-06-15",time:"04:00",home:"Sweden",away:"Tunisia",stadium:"Estadio BBVA, Monterrey"},
  {id:33,group:"Groupe F",phase:"group",date:"2026-06-20",time:"19:00",home:"Japan",away:"Sweden",stadium:"NRG Stadium, Houston"},
  {id:34,group:"Groupe F",phase:"group",date:"2026-06-20",time:"22:00",home:"Netherlands",away:"Tunisia",stadium:"BC Place, Vancouver"},
  {id:35,group:"Groupe F",phase:"group",date:"2026-06-26",time:"01:00",home:"Netherlands",away:"Sweden",stadium:"AT&T Stadium, Dallas"},
  {id:36,group:"Groupe F",phase:"group",date:"2026-06-26",time:"01:00",home:"Tunisia",away:"Japan",stadium:"SoFi Stadium, LA"},
  // GROUPE G
  {id:37,group:"Groupe G",phase:"group",date:"2026-06-15",time:"18:00",home:"Belgium",away:"Egypt",stadium:"Hard Rock, Miami"},
  {id:38,group:"Groupe G",phase:"group",date:"2026-06-16",time:"03:00",home:"Iran",away:"New Zealand",stadium:"Levi's Stadium, SF"},
  {id:39,group:"Groupe G",phase:"group",date:"2026-06-21",time:"18:00",home:"Egypt",away:"Iran",stadium:"Estadio Akron, Guadalajara"},
  {id:40,group:"Groupe G",phase:"group",date:"2026-06-21",time:"21:00",home:"Belgium",away:"New Zealand",stadium:"Lincoln Financial, Philly"},
  {id:41,group:"Groupe G",phase:"group",date:"2026-06-26",time:"22:00",home:"Belgium",away:"Iran",stadium:"MetLife, New York"},
  {id:42,group:"Groupe G",phase:"group",date:"2026-06-26",time:"22:00",home:"New Zealand",away:"Egypt",stadium:"Gillette Stadium, Boston"},
  // GROUPE H
  {id:43,group:"Groupe H",phase:"group",date:"2026-06-15",time:"21:00",home:"Spain",away:"Cape Verde",stadium:"Arrowhead, Kansas City"},
  {id:44,group:"Groupe H",phase:"group",date:"2026-06-16",time:"00:00",home:"Saudi Arabia",away:"Uruguay",stadium:"BMO Field, Toronto"},
  {id:45,group:"Groupe H",phase:"group",date:"2026-06-21",time:"21:00",home:"Uruguay",away:"Cape Verde",stadium:"NRG Stadium, Houston"},
  {id:46,group:"Groupe H",phase:"group",date:"2026-06-22",time:"00:00",home:"Spain",away:"Saudi Arabia",stadium:"AT&T Stadium, Dallas"},
  {id:47,group:"Groupe H",phase:"group",date:"2026-06-27",time:"22:00",home:"Spain",away:"Uruguay",stadium:"MetLife, New York"},
  {id:48,group:"Groupe H",phase:"group",date:"2026-06-27",time:"22:00",home:"Cape Verde",away:"Saudi Arabia",stadium:"SoFi Stadium, LA"},
  // GROUPE I
  {id:49,group:"Groupe I",phase:"group",date:"2026-06-16",time:"21:00",home:"France",away:"Senegal",stadium:"MetLife, New York"},
  {id:50,group:"Groupe I",phase:"group",date:"2026-06-17",time:"00:00",home:"Iraq",away:"Norway",stadium:"Levi's Stadium, SF"},
  {id:51,group:"Groupe I",phase:"group",date:"2026-06-22",time:"21:00",home:"Senegal",away:"Iraq",stadium:"Estadio BBVA, Monterrey"},
  {id:52,group:"Groupe I",phase:"group",date:"2026-06-23",time:"00:00",home:"France",away:"Norway",stadium:"Lincoln Financial, Philly"},
  {id:53,group:"Groupe I",phase:"group",date:"2026-06-27",time:"21:00",home:"France",away:"Iraq",stadium:"AT&T Stadium, Dallas"},
  {id:54,group:"Groupe I",phase:"group",date:"2026-06-27",time:"21:00",home:"Norway",away:"Senegal",stadium:"Lumen Field, Seattle"},
  // GROUPE J
  {id:55,group:"Groupe J",phase:"group",date:"2026-06-17",time:"03:00",home:"Argentina",away:"Algeria",stadium:"MetLife, New York"},
  {id:56,group:"Groupe J",phase:"group",date:"2026-06-17",time:"06:00",home:"Austria",away:"Jordan",stadium:"Gillette Stadium, Boston"},
  {id:57,group:"Groupe J",phase:"group",date:"2026-06-23",time:"00:00",home:"Algeria",away:"Jordan",stadium:"Hard Rock, Miami"},
  {id:58,group:"Groupe J",phase:"group",date:"2026-06-23",time:"03:00",home:"Argentina",away:"Austria",stadium:"SoFi Stadium, LA"},
  {id:59,group:"Groupe J",phase:"group",date:"2026-06-28",time:"22:00",home:"Argentina",away:"Jordan",stadium:"NRG Stadium, Houston"},
  {id:60,group:"Groupe J",phase:"group",date:"2026-06-28",time:"22:00",home:"Algeria",away:"Austria",stadium:"Estadio Akron, Guadalajara"},
  // GROUPE K
  {id:61,group:"Groupe K",phase:"group",date:"2026-06-17",time:"19:00",home:"Portugal",away:"DR Congo",stadium:"Arrowhead, Kansas City"},
  {id:62,group:"Groupe K",phase:"group",date:"2026-06-18",time:"04:00",home:"Uzbekistan",away:"Colombia",stadium:"BC Place, Vancouver"},
  {id:63,group:"Groupe K",phase:"group",date:"2026-06-23",time:"22:00",home:"DR Congo",away:"Uzbekistan",stadium:"BMO Field, Toronto"},
  {id:64,group:"Groupe K",phase:"group",date:"2026-06-24",time:"01:00",home:"Portugal",away:"Colombia",stadium:"Mercedes-Benz, Atlanta"},
  {id:65,group:"Groupe K",phase:"group",date:"2026-06-29",time:"22:00",home:"Portugal",away:"Uzbekistan",stadium:"Lincoln Financial, Philly"},
  {id:66,group:"Groupe K",phase:"group",date:"2026-06-29",time:"22:00",home:"Colombia",away:"DR Congo",stadium:"AT&T Stadium, Dallas"},
  // GROUPE L
  {id:67,group:"Groupe L",phase:"group",date:"2026-06-17",time:"22:00",home:"England",away:"Croatia",stadium:"Estadio Azteca, Mexico City"},
  {id:68,group:"Groupe L",phase:"group",date:"2026-06-18",time:"01:00",home:"Ghana",away:"Panama",stadium:"Lumen Field, Seattle"},
  {id:69,group:"Groupe L",phase:"group",date:"2026-06-23",time:"22:00",home:"Croatia",away:"Panama",stadium:"Hard Rock, Miami"},
  {id:70,group:"Groupe L",phase:"group",date:"2026-06-24",time:"01:00",home:"England",away:"Ghana",stadium:"Arrowhead, Kansas City"},
  {id:71,group:"Groupe L",phase:"group",date:"2026-06-29",time:"21:00",home:"England",away:"Panama",stadium:"MetLife, New York"},
  {id:72,group:"Groupe L",phase:"group",date:"2026-06-29",time:"21:00",home:"Croatia",away:"Ghana",stadium:"SoFi Stadium, LA"},
  // 32e DE FINALE
  {id:73,group:"32e de finale",phase:"r32",date:"2026-07-01",time:"21:00",home:"1A",away:"3C/D/E",stadium:"AT&T Stadium, Dallas"},
  {id:74,group:"32e de finale",phase:"r32",date:"2026-07-01",time:"18:00",home:"1B",away:"3A/D/E",stadium:"Gillette Stadium, Boston"},
  {id:75,group:"32e de finale",phase:"r32",date:"2026-07-02",time:"21:00",home:"1C",away:"3A/B/F",stadium:"MetLife, New York"},
  {id:76,group:"32e de finale",phase:"r32",date:"2026-07-02",time:"18:00",home:"1D",away:"3G/H/I",stadium:"NRG Stadium, Houston"},
  {id:77,group:"32e de finale",phase:"r32",date:"2026-07-03",time:"21:00",home:"1E",away:"3J/K/L",stadium:"SoFi Stadium, LA"},
  {id:78,group:"32e de finale",phase:"r32",date:"2026-07-03",time:"18:00",home:"1F",away:"3A/B/C",stadium:"Levi's Stadium, SF"},
  {id:79,group:"32e de finale",phase:"r32",date:"2026-07-04",time:"21:00",home:"1G",away:"3D/E/F",stadium:"Mercedes-Benz, Atlanta"},
  {id:80,group:"32e de finale",phase:"r32",date:"2026-07-04",time:"18:00",home:"1H",away:"2I",stadium:"BC Place, Vancouver"},
  {id:81,group:"32e de finale",phase:"r32",date:"2026-07-05",time:"21:00",home:"1I",away:"2H",stadium:"Estadio Azteca, Mexico City"},
  {id:82,group:"32e de finale",phase:"r32",date:"2026-07-05",time:"18:00",home:"1J",away:"2K",stadium:"Hard Rock, Miami"},
  {id:83,group:"32e de finale",phase:"r32",date:"2026-07-06",time:"21:00",home:"1K",away:"2J",stadium:"Arrowhead, Kansas City"},
  {id:84,group:"32e de finale",phase:"r32",date:"2026-07-06",time:"18:00",home:"1L",away:"2G",stadium:"Lumen Field, Seattle"},
  {id:85,group:"32e de finale",phase:"r32",date:"2026-07-07",time:"21:00",home:"2A",away:"2F",stadium:"BMO Field, Toronto"},
  {id:86,group:"32e de finale",phase:"r32",date:"2026-07-07",time:"18:00",home:"2B",away:"2E",stadium:"AT&T Stadium, Dallas"},
  {id:87,group:"32e de finale",phase:"r32",date:"2026-07-08",time:"21:00",home:"2C",away:"2L",stadium:"MetLife, New York"},
  {id:88,group:"32e de finale",phase:"r32",date:"2026-07-08",time:"18:00",home:"2D",away:"2K",stadium:"Gillette Stadium, Boston"},
  // 8e DE FINALE
  {id:89,group:"8e de finale",phase:"r16",date:"2026-07-11",time:"21:00",home:"W73",away:"W74",stadium:"AT&T Stadium, Dallas"},
  {id:90,group:"8e de finale",phase:"r16",date:"2026-07-12",time:"18:00",home:"W75",away:"W76",stadium:"SoFi Stadium, LA"},
  {id:91,group:"8e de finale",phase:"r16",date:"2026-07-12",time:"21:00",home:"W77",away:"W78",stadium:"MetLife, New York"},
  {id:92,group:"8e de finale",phase:"r16",date:"2026-07-13",time:"18:00",home:"W79",away:"W80",stadium:"NRG Stadium, Houston"},
  {id:93,group:"8e de finale",phase:"r16",date:"2026-07-13",time:"21:00",home:"W81",away:"W82",stadium:"Levi's Stadium, SF"},
  {id:94,group:"8e de finale",phase:"r16",date:"2026-07-14",time:"18:00",home:"W83",away:"W84",stadium:"Mercedes-Benz, Atlanta"},
  {id:95,group:"8e de finale",phase:"r16",date:"2026-07-14",time:"21:00",home:"W85",away:"W86",stadium:"BC Place, Vancouver"},
  {id:96,group:"8e de finale",phase:"r16",date:"2026-07-15",time:"18:00",home:"W87",away:"W88",stadium:"Hard Rock, Miami"},
  // QUARTS
  {id:97,group:"Quart de finale",phase:"qf",date:"2026-07-17",time:"21:00",home:"W89",away:"W90",stadium:"MetLife, New York"},
  {id:98,group:"Quart de finale",phase:"qf",date:"2026-07-18",time:"18:00",home:"W91",away:"W92",stadium:"AT&T Stadium, Dallas"},
  {id:99,group:"Quart de finale",phase:"qf",date:"2026-07-18",time:"21:00",home:"W93",away:"W94",stadium:"SoFi Stadium, LA"},
  {id:100,group:"Quart de finale",phase:"qf",date:"2026-07-19",time:"18:00",home:"W95",away:"W96",stadium:"Levi's Stadium, SF"},
  // DEMIS
  {id:101,group:"Demi-finale",phase:"sf",date:"2026-07-22",time:"21:00",home:"W97",away:"W98",stadium:"AT&T Stadium, Dallas"},
  {id:102,group:"Demi-finale",phase:"sf",date:"2026-07-23",time:"21:00",home:"W99",away:"W100",stadium:"MetLife, New York"},
  // 3E PLACE
  {id:103,group:"3e place",phase:"3rd",date:"2026-07-26",time:"21:00",home:"L101",away:"L102",stadium:"Hard Rock, Miami"},
  // FINALE
  {id:104,group:"🏆 FINALE",phase:"final",date:"2026-07-19",time:"21:00",home:"W101",away:"W102",stadium:"MetLife, New York"},
];

// Scores déjà connus (mis à jour manuellement jusqu'à ce que Firebase prenne le relais)
const KNOWN_SCORES = {
  1: [2, 0], // Mexico 2-0 Afrique du Sud
  2: [2, 1], // Corée du Sud 2-1 Tchéquie
};

const PHASE_CONFIG = {
  group:{label:"Phase de groupes",mult:1},
  r32:{label:"⚡ 32e de finale",mult:1.5},
  r16:{label:"🔥 8e de finale",mult:2},
  qf:{label:"💥 Quart de finale",mult:2.5},
  sf:{label:"🌟 Demi-finale",mult:3},
  "3rd":{label:"🥉 3e place",mult:2},
  final:{label:"🏆 FINALE",mult:4},
};

const AVATARS = ["⚽","🦁","🐯","🦊","🐺","🦅","🐆","🦈","🔥","⚡","🌟","🏆","🎯","🦉","🐻","🦋"];

function calcPoints(prono, score, phase) {
  if (!score || !prono || prono.home === "" || prono.away === "") return null;
  const ph = parseInt(prono.home), pa = parseInt(prono.away);
  const rh = score[0], ra = score[1];
  if (isNaN(ph) || isNaN(pa)) return null;
  const mult = PHASE_CONFIG[phase]?.mult || 1;
  let pts = 0;
  if (ph === rh && pa === ra) pts = 10;
  else if ((ph - pa) === (rh - ra)) pts = 6;
  else if ((ph > pa) === (rh > ra) && (ph === pa) === (rh === ra)) pts = 3;
  return Math.round(pts * mult);
}

// Statut basé sur la date UTC réelle du match
function getStatus(match, scores) {
  if (scores[match.id]) return "played";
  const now = new Date();
  // Les heures dans CDM_MATCHES sont déjà en UTC
  const matchDate = new Date(`${match.date}T${match.time}:00Z`);
  const endDate = new Date(matchDate.getTime() + 2 * 3600000); // +2h = fin du match
  const open48h = new Date(matchDate.getTime() - 48 * 3600000);
  if (now >= endDate) return "played"; // terminé
  if (now >= matchDate) return "live";  // en cours
  if (now >= open48h) return "open";    // ouvert aux pronos
  return "locked";
}

function formatDate(dateStr, timeStr) {
  const d = new Date(`${dateStr}T${timeStr}:00Z`);
  return d.toLocaleDateString("fr-FR", { weekday:"short", day:"numeric", month:"short", hour:"2-digit", minute:"2-digit", timeZone:"Europe/Paris" });
}

async function hashPwd(pwd) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pwd + "cdm2026pronos"));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}

const inputStyle = {
  background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)",
  borderRadius:12, padding:"13px 16px", fontSize:15, color:"#fff", outline:"none",
  width:"100%", boxSizing:"border-box",
};

function AuthScreen({ users, onLogin, onSaveUsers }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState("⚽");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!username.trim() || !password.trim()) { setError("Remplis tous les champs"); return; }
    setLoading(true);
    if (mode === "register") {
      if (username.trim().length < 2) { setError("Pseudo trop court"); setLoading(false); return; }
      if (password.length < 4) { setError("Mot de passe trop court (4 min)"); setLoading(false); return; }
      if (users[username.trim()]) { setError("Ce pseudo est déjà pris !"); setLoading(false); return; }
      const hash = await hashPwd(password);
      const newUsers = { ...users, [username.trim()]: { hash, avatar, createdAt: new Date().toISOString() } };
      await onSaveUsers(newUsers);
      onLogin({ username: username.trim(), avatar });
    } else {
      const user = users[username.trim()];
      if (!user) { setError("Pseudo inconnu"); setLoading(false); return; }
      const hash = await hashPwd(password);
      if (hash !== user.hash) { setError("Mauvais mot de passe 🔐"); setLoading(false); return; }
      onLogin({ username: username.trim(), avatar: user.avatar });
    }
    setLoading(false);
  };

  return (
    <div style={{ background:"linear-gradient(180deg,#080c18 0%,#0f1629 100%)", minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", padding:"48px 24px 24px", fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <div style={{ textAlign:"center", marginBottom:36 }}>
        <div style={{ fontSize:64, marginBottom:4 }}>⚽</div>
        <div style={{ fontSize:11, color:"#facc15", letterSpacing:3, fontWeight:800, textTransform:"uppercase" }}>Coupe du Monde 2026</div>
        <div style={{ fontSize:26, fontWeight:900, color:"#fff", marginTop:2 }}>Pronos des Potes</div>
        <div style={{ fontSize:12, color:"#475569", marginTop:4 }}>🇺🇸 USA · 🇲🇽 Mexique · 🇨🇦 Canada</div>
        <div style={{ fontSize:11, color:"#334155", marginTop:2 }}>11 juin – 19 juillet 2026</div>
      </div>
      <div style={{ display:"flex", background:"rgba(255,255,255,0.05)", borderRadius:12, padding:4, marginBottom:28, width:"100%", maxWidth:340 }}>
        {[["login","Connexion"],["register","Inscription"]].map(([k,l]) => (
          <button key={k} onClick={() => { setMode(k); setError(""); }} style={{
            flex:1, padding:"10px", borderRadius:9, border:"none", cursor:"pointer", fontSize:14, fontWeight:700,
            background: mode===k ? "#facc15" : "transparent", color: mode===k ? "#080c18" : "#64748b",
          }}>{l}</button>
        ))}
      </div>
      <div style={{ width:"100%", maxWidth:340, display:"flex", flexDirection:"column", gap:12 }}>
        <input value={username} onChange={e => { setUsername(e.target.value); setError(""); }} placeholder="Ton prénom / pseudo" style={inputStyle} />
        <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }} placeholder="Mot de passe" onKeyDown={e => e.key==="Enter" && handle()} style={inputStyle} />
        {mode === "register" && (
          <div>
            <div style={{ fontSize:12, color:"#64748b", marginBottom:8, fontWeight:600 }}>Choisis ton avatar</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {AVATARS.map(a => (
                <button key={a} onClick={() => setAvatar(a)} style={{ width:44, height:44, borderRadius:10, fontSize:22, cursor:"pointer", border: avatar===a ? "2px solid #facc15" : "1px solid rgba(255,255,255,0.1)", background: avatar===a ? "rgba(250,204,21,0.15)" : "rgba(255,255,255,0.05)" }}>{a}</button>
              ))}
            </div>
          </div>
        )}
        {error && <div style={{ background:"rgba(248,113,113,0.15)", border:"1px solid rgba(248,113,113,0.3)", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#f87171" }}>{error}</div>}
        <button onClick={handle} disabled={loading} style={{ background: loading ? "#475569" : "linear-gradient(135deg,#facc15,#f59e0b)", border:"none", borderRadius:12, padding:14, fontSize:15, fontWeight:800, color:"#080c18", cursor: loading ? "default" : "pointer" }}>
          {loading ? "Connexion..." : mode==="login" ? "Se connecter →" : "Créer mon compte →"}
        </button>
        {Object.keys(users).length > 0 && mode === "login" && (
          <div style={{ marginTop:8 }}>
            <div style={{ fontSize:11, color:"#475569", marginBottom:8, textAlign:"center" }}>Joueurs inscrits :</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, justifyContent:"center" }}>
              {Object.entries(users).map(([u,d]) => (
                <button key={u} onClick={() => setUsername(u)} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:"5px 12px", fontSize:13, color:"#94a3b8", cursor:"pointer" }}>{d.avatar} {u}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({ match, prono, onSave }) {
  const [editHome, setEditHome] = useState(prono?.home ?? "");
  const [editAway, setEditAway] = useState(prono?.away ?? "");
  const { status, score, phase, home, away, group, date, time, stadium } = match;
  const pts = prono && score ? calcPoints(prono, score, phase) : null;
  const f1 = FLAGS[home] || "🏳️";
  const f2 = FLAGS[away] || "🏳️";
  const saved = prono && String(editHome) === String(prono.home) && String(editAway) === String(prono.away);
  const borderColor = status==="live" ? "#ef4444" : status==="open" ? "#4ade80" : status==="played" ? "#3b82f6" : "#1e293b";
  const ptsBg = pts >= 9 ? { bg:"rgba(74,222,128,0.15)", color:"#4ade80", border:"rgba(74,222,128,0.3)" }
    : pts >= 4 ? { bg:"rgba(250,204,21,0.15)", color:"#facc15", border:"rgba(250,204,21,0.3)" }
    : { bg:"rgba(248,113,113,0.12)", color:"#f87171", border:"rgba(248,113,113,0.25)" };

  const doSave = () => {
    if (editHome !== "" && editAway !== "" && !isNaN(editHome) && !isNaN(editAway)) {
      onSave({ home: parseInt(editHome), away: parseInt(editAway) });
    }
  };

  return (
    <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", borderLeft:`3px solid ${borderColor}`, borderRadius:12, padding:"12px 14px", marginBottom:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <span style={{ fontSize:10, color:"#334155" }}>{group} · {formatDate(date, time)}</span>
        <div>
          {status==="live" && <span style={{ background:"#ef4444", color:"#fff", padding:"2px 8px", borderRadius:10, fontSize:10, fontWeight:800 }}>🔴 LIVE</span>}
          {status==="open" && <span style={{ background:"rgba(74,222,128,0.15)", color:"#4ade80", padding:"2px 8px", borderRadius:10, fontSize:10, fontWeight:700, border:"1px solid rgba(74,222,128,0.3)" }}>OUVERT</span>}
          {status==="locked" && <span style={{ background:"rgba(148,163,184,0.1)", color:"#475569", padding:"2px 8px", borderRadius:10, fontSize:10, fontWeight:700 }}>🔒</span>}
          {status==="played" && <span style={{ background:"rgba(96,165,250,0.15)", color:"#60a5fa", padding:"2px 8px", borderRadius:10, fontSize:10, fontWeight:700, border:"1px solid rgba(96,165,250,0.3)" }}>FT</span>}
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ flex:1, textAlign:"right" }}>
          <div style={{ fontSize:22 }}>{f1}</div>
          <div style={{ fontSize:12, fontWeight:700, color:"#f1f5f9", marginTop:2 }}>{home}</div>
        </div>
        <div style={{ minWidth:70, textAlign:"center" }}>
          {score ? <div style={{ fontSize:24, fontWeight:900, color:"#facc15" }}>{score[0]} – {score[1]}</div>
                 : <div style={{ fontSize:12, color:"#334155", fontWeight:700 }}>VS</div>}
        </div>
        <div style={{ flex:1, textAlign:"left" }}>
          <div style={{ fontSize:22 }}>{f2}</div>
          <div style={{ fontSize:12, fontWeight:700, color:"#f1f5f9", marginTop:2 }}>{away}</div>
        </div>
      </div>
      <div style={{ fontSize:10, color:"#1e293b", textAlign:"center", marginTop:4 }}>📍 {stadium}</div>
      {(status==="open" || status==="live") && (
        <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:8, justifyContent:"center" }}>
          <span style={{ fontSize:11, color:"#475569", fontWeight:600 }}>Mon prono :</span>
          <input value={editHome} onChange={e => setEditHome(e.target.value)} onBlur={doSave} placeholder="0" type="number" min="0" max="20"
            style={{ width:44, textAlign:"center", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(250,204,21,0.35)", borderRadius:7, padding:"8px 4px", color:"#fff", fontSize:18, fontWeight:800, outline:"none" }} />
          <span style={{ color:"#facc15", fontWeight:900 }}>–</span>
          <input value={editAway} onChange={e => setEditAway(e.target.value)} onBlur={doSave} placeholder="0" type="number" min="0" max="20"
            style={{ width:44, textAlign:"center", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(250,204,21,0.35)", borderRadius:7, padding:"8px 4px", color:"#fff", fontSize:18, fontWeight:800, outline:"none" }} />
          <button onClick={doSave} style={{ background: saved ? "rgba(74,222,128,0.2)" : "linear-gradient(135deg,#facc15,#f59e0b)", border: saved ? "1px solid #4ade80" : "none", borderRadius:7, padding:"8px 14px", fontSize:12, fontWeight:800, color: saved ? "#4ade80" : "#080c18", cursor:"pointer" }}>
            {saved ? "✓ OK" : "Valider"}
          </button>
        </div>
      )}
      {(status==="played" || status==="locked") && prono && (
        <div style={{ marginTop:10, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          <span style={{ fontSize:11, color:"#475569" }}>Mon prono :</span>
          <span style={{ fontSize:14, fontWeight:800, color:"#94a3b8" }}>{prono.home}–{prono.away}</span>
          {pts !== null && (
            <span style={{ padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:800, background:ptsBg.bg, color:ptsBg.color, border:`1px solid ${ptsBg.border}` }}>
              {pts > 0 ? `+${pts} pts` : "0 pt"}
            </span>
          )}
        </div>
      )}
      {status==="open" && !prono && (
        <div style={{ marginTop:6, textAlign:"center", fontSize:11, color:"#f87171", fontWeight:700 }}>⚠️ Pas encore pronostiqué !</div>
      )}
    </div>
  );
}

function MatchsTab({ matches, pronos, onSave }) {
  const [filter, setFilter] = useState("open");
  const [search, setSearch] = useState("");

  const filtered = matches
    .filter(m => {
      if (filter==="open") return m.status==="open" || m.status==="live";
      if (filter==="played") return m.status==="played";
      if (filter==="upcoming") return m.status==="locked";
      return true;
    })
    .filter(m => !search || m.home.toLowerCase().includes(search.toLowerCase()) || m.away.toLowerCase().includes(search.toLowerCase()) || m.group.toLowerCase().includes(search.toLowerCase()));

  const grouped = filtered.reduce((acc, m) => {
    const key = m.phase==="group" ? m.group : PHASE_CONFIG[m.phase]?.label || m.group;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <div style={{ padding:"14px 14px 0" }}>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Chercher une équipe..."
        style={{ ...inputStyle, marginBottom:10, fontSize:13, padding:"10px 14px" }} />
      <div style={{ display:"flex", gap:6, marginBottom:14 }}>
        {[["open","🟢 Ouverts"],["upcoming","🔒 À venir"],["played","✅ Joués"],["all","Tous"]].map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{ flex:1, padding:"7px 2px", borderRadius:8, fontSize:10, fontWeight:700, border: filter===k ? "1px solid #facc15" : "1px solid rgba(255,255,255,0.08)", background: filter===k ? "rgba(250,204,21,0.12)" : "rgba(255,255,255,0.02)", color: filter===k ? "#facc15" : "#475569", cursor:"pointer" }}>{l}</button>
        ))}
      </div>
      {Object.entries(grouped).map(([phase, pmatches]) => {
        const mult = PHASE_CONFIG[pmatches[0]?.phase]?.mult || 1;
        return (
          <div key={phase} style={{ marginBottom:22 }}>
            <div style={{ fontSize:10, color:"#64748b", fontWeight:800, letterSpacing:2, textTransform:"uppercase", marginBottom:8, display:"flex", alignItems:"center", gap:8 }}>
              {phase}
              {mult > 1 && <span style={{ background:"rgba(250,204,21,0.2)", color:"#facc15", padding:"1px 8px", borderRadius:10, fontSize:10 }}>×{mult}</span>}
            </div>
            {pmatches.map(m => <MatchCard key={m.id} match={m} prono={pronos[m.id]} onSave={prono => onSave(m.id, prono)} />)}
          </div>
        );
      })}
      {Object.keys(grouped).length === 0 && (
        <div style={{ textAlign:"center", padding:48, color:"#334155" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>😴</div>
          <div style={{ fontWeight:600 }}>Aucun match dans cette catégorie</div>
        </div>
      )}
    </div>
  );
}

function ClassementTab({ board, currentUser }) {
  return (
    <div style={{ padding:"14px 14px 0" }}>
      {board.length >= 3 && (
        <div style={{ display:"flex", gap:8, marginBottom:20, alignItems:"flex-end" }}>
          {[board[1], board[0], board[2]].map((u, i) => {
            if (!u) return <div key={i} style={{ flex:1 }} />;
            const heights=[80,105,66], medals=["🥈","🥇","🥉"];
            const colors=["rgba(148,163,184,0.2)","rgba(250,204,21,0.18)","rgba(192,118,58,0.2)"];
            const tcolors=["#94a3b8","#facc15","#c0763a"];
            return (
              <div key={u.username} style={{ flex:1, textAlign:"center" }}>
                <div style={{ fontSize:11, fontWeight:800, color:u.username===currentUser?"#4ade80":"#64748b", marginBottom:4 }}>
                  {u.avatar} {u.username===currentUser?"Toi!":u.username}
                </div>
                <div style={{ height:heights[i], background:colors[i], border:`1px solid ${tcolors[i]}44`, borderRadius:"8px 8px 0 0", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2 }}>
                  <div style={{ fontSize:20 }}>{medals[i]}</div>
                  <div style={{ fontSize:20, fontWeight:900, color:tcolors[i] }}>{u.total}</div>
                  <div style={{ fontSize:9, color:"#475569" }}>pts</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ fontSize:10, color:"#475569", fontWeight:800, letterSpacing:2, textTransform:"uppercase", marginBottom:10 }}>Classement général</div>
      {board.map((u, idx) => (
        <div key={u.username} style={{ background:u.username===currentUser?"rgba(250,204,21,0.07)":"rgba(255,255,255,0.025)", border:u.username===currentUser?"1px solid rgba(250,204,21,0.25)":"1px solid rgba(255,255,255,0.05)", borderRadius:12, padding:"11px 14px", marginBottom:7, display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:28, height:28, borderRadius:"50%", background:idx===0?"#facc15":idx===1?"#94a3b8":idx===2?"#c0763a":"rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:900, color:idx<3?"#080c18":"#475569", flexShrink:0 }}>{idx+1}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:800, color:u.username===currentUser?"#facc15":"#f1f5f9" }}>{u.avatar} {u.username}</div>
            <div style={{ fontSize:10, color:"#475569", marginTop:1 }}>🎯 {u.exact} · ↔️ {u.bon} · ✅ {u.bonne}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:22, fontWeight:900, color:u.username===currentUser?"#facc15":"#f1f5f9" }}>{u.total}</div>
            <div style={{ fontSize:9, color:"#334155" }}>pts</div>
          </div>
        </div>
      ))}
      {board.length === 0 && <div style={{ textAlign:"center", padding:40, color:"#334155" }}><div style={{ fontSize:36, marginBottom:12 }}>👥</div><div>Personne inscrit encore</div></div>}
      <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:12, padding:14, marginTop:12 }}>
        <div style={{ fontSize:10, color:"#475569", fontWeight:800, letterSpacing:1, marginBottom:10, textTransform:"uppercase" }}>📋 Barème</div>
        {[["🎯 Score exact","10 pts"],["↔️ Bon écart","6 pts"],["✅ Bonne issue","3 pts"],["❌ Raté","0 pt"]].map(([l,v])=>(
          <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
            <span style={{ fontSize:12, color:"#64748b" }}>{l}</span>
            <span style={{ fontSize:12, fontWeight:700, color:"#facc15" }}>{v}</span>
          </div>
        ))}
        <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", marginTop:8, paddingTop:8 }}>
          <div style={{ fontSize:10, color:"#334155", marginBottom:4 }}>Multiplicateurs :</div>
          {[["32e","×1.5"],["8e","×2"],["Quart","×2.5"],["Demi","×3"],["Finale","×4"]].map(([k,v])=>(
            <div key={k} style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:11, color:"#475569" }}>{k}</span>
              <span style={{ fontSize:11, fontWeight:700, color:"#60a5fa" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfilTab({ user, stats, rank, total, pronos, matches, onLogout }) {
  const played = matches.filter(m => m.score);
  const participation = played.length > 0 ? Math.round((Object.keys(pronos).length / played.length) * 100) : 0;
  const recentResults = matches.filter(m => m.score && pronos[m.id]).slice(-6).reverse();
  return (
    <div style={{ padding:"14px 14px 0" }}>
      <div style={{ background:"linear-gradient(135deg,rgba(250,204,21,0.12),rgba(245,158,11,0.04))", border:"1px solid rgba(250,204,21,0.2)", borderRadius:16, padding:18, marginBottom:18, display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ width:60, height:60, borderRadius:"50%", background:"linear-gradient(135deg,#facc15,#f59e0b)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>{user.avatar}</div>
        <div>
          <div style={{ fontSize:20, fontWeight:900 }}>{user.username}</div>
          <div style={{ fontSize:13, color:"#facc15" }}>#{rank} sur {total} joueurs</div>
          <div style={{ fontSize:12, color:"#475569" }}>{stats.total || 0} points</div>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:18 }}>
        {[["🎯","Scores exacts",stats.exact||0,"#4ade80"],["↔️","Bons écarts",stats.bon||0,"#60a5fa"],["✅","Bons résultats",stats.bonne||0,"#a78bfa"],["📊","Participation",`${participation}%`,"#facc15"]].map(([icon,label,val,color]) => (
          <div key={label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"13px 14px" }}>
            <div style={{ fontSize:20, marginBottom:3 }}>{icon}</div>
            <div style={{ fontSize:22, fontWeight:900, color }}>{val}</div>
            <div style={{ fontSize:11, color:"#475569", fontWeight:600 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize:10, color:"#475569", fontWeight:800, letterSpacing:2, textTransform:"uppercase", marginBottom:10 }}>Mes derniers pronos</div>
      {recentResults.map(m => {
        const prono = pronos[m.id];
        const pts = calcPoints(prono, m.score, m.phase);
        return (
          <div key={m.id} style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,0.025)", borderRadius:10, padding:"9px 12px", marginBottom:6 }}>
            <div style={{ flex:1, fontSize:12, color:"#64748b" }}>{FLAGS[m.home]||"🏳️"} {m.home} – {m.away} {FLAGS[m.away]||"🏳️"}</div>
            <div style={{ fontSize:11, color:"#475569" }}>{prono.home}–{prono.away} → <span style={{ color:"#94a3b8" }}>{m.score[0]}–{m.score[1]}</span></div>
            <span style={{ padding:"2px 9px", borderRadius:20, fontSize:10, fontWeight:800, background:pts>=9?"rgba(74,222,128,0.15)":pts>=4?"rgba(250,204,21,0.15)":"rgba(248,113,113,0.12)", color:pts>=9?"#4ade80":pts>=4?"#facc15":"#f87171" }}>{pts>0?`+${pts}`:"0"}</span>
          </div>
        );
      })}
      {recentResults.length === 0 && <div style={{ textAlign:"center", padding:"20px 0", color:"#334155", fontSize:13 }}>Aucun match joué pour l'instant ⏳</div>}
      <button onClick={onLogout} style={{ width:"100%", marginTop:20, background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:12, padding:13, fontSize:13, color:"#f87171", cursor:"pointer", fontWeight:700 }}>
        Changer de joueur
      </button>
    </div>
  );
}

function BottomNav({ tab, setTab }) {
  return (
    <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"rgba(8,12,24,0.97)", backdropFilter:"blur(20px)", borderTop:"1px solid rgba(250,204,21,0.1)", display:"flex", padding:"7px 0 14px" }}>
      {[["matchs","⚽","Matchs"],["classement","🏆","Classement"],["profil","👤","Profil"]].map(([k,icon,label])=>(
        <button key={k} onClick={()=>setTab(k)} style={{ flex:1, background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"3px 0" }}>
          <span style={{ fontSize:21, filter:tab===k?"none":"grayscale(1) opacity(0.4)" }}>{icon}</span>
          <span style={{ fontSize:10, fontWeight:800, letterSpacing:0.5, color:tab===k?"#facc15":"#334155" }}>{label}</span>
          {tab===k && <div style={{ width:18, height:2, background:"#facc15", borderRadius:2, marginTop:1 }} />}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("matchs");
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cdm_user")); } catch { return null; }
  });
  const [users, setUsers] = useState({});
  const [pronos, setPronos] = useState({});
  const [myPronos, setMyPronos] = useState({});
  const [scores, setScores] = useState(KNOWN_SCORES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers().then(u => { setUsers(u); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    getPronos(currentUser.username).then(setMyPronos);
  }, [currentUser]);

  useEffect(() => {
    const unsub = subscribeToScores(fbScores => {
      setScores({ ...KNOWN_SCORES, ...fbScores });
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeToPronos(setPronos);
    return unsub;
  }, []);

  const handleLogin = useCallback((user) => {
    setCurrentUser(user);
    localStorage.setItem("cdm_user", JSON.stringify(user));
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem("cdm_user");
  }, []);

  const handleSaveUsers = useCallback(async (newUsers) => {
    setUsers(newUsers);
    await saveUsers(newUsers);
  }, []);

  const handleSaveProno = useCallback(async (matchId, prono) => {
    setMyPronos(prev => ({ ...prev, [matchId]: prono }));
    await saveProno(currentUser.username, matchId, prono);
  }, [currentUser]);

  const matches = CDM_MATCHES.map(m => ({
    ...m,
    score: scores[m.id] || null,
    status: getStatus(m, scores),
  }));

  const leaderboard = Object.entries(users).map(([username, userData]) => {
    const userPronos = pronos[username] || {};
    let total = 0, exact = 0, bon = 0, bonne = 0;
    matches.forEach(m => {
      if (!m.score) return;
      const prono = userPronos[m.id];
      if (!prono) return;
      const pts = calcPoints(prono, m.score, m.phase);
      if (pts === null) return;
      total += pts;
      const ph = parseInt(prono.home), pa = parseInt(prono.away);
      if (ph === m.score[0] && pa === m.score[1]) exact++;
      else if ((ph - pa) === (m.score[0] - m.score[1])) bon++;
      else if ((ph > pa) === (m.score[0] > m.score[1]) && (ph === pa) === (m.score[0] === m.score[1])) bonne++;
    });
    return { username, total, exact, bon, bonne, avatar: userData.avatar };
  }).sort((a, b) => b.total - a.total);

  if (loading) {
    return (
      <div style={{ background:"#080c18", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center", color:"#facc15" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>⚽</div>
          <div style={{ fontSize:14, color:"#475569" }}>Chargement...</div>
        </div>
      </div>
    );
  }
