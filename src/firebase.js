import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDZidqVKCZsbxGKUMb0hPfXQG0ol3_08bY",
  authDomain: "cdm2026-3ee02.firebaseapp.com",
  projectId: "cdm2026-3ee02",
  storageBucket: "cdm2026-3ee02.firebasestorage.app",
  messagingSenderId: "1064078574230",
  appId: "1:1064078574230:web:4e4bdc1507816a206af8b7",
  measurementId: "G-3DMDF7EL6Z"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ── Users ──────────────────────────────────────────────────────────────────
export async function getUsers() {
  const snap = await getDoc(doc(db, "app", "users"));
  return snap.exists() ? snap.data() : {};
}
export async function saveUsers(users) {
  await setDoc(doc(db, "app", "users"), users);
}

// ── Pronos (1 doc par joueur) ──────────────────────────────────────────────
export async function getPronos(username) {
  const snap = await getDoc(doc(db, "pronos", username));
  return snap.exists() ? snap.data() : {};
}
export async function saveProno(username, matchId, prono) {
  await setDoc(doc(db, "pronos", username), { [matchId]: prono }, { merge: true });
}

// ── Scores (live depuis Firestore, mis à jour auto ou manuellement) ─────────
export function subscribeToScores(cb) {
  return onSnapshot(doc(db, "app", "scores"), (snap) => {
    cb(snap.exists() ? snap.data() : {});
  });
}

// ── Mise à jour manuelle d'un score (page Admin) ───────────────────────────
export async function setScore(matchId, homeScore, awayScore) {
  await setDoc(
    doc(db, "app", "scores"),
    { [matchId]: [homeScore, awayScore] },
    { merge: true }
  );
}

// ── Supprimer un score ─────────────────────────────────────────────────────
export async function deleteScore(matchId) {
  const snap = await getDoc(doc(db, "app", "scores"));
  if (!snap.exists()) return;
  const data = snap.data();
  delete data[matchId];
  await setDoc(doc(db, "app", "scores"), data);
}

// ── Classement (écoute tous les pronos en temps réel) ──────────────────────
export function subscribeToPronos(cb) {
  return onSnapshot(collection(db, "pronos"), (snap) => {
    const all = {};
    snap.forEach(d => { all[d.id] = d.data(); });
    cb(all);
  });
}

// ── Sync Auto des scores depuis l'API externe ─────────────────────────────
// Mapping noms d'équipes API → noms dans l'app
const TEAM_NAME_MAP = {
  "United States": "USA",
  "South Korea": "South Korea",
  "Ivory Coast": "Ivory Coast",
  "Côte d'Ivoire": "Ivory Coast",
  "Bosnia & Herzegovina": "Bosnia and Herzegovina",
  "Bosnia-Herzegovina": "Bosnia and Herzegovina",
  "Curacao": "Curaçao",
  "Cape Verde Islands": "Cape Verde",
  "DR Congo": "DR Congo",
  "Democratic Republic of Congo": "DR Congo",
  "New Zealand": "New Zealand",
};

function normalizeTeam(name) {
  return TEAM_NAME_MAP[name] || name;
}

export async function syncScoresFromAPI() {
  try {
    const res = await fetch("https://worldcup2026-api.p.rapidapi.com/matches", {
      headers: {
        "x-rapidapi-host": "worldcup2026-api.p.rapidapi.com",
        "x-rapidapi-key": process.env.REACT_APP_RAPIDAPI_KEY || ""
      }
    });
    if (!res.ok) throw new Error("API error " + res.status);
    const data = await res.json();
    const newScores = {};
    for (const match of data) {
      if (match.status === "FT" || match.status === "AET" || match.status === "PEN") {
        const homeGoals = match.goals?.home ?? match.score?.fulltime?.home;
        const awayGoals = match.goals?.away ?? match.score?.fulltime?.away;
        if (homeGoals !== null && homeGoals !== undefined && awayGoals !== null && awayGoals !== undefined) {
          newScores[match.fixture?.id || match.id] = [homeGoals, awayGoals];
        }
      }
    }
    return newScores;
  } catch (e) {
    console.warn("syncScoresFromAPI error:", e.message);
    return null;
  }
}
