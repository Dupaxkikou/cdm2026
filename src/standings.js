// ─── CALCUL DES CLASSEMENTS DE GROUPES ─────────────────────────────────────
// Recalculé automatiquement à chaque changement de score

export function computeGroupStandings(matches) {
  const groups = {};

  matches.filter(m => m.phase === "group").forEach(m => {
    if (!groups[m.group]) groups[m.group] = {};
    [m.home, m.away].forEach(team => {
      if (!groups[m.group][team]) {
        groups[m.group][team] = { team, mj: 0, v: 0, n: 0, d: 0, bp: 0, bc: 0 };
      }
    });
    if (m.score) {
      const home = groups[m.group][m.home];
      const away = groups[m.group][m.away];
      home.mj++; away.mj++;
      home.bp += m.score[0]; home.bc += m.score[1];
      away.bp += m.score[1]; away.bc += m.score[0];
      if (m.score[0] > m.score[1]) { home.v++; away.d++; }
      else if (m.score[0] < m.score[1]) { away.v++; home.d++; }
      else { home.n++; away.n++; }
    }
  });

  const standings = {};
  Object.entries(groups).forEach(([group, teams]) => {
    const arr = Object.values(teams).map(t => ({
      ...t,
      diff: t.bp - t.bc,
      pts: t.v * 3 + t.n,
    }));
    // Tri: points > différence de buts > buts marqués
    arr.sort((a, b) => b.pts - a.pts || b.diff - a.diff || b.bp - a.bp);
    standings[group] = arr;
  });

  return standings;
}

// Classement des meilleurs 3es (8 qualifiés sur 12)
export function computeThirdPlaceRanking(standings) {
  const thirds = Object.entries(standings)
    .filter(([, arr]) => arr.length >= 3)
    .map(([group, arr]) => ({ group, ...arr[2] }));

  thirds.sort((a, b) => b.pts - a.pts || b.diff - a.diff || b.bp - a.bp);
  return thirds;
}
