// src/config/firebaseConfig.ts
/**
 * Firebase Admin SDK configuration (definitivo)
 * --------------------------------------------
 * Usa la variable de entorno FIREBASE_SERVICE_ACCOUNT
 * que contiene todo el JSON del service account.
 *
 * Esto permite inicializar Firebase Admin para Firestore
 * y Auth sin exponer credenciales en el código.
 */

import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountString) {
  throw new Error("❌ FIREBASE_SERVICE_ACCOUNT missing in environment variables");
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountString);
} catch (e) {
  throw new Error("❌ FIREBASE_SERVICE_ACCOUNT is not valid JSON");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();
export const auth = admin.auth();

console.log("🔥 Firebase admin initialized");

