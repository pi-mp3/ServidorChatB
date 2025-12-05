/**
 * firebaseConfig.ts
 * Initializes Firebase Admin SDK and exports Firestore instance
 * Configurado para Render.com con variables de entorno separadas
 */

import admin from "firebase-admin";

// Tomamos las variables de entorno
const { PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY } = process.env;

// Validación básica: asegúrate de que estén definidas
if (!PROJECT_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
  throw new Error(
    "❌ Firebase Admin variables are missing! Make sure PROJECT_ID, CLIENT_EMAIL, and PRIVATE_KEY are set in Render Environment."
  );
}

// Inicializamos Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: PROJECT_ID,
    clientEmail: CLIENT_EMAIL,
    // Reemplazamos los '\n' literales por saltos de línea reales
    privateKey: PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

console.log("✅ Firebase Admin initialized successfully");

// Exportamos Firestore como `db` para usar en otros servicios
export const db = admin.firestore();

// También exportamos `admin` por si necesitamos acceder a otras funciones
export default admin;
