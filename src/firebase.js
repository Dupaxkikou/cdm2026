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

// ── Scores (live depuis Firestore, mis à jour manuellement ou auto) ─────────
export function subscribeToScores(cb) {
  return onSnapshot(doc(db, "app", "scores"), (snap) => {
    cb(snap.exists() ? snap.data() : {});
  });
}

// ── Classement (écoute tous les pronos en temps réel) ──────────────────────
export function subscribeToPronos(cb) {
  return onSnapshot(collection(db, "pronos"), (snap) => {
    const all = {};
    snap.forEach(d => { all[d.id] = d.data(); });
    cb(all);
  });
}
