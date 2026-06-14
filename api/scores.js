// Vercel Serverless Function
// Source : worldcup26.ir/get/games
//
// Renvoie pour chaque match mappé (1-72, phase de groupes) :
//  - le score actuel (même en direct, pas que les matchs terminés)
//  - le statut réel selon l'API : "live" ou "finished"
//
// Le front-end utilise ce statut comme source de vérité pour verrouiller
// les pronostics dès que le match commence, indépendamment de l'heure
// programmée dans matches.js.

const MAPPING = {
  1:{id:1},   2:{id:2},   3:{id:7},   4:{id:19},  5:{id:14},  6:{id:20},
  7:{id:13},  8:{id:8},   9:{id:26},  10:{id:25}, 11:{id:31}, 12:{id:32},
  13:{id:38}, 14:{id:43}, 15:{id:37}, 16:{id:44}, 17:{id:49}, 18:{id:50},
  19:{id:55}, 20:{id:56}, 21:{id:61}, 22:{id:67}, 23:{id:62}, 24:{id:68},
  25:{id:4},  26:{id:12}, 27:{id:11}, 28:{id:3},  29:{id:17}, 30:{id:18},
  31:{id:22}, 32:{id:21}, 33:{id:27}, 34:{id:28}, 35:{id:35}, 36:{id:36},
  37:{id:41}, 38:{id:42}, 39:{id:46}, 40:{id:45}, 41:{id:53}, 42:{id:54},
  43:{id:58}, 44:{id:57, swap:true}, 45:{id:65}, 46:{id:69, swap:true},
  47:{id:66}, 48:{id:70}, 49:{id:16, swap:true}, 50:{id:15},
  51:{id:6},  52:{id:5,  swap:true}, 53:{id:9},  54:{id:10, swap:true},
  55:{id:30}, 56:{id:29, swap:true}, 57:{id:24}, 58:{id:23, swap:true},
  59:{id:33}, 60:{id:34, swap:true}, 61:{id:51}, 62:{id:52, swap:true},
  63:{id:39}, 64:{id:40, swap:true}, 65:{id:48}, 66:{id:47, swap:true},
  67:{id:71, swap:true}, 68:{id:72}, 69:{id:60}, 70:{id:59, swap:true},
  71:{id:64, swap:true}, 72:{id:63},
  // 73-104 : phases finales, pas encore mappées (équipes pas encore connues)
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");

  try {
    const response = await fetch("https://worldcup26.ir/get/games");
    if (!response.ok) throw new Error(`API error ${response.status}`);
    const data = await response.json();
    const games = data.games || [];

    const scores = {};
    const status = {};

    games.forEach(g => {
      const apiId = parseInt(g.id);
      const map = MAPPING[apiId];
      if (!map) return;

      const finished = g.finished === "TRUE" || g.finished === true;
      const elapsed = (g.time_elapsed || "").toLowerCase();
      const live = !finished && elapsed && elapsed !== "notstarted";

      if (!finished && !live) return; // pas encore commencé -> on laisse le front gérer

      const h = parseInt(g.home_score);
      const a = parseInt(g.away_score);
      if (isNaN(h) || isNaN(a)) return;

      scores[map.id] = map.swap ? [a, h] : [h, a];
      status[map.id] = finished ? "finished" : "live";
    });

    res.status(200).json({ scores, status, totalGames: games.length, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error("Erreur API scores:", err);
    res.status(500).json({ error: err.message, scores: {}, status: {} });
  }
}
