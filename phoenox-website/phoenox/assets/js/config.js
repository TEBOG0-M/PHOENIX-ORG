// ─────────────────────────────────────────────────────────────
//  PHOENOX — site configuration
// ─────────────────────────────────────────────────────────────

// Brand constants. Change the name once, here, and the whole site follows.
export const BRAND = {
  name: "PHOENOX",
  tagline: "Restoring dignity. Rebuilding lives.",
  motto: "God hasn’t forsaken you, so we won’t either.",
  org: "PHOENOX Humanitarian Initiative",
  email: "tshiredo15@gmail.com",
  phone: "+27 81 353 3786",
  owner: "PTVOX Software",
  developer: "Phungo Tshiredo",
  inbox: "tshiredo15@gmail.com",
  address: "Pretoria, Gauteng, South Africa",
};

// Firebase web config.
// These values are the ones from the project's original firebase-config.js.
// To use a NEW Firebase project: Firebase console → Project settings → Your apps → Web app → copy the config here.
export const firebaseConfig = {
  apiKey: "AIzaSyAOkvP35qetifTuFVCgG4O9pH6vGXkPr4c",
  authDomain: "mamelodi-initiative-ngo.firebaseapp.com",
  projectId: "mamelodi-initiative-ngo",
  storageBucket: "mamelodi-initiative-ngo.firebasestorage.app",
  messagingSenderId: "264918646014",
  appId: "1:264918646014:web:ff406dd871a1122c83f9af",
  measurementId: "G-2G9GJSLQWM"
};

// "firebase" = real Firebase Auth + Firestore.
// "demo"     = everything stored in this browser only (no internet / no Firebase needed).
// "auto"     = use Firebase; if it cannot load, fall back to demo mode (shows a banner).
// You can force demo mode for a visit by adding ?demo=1 to any URL (and ?demo=0 to switch back).
export const MODE = "firebase";

// Approximate conversion to ZAR, used only to total donations made in USD / EUR.
export const FX = { ZAR: 1, USD: 18, EUR: 20 };
export const CURRENCY_SYMBOL = { ZAR: "R", USD: "$", EUR: "€" };
