// Appelle la Vercel Function /api/scores qui fait le vrai appel API côté serveur.
// Renvoie { scores: {matchId:[h,a]}, status: {matchId:"live"|"finished"} }
export async function fetchLiveScores() {
  try {
    const res = await fetch("/api/scores");
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    const data = await res.json();
    return { scores: data.scores || {}, status: data.status || {} };
  } catch (e) {
    console.warn("Impossible de récupérer les scores:", e.message);
    return { scores: {}, status: {} };
  }
}
