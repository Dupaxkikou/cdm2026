export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://api.football-data.org/v4/competitions/WC/matches",
      {
        headers: {
          "X-Auth-Token": process.env.FOOTBALL_API_KEY
        }
      }
    );

    const data = await response.json();

    // on renvoie juste les infos pour tester
    const matches = data.matches.map((m) => ({
      home: m.homeTeam.name,
      away: m.awayTeam.name,
      status: m.status,
      scoreHome: m.score.fullTime.home,
      scoreAway: m.score.fullTime.away
    }));

    res.status(200).json({
      totalMatches: matches.length,
      sample: matches.slice(0, 3)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur API football" });
  }
}
