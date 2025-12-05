/**
 * firebaseConfig.ts
 * Initializes Firebase Admin SDK and exports Firestore instance
 * Configurado para Render.com con variables de entorno FIREBASE_…
 */

import admin from "firebase-admin";

// Tomamos las variables de entorno con el prefijo FIREBASE_
const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
} = process.env;

// Validación básica
if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  throw new Error(
    "❌ Firebase Admin variables are missing! Make sure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in Render Environment."
  );
}

// Inicializamos Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    // Convertimos los '\n' literales a saltos de línea reales
    privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

console.log("✅ Firebase Admin initialized successfully");

// Exportamos Firestore como `db` para usar en otros servicios
export const db = admin.firestore();

// También exportamos `admin` por si necesitamos otras funciones
export default admin;
