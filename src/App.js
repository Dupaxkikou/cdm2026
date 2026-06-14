import { useState, useEffect, useCallback } from "react";
import { getUsers, saveUsers, getPronos, saveProno, subscribeToScores, subscribeToPronos } from "./firebase";
import { fetchLiveScores } from "./scores";
import { CDM_MATCHES } from "./matches";

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
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers().then(u => { setUsers(u); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    getPronos(currentUser.username).then(setMyPronos);
  }, [currentUser]);

  // Récupération automatique des scores toutes les 5 minutes
  useEffect(() => {
  const loadScores = async () => {
    const apiScores = await fetchLiveScores();

    console.log("API SCORES =", apiScores);

    if (apiScores) setScores(apiScores);
  };

  loadScores();

  const interval = setInterval(loadScores, 5 * 60 * 1000);
  return () => clearInterval(interval);
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

  console.log("MATCH 1 =", {
  match: CDM_MATCHES[0],
  score: scores[1],
});
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

  if (!currentUser) return <AuthScreen users={users} onLogin={handleLogin} onSaveUsers={handleSaveUsers} />;

  const myRank = leaderboard.findIndex(u => u.username === currentUser.username) + 1;
  const myStats = leaderboard.find(u => u.username === currentUser.username) || {};

  return (
    <div style={{ background:"#080c18", minHeight:"100vh", fontFamily:"'Segoe UI',system-ui,sans-serif", color:"#f1f5f9", maxWidth:480, margin:"0 auto" }}>
      <div style={{ background:"linear-gradient(135deg,#080c18 0%,#111827 100%)", borderBottom:"1px solid rgba(250,204,21,0.15)", padding:"14px 16px 12px", position:"sticky", top:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:10, color:"#facc15", letterSpacing:2, fontWeight:800, textTransform:"uppercase" }}>⚽ CDM 2026 Pronos</div>
          <div style={{ fontSize:16, fontWeight:800, color:"#fff" }}>
            {currentUser.avatar} {currentUser.username}
            {myRank > 0 && <span style={{ fontSize:12, color:"#facc15", marginLeft:8 }}>#{myRank}</span>}
          </div>
        </div>
        <div style={{ background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.2)", borderRadius:20, padding:"6px 14px", fontSize:11, color:"#4ade80", fontWeight:700 }}>🔴 En direct</div>
      </div>
      <div style={{ paddingBottom:72 }}>
        {tab==="matchs" && <MatchsTab matches={matches} pronos={myPronos} onSave={handleSaveProno} />}
        {tab==="classement" && <ClassementTab board={leaderboard} currentUser={currentUser.username} />}
        {tab==="profil" && <ProfilTab user={currentUser} stats={myStats} rank={myRank} total={leaderboard.length} pronos={myPronos} matches={matches} onLogout={handleLogout} />}
      </div>
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}
