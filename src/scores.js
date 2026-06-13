// Appelle la Vercel Function /api/scores qui fait le vrai appel API côté serveur
export async function fetchLiveScores() {
  try {
    const res = await fetch("/api/scores");
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    const data = await res.json();
    return data.scores || {};
  } catch (e) {
    console.warn("Impossible de récupérer les scores:", e.message);
    return {};
  }
}
