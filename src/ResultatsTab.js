import { useState } from "react";
import { FLAGS } from "./flags";
import { computeGroupStandings, computeThirdPlaceRanking } from "./standings";

// ─── Helpers ────────────────────────────────────────────────────────────
function formatBracketDate(dateStr, timeStr) {
  const d = new Date(`${dateStr}T${timeStr}:00`);
  const date = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  day: "numeric",
  month: "long",
  year: "numeric"
}).format(d);

const time = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  hour: "2-digit",
  minute: "2-digit"
}).format(d);

return `${date} - ${time}`;
}

const PHASE_COLUMNS = [
  { phase: "r32", title: "32e de finale" },
  { phase: "r16", title: "8e de finale" },
  { phase: "qf",  title: "Quarts" },
  { phase: "sf",  title: "Demi-finales" },
  { phase: "final", title: "Finale" },
];

// ─── Tableau de classement d'un groupe ─────────────────────────────────────
function GroupTable({ group, teams }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"12px 12px 8px", marginBottom:12 }}>
      <div style={{ fontSize:12, fontWeight:800, color:"#facc15", letterSpacing:1, marginBottom:8, textTransform:"uppercase" }}>{group}</div>
      <div style={{ display:"grid", gridTemplateColumns:"22px 1fr 28px 28px 28px 28px 36px 32px", gap:4, fontSize:10, color:"#475569", fontWeight:700, marginBottom:4, padding:"0 4px" }}>
        <span></span><span>Équipe</span><span style={{textAlign:"center"}}>MJ</span><span style={{textAlign:"center"}}>V</span><span style={{textAlign:"center"}}>N</span><span style={{textAlign:"center"}}>D</span><span style={{textAlign:"center"}}>Diff</span><span style={{textAlign:"center"}}>Pts</span>
      </div>
      {teams.map((t, idx) => {
        const color = idx <= 1 ? "#4ade80" : idx === 2 ? "#facc15" : "#f87171";
        const bg = idx <= 1 ? "rgba(74,222,128,0.06)" : idx === 2 ? "rgba(250,204,21,0.06)" : "rgba(248,113,113,0.05)";
        return (
          <div key={t.team} style={{ display:"grid", gridTemplateColumns:"22px 1fr 28px 28px 28px 28px 36px 32px", gap:4, alignItems:"center", fontSize:12, padding:"6px 4px", borderRadius:6, background:bg, marginBottom:2 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:color, display:"inline-block" }}></span>
            <span style={{ fontWeight:700, color:"#f1f5f9", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{FLAGS[t.team]||"🏳️"} {t.team}</span>
            <span style={{ textAlign:"center", color:"#94a3b8" }}>{t.mj}</span>
            <span style={{ textAlign:"center", color:"#94a3b8" }}>{t.v}</span>
            <span style={{ textAlign:"center", color:"#94a3b8" }}>{t.n}</span>
            <span style={{ textAlign:"center", color:"#94a3b8" }}>{t.d}</span>
            <span style={{ textAlign:"center", color:"#94a3b8" }}>{t.diff > 0 ? `+${t.diff}` : t.diff}</span>
            <span style={{ textAlign:"center", fontWeight:900, color }}>{t.pts}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tableau des meilleurs 3es ──────────────────────────────────────────────
function ThirdPlaceTable({ thirds }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"12px 12px 8px", marginTop:6, marginBottom:18 }}>
      <div style={{ fontSize:12, fontWeight:800, color:"#facc15", letterSpacing:1, marginBottom:2, textTransform:"uppercase" }}>🥉 Meilleurs 3es de groupe</div>
      <div style={{ fontSize:10, color:"#475569", marginBottom:8 }}>Les 8 premiers sont qualifiés pour les 32es de finale</div>
      <div style={{ display:"grid", gridTemplateColumns:"22px 50px 1fr 28px 28px 28px 28px 36px 32px", gap:4, fontSize:10, color:"#475569", fontWeight:700, marginBottom:4, padding:"0 4px" }}>
        <span></span><span>Grp</span><span>Équipe</span><span style={{textAlign:"center"}}>MJ</span><span style={{textAlign:"center"}}>V</span><span style={{textAlign:"center"}}>N</span><span style={{textAlign:"center"}}>D</span><span style={{textAlign:"center"}}>Diff</span><span style={{textAlign:"center"}}>Pts</span>
      </div>
      {thirds.map((t, idx) => {
        const qualified = idx < 8;
        const color = qualified ? "#4ade80" : "#f87171";
        const bg = qualified ? "rgba(74,222,128,0.06)" : "rgba(248,113,113,0.05)";
        return (
          <div key={t.group} style={{ display:"grid", gridTemplateColumns:"22px 50px 1fr 28px 28px 28px 28px 36px 32px", gap:4, alignItems:"center", fontSize:12, padding:"6px 4px", borderRadius:6, background:bg, marginBottom:2 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:color, display:"inline-block" }}></span>
            <span style={{ fontSize:10, color:"#64748b", fontWeight:700 }}>{t.group.replace("Groupe ","Grp ")}</span>
            <span style={{ fontWeight:700, color:"#f1f5f9", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{FLAGS[t.team]||"🏳️"} {t.team}</span>
            <span style={{ textAlign:"center", color:"#94a3b8" }}>{t.mj}</span>
            <span style={{ textAlign:"center", color:"#94a3b8" }}>{t.v}</span>
            <span style={{ textAlign:"center", color:"#94a3b8" }}>{t.n}</span>
            <span style={{ textAlign:"center", color:"#94a3b8" }}>{t.d}</span>
            <span style={{ textAlign:"center", color:"#94a3b8" }}>{t.diff > 0 ? `+${t.diff}` : t.diff}</span>
            <span style={{ textAlign:"center", fontWeight:900, color }}>{t.pts}</span>
          </div>
        );
      })}
      {/* Légende */}
      <div style={{ display:"flex", gap:14, marginTop:10, paddingTop:8, borderTop:"1px solid rgba(255,255,255,0.05)", fontSize:10, color:"#475569" }}>
        <span><span style={{color:"#4ade80"}}>●</span> Qualifié</span>
        <span><span style={{color:"#f87171"}}>●</span> Éliminé</span>
      </div>
    </div>
  );
}

// ─── Carte de match (bracket) ───────────────────────────────────────────────
function BracketCard({ match }) {
  const { home, away, score, date, time } = match;
  const f1 = FLAGS[home], f2 = FLAGS[away];
  return (
    <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"8px 10px", minWidth:170, marginBottom:10 }}>
      <div style={{ fontSize:9, color:"#475569", marginBottom:6, fontWeight:600 }}>{formatBracketDate(date, time)}</div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"3px 0" }}>
        <span style={{ fontSize:12, fontWeight:700, color:"#f1f5f9", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:120 }}>
          {f1 ? `${f1} ` : ""}{home}
        </span>
        {score && <span style={{ fontSize:14, fontWeight:900, color:"#facc15" }}>{score[0]}</span>}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"3px 0" }}>
        <span style={{ fontSize:12, fontWeight:700, color:"#f1f5f9", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:120 }}>
          {f2 ? `${f2} ` : ""}{away}
        </span>
        {score && <span style={{ fontSize:14, fontWeight:900, color:"#facc15" }}>{score[1]}</span>}
      </div>
    </div>
  );
}

// ─── Bracket phase finale ────────────────────────────────────────────────
function BracketView({ matches }) {
  const thirdPlace = matches.find(m => m.phase === "3rd");
  return (
    <div>
      <div style={{ overflowX:"auto", display:"flex", gap:18, paddingBottom:12, paddingTop:4 }}>
        {PHASE_COLUMNS.map(col => {
          const colMatches = matches.filter(m => m.phase === col.phase);
          if (colMatches.length === 0) return null;
          return (
            <div key={col.phase} style={{ flexShrink:0, display:"flex", flexDirection:"column" }}>
              <div style={{ fontSize:11, color:"#facc15", fontWeight:800, letterSpacing:1, textTransform:"uppercase", marginBottom:10, textAlign:"center" }}>{col.title}</div>
              <div style={{ display:"flex", flexDirection:"column", justifyContent:"space-around", flex:1, gap:8 }}>
                {colMatches.map(m => <BracketCard key={m.id} match={m} />)}
              </div>
            </div>
          );
        })}
      </div>
      {thirdPlace && (
        <div style={{ marginTop:8 }}>
          <div style={{ fontSize:11, color:"#60a5fa", fontWeight:800, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>🥉 Match pour la 3e place</div>
          <BracketCard match={thirdPlace} />
        </div>
      )}
      <div style={{ textAlign:"center", fontSize:10, color:"#334155", marginTop:8 }}>
        ⬅️ Glisse pour voir tous les tours ➡️
      </div>
    </div>
  );
}

// ─── Composant principal ────────────────────────────────────────────────
export default function ResultatsTab({ matches }) {
  const [sub, setSub] = useState("poules");

  const standings = computeGroupStandings(matches);
  const thirds = computeThirdPlaceRanking(standings);

  return (
    <div style={{ padding:"14px 14px 0" }}>
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {[["poules","📋 Phase de poules"],["finale","🏆 Phase finale"]].map(([k,l]) => (
          <button key={k} onClick={() => setSub(k)} style={{
            flex:1, padding:"9px 4px", borderRadius:9, fontSize:12, fontWeight:700,
            border: sub===k ? "1px solid #facc15" : "1px solid rgba(255,255,255,0.08)",
            background: sub===k ? "rgba(250,204,21,0.12)" : "rgba(255,255,255,0.02)",
            color: sub===k ? "#facc15" : "#475569", cursor:"pointer"
          }}>{l}</button>
        ))}
      </div>

      {sub === "poules" && (
        <div>
          <div style={{ display:"flex", gap:10, marginBottom:10, fontSize:10, color:"#475569" }}>
            <span><span style={{color:"#4ade80"}}>●</span> Qualifié (1er/2e)</span>
            <span><span style={{color:"#facc15"}}>●</span> En course (3e)</span>
            <span><span style={{color:"#f87171"}}>●</span> Éliminé (4e)</span>
          </div>
          {Object.entries(standings).map(([group, teams]) => (
            <GroupTable key={group} group={group} teams={teams} />
          ))}
          <ThirdPlaceTable thirds={thirds} />
        </div>
      )}

      {sub === "finale" && <BracketView matches={matches} />}
    </div>
  );
}
