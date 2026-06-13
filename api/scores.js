// api/scores.js
// Vercel Serverless Function
// Source : worldcup26.ir

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");

  try {
    const response = await fetch("https://worldcup26.ir/get/games");

    if (!response.ok) {
      throw new Error(`API error ${response.status}`);
    }

    const data = await response.json();
    const games = Array.isArray(data) ? data : data.games || [];

    const scores = {};

    games.forEach((game) => {
      const status = (
        game.time_elapsed ||
        game.status ||
        game.state ||
        ""
      ).toLowerCase();

      const isActive =
        game.finished === "TRUE" ||
        status.includes("finish") ||
        status.includes("live") ||
        status.includes("progress") ||
        status === "ft" ||
        status === "1h" ||
        status === "2h" ||
        status === "ht";

      if (!isActive) return;

      const matchId = parseInt(game.id);

      const homeScore = parseInt(game.home_score ?? 0);
      const awayScore = parseInt(game.away_score ?? 0);

      if (
        Number.isNaN(matchId) ||
        Number.isNaN(homeScore) ||
        Number.isNaN(awayScore)
      ) {
        return;
      }

      scores[matchId] = [homeScore, awayScore];
    });

    return res.status(200).json({
      scores,
      totalGames: games.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Erreur API scores :", err);

    return res.status(500).json({
      error: err.message,
      scores: {},
    });
  }
}
