// ─── RÉCUPÉRATION AUTOMATIQUE DES SCORES ─────────────────────────────────
// football-data.org API - Coupe du Monde 2026 (competition id: 2000)

const API_KEY = "7db49931e95e403a91c11dfb7e5f3c88";
const API_URL = "https://api.football-data.org/v4/competitions/2000/matches";

// Mapping noms API → noms dans notre app
const TEAM_MAP = {
  "Mexico": "Mexico",
  "South Africa": "South Africa",
  "Korea Republic": "South Korea",
  "Czechia": "Czechia",
  "Czech Republic": "Czechia",
  "Canada": "Canada",
  "Bosnia and Herzegovina": "Bosnia and Herzegovina",
  "Qatar": "Qatar",
  "Switzerland": "Switzerland",
  "Brazil": "Brazil",
  "Morocco": "Morocco",
  "Haiti": "Haiti",
  "Scotland": "Scotland",
  "United States": "USA",
  "USA": "USA",
  "Paraguay": "Paraguay",
  "Australia": "Australia",
  "Turkey": "Turkey",
  "Türkiye": "Turkey",
  "Germany": "Germany",
  "Curaçao": "Curaçao",
  "Curacao": "Curaçao",
  "Ivory Coast": "Ivory Coast",
  "Côte d'Ivoire": "Ivory Coast",
  "Ecuador": "Ecuador",
  "Netherlands": "Netherlands",
  "Japan": "Japan",
  "Sweden": "Sweden",
  "Tunisia": "Tunisia",
  "Belgium": "Belgium",
  "Egypt": "Egypt",
  "Iran": "Iran",
  "New Zealand": "New Zealand",
  "Spain": "Spain",
  "Cape Verde": "Cape Verde",
  "Saudi Arabia": "Saudi Arabia",
  "Uruguay": "Uruguay",
  "France": "France",
  "Senegal": "Senegal",
  "Iraq": "Iraq",
  "Norway": "Norway",
  "Argentina": "Argentina",
  "Algeria": "Algeria",
  "Austria": "Austria",
  "Jordan": "Jordan",
  "Portugal": "Portugal",
  "DR Congo": "DR Congo",
  "Congo DR": "DR Congo",
  "Democratic Republic of Congo": "DR Congo",
  "Uzbekistan": "Uzbekistan",
  "Colombia": "Colombia",
  "England": "England",
  "Croatia": "Croatia",
  "Ghana": "Ghana",
  "Panama": "Panama",
};

// Nos matchs avec home/away pour faire le matching
import { CDM_MATCHES } from "./matches";

export async function fetchLiveScores() {
  try {
    const res = await fetch(API_URL, {
      headers: { "X-Auth-Token": API_KEY }
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();

    const newScores = {};

    (data.matches || []).forEach(apiMatch => {
      const score = apiMatch.score;
      // On prend le score final (FINISHED) ou en cours (IN_PLAY, PAUSED)
      if (!["FINISHED", "IN_PLAY", "PAUSED"].includes(apiMatch.status)) return;

      const apiHome = TEAM_MAP[apiMatch.homeTeam?.name] || apiMatch.homeTeam?.name;
      const apiAway = TEAM_MAP[apiMatch.awayTeam?.name] || apiMatch.awayTeam?.name;

      // Cherche le match correspondant dans notre liste
      const ourMatch = CDM_MATCHES.find(m =>
        m.home === apiHome && m.away === apiAway
      );
      if (!ourMatch) return;

      const homeGoals = score?.fullTime?.home ?? score?.regularTime?.home;
      const awayGoals = score?.fullTime?.away ?? score?.regularTime?.away;

      if (homeGoals !== null && homeGoals !== undefined &&
          awayGoals !== null && awayGoals !== undefined) {
        newScores[ourMatch.id] = [homeGoals, awayGoals];
      }
    });

    return newScores;
  } catch (e) {
    console.warn("Score fetch failed:", e);
    return null;
  }
}
