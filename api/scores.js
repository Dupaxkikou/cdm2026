// Vercel Serverless Function — tourne côté serveur, pas de problème CORS
// Appelée par l'app toutes les 5 minutes

export default async function handler(req, res) {
  // Autorise l'app à appeler cette fonction
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const response = await fetch(
      "https://api.football-data.org/v4/competitions/2000/matches",
      { headers: { "X-Auth-Token": "7db49931e95e403a91c11dfb7e5f3c88" } }
    );

    if (!response.ok) {
      throw new Error(`football-data API error: ${response.status}`);
    }

    const data = await response.json();

    const TEAM_MAP = {
      "Mexico": "Mexico", "South Africa": "South Africa",
      "South Korea": "South Korea", "Korea Republic": "South Korea",
      "Czechia": "Czechia", "Czech Republic": "Czechia",
      "Canada": "Canada", "Bosnia and Herzegovina": "Bosnia and Herzegovina",
      "Qatar": "Qatar", "Switzerland": "Switzerland",
      "Brazil": "Brazil", "Morocco": "Morocco",
      "Haiti": "Haiti", "Scotland": "Scotland",
      "United States": "USA", "USA": "USA",
      "Paraguay": "Paraguay", "Australia": "Australia",
      "Turkey": "Turkey", "Türkiye": "Turkey",
      "Germany": "Germany", "Curaçao": "Curaçao", "Curacao": "Curaçao",
      "Ivory Coast": "Ivory Coast", "Côte d'Ivoire": "Ivory Coast",
      "Ecuador": "Ecuador", "Netherlands": "Netherlands",
      "Japan": "Japan", "Sweden": "Sweden", "Tunisia": "Tunisia",
      "Belgium": "Belgium", "Egypt": "Egypt", "Iran": "Iran",
      "New Zealand": "New Zealand", "Spain": "Spain",
      "Cape Verde": "Cape Verde", "Saudi Arabia": "Saudi Arabia",
      "Uruguay": "Uruguay", "France": "France", "Senegal": "Senegal",
      "Iraq": "Iraq", "Norway": "Norway", "Argentina": "Argentina",
      "Algeria": "Algeria", "Austria": "Austria", "Jordan": "Jordan",
      "Portugal": "Portugal", "DR Congo": "DR Congo",
      "Congo DR": "DR Congo", "Democratic Republic of Congo": "DR Congo",
      "Uzbekistan": "Uzbekistan", "Colombia": "Colombia",
      "England": "England", "Croatia": "Croatia",
      "Ghana": "Ghana", "Panama": "Panama",
    };

    // Correspondance nom équipe → id match dans notre app
    const MATCH_IDS = {
      "Mexico_South Africa": 1,
      "South Korea_Czechia": 2,
      "Canada_Bosnia and Herzegovina": 7,
      "Qatar_Switzerland": 8,
      "Bosnia and Herzegovina_Qatar": 9,
      "Canada_Switzerland": 10,
      "Canada_Qatar": 11,
      "Switzerland_Bosnia and Herzegovina": 12,
      "Brazil_Morocco": 13,
      "Haiti_Scotland": 14,
      "Morocco_Haiti": 15,
      "Brazil_Scotland": 16,
      "Brazil_Haiti": 17,
      "Scotland_Morocco": 18,
      "USA_Paraguay": 19,
      "Australia_Turkey": 20,
      "Turkey_Paraguay": 21,
      "USA_Australia": 22,
      "USA_Turkey": 23,
      "Paraguay_Australia": 24,
      "Germany_Curaçao": 25,
      "Ivory Coast_Ecuador": 26,
      "Germany_Ivory Coast": 27,
      "Ecuador_Curaçao": 28,
      "Germany_Ecuador": 29,
      "Curaçao_Ivory Coast": 30,
      "Netherlands_Japan": 31,
      "Sweden_Tunisia": 32,
      "Japan_Sweden": 33,
      "Netherlands_Tunisia": 34,
      "Netherlands_Sweden": 35,
      "Tunisia_Japan": 36,
      "Belgium_Egypt": 37,
      "Iran_New Zealand": 38,
      "Egypt_Iran": 39,
      "Belgium_New Zealand": 40,
      "Belgium_Iran": 41,
      "New Zealand_Egypt": 42,
      "Spain_Cape Verde": 43,
      "Saudi Arabia_Uruguay": 44,
      "Uruguay_Cape Verde": 45,
      "Spain_Saudi Arabia": 46,
      "Spain_Uruguay": 47,
      "Cape Verde_Saudi Arabia": 48,
      "France_Senegal": 49,
      "Iraq_Norway": 50,
      "Senegal_Iraq": 51,
      "France_Norway": 52,
      "France_Iraq": 53,
      "Norway_Senegal": 54,
      "Argentina_Algeria": 55,
      "Austria_Jordan": 56,
      "Algeria_Jordan": 57,
      "Argentina_Austria": 58,
      "Argentina_Jordan": 59,
      "Algeria_Austria": 60,
      "Portugal_DR Congo": 61,
      "Uzbekistan_Colombia": 62,
      "DR Congo_Uzbekistan": 63,
      "Portugal_Colombia": 64,
      "Portugal_Uzbekistan": 65,
      "Colombia_DR Congo": 66,
      "England_Croatia": 67,
      "Ghana_Panama": 68,
      "Croatia_Panama": 69,
      "England_Ghana": 70,
      "England_Panama": 71,
      "Croatia_Ghana": 72,
    };

    const scores = {};

    (data.matches || []).forEach(m => {
      if (!["FINISHED", "IN_PLAY", "PAUSED"].includes(m.status)) return;

      const home = TEAM_MAP[m.homeTeam?.name] || m.homeTeam?.name;
      const away = TEAM_MAP[m.awayTeam?.name] || m.awayTeam?.name;
      const key = `${home}_${away}`;
      const id = MATCH_IDS[key];
      if (!id) return;

      const h = m.score?.fullTime?.home ?? m.score?.regularTime?.home;
      const a = m.score?.fullTime?.away ?? m.score?.regularTime?.away;
      if (h !== null && h !== undefined && a !== null && a !== undefined) {
        scores[id] = [h, a];
      }
    });

    // Cache 5 minutes côté Vercel pour ne pas surcharger l'API
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    res.status(200).json({ scores, updatedAt: new Date().toISOString() });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message, scores: {} });
  }
}
