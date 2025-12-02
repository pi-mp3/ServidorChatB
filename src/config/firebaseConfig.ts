/**
 * firebaseConfig.ts
 * Initializes Firebase Admin SDK
 */

import admin from "firebase-admin";

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountString) {
  throw new Error("❌ FIREBASE_SERVICE_ACCOUNT is missing or invalid");
}

let serviceAccount;

try {
  serviceAccount = JSON.parse(serviceAccountString);
} catch (err) {
  throw new Error("❌ FIREBASE_SERVICE_ACCOUNT JSON parse failed. Check formatting.");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// 👉 Firestore instance
export const db = admin.firestore();

// 👉 Still export admin if needed
export default admin;
