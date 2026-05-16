import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

// Inicializar Firebase Admin con credenciales
let db = null;

function getDB() {
  if (!db) {
    try {
      // Parseamos las credenciales desde la variable de entorno
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }

      db = admin.firestore();
    } catch (error) {
      console.error('Error inicializando Firebase:', error);
      throw error;
    }
  }
  return db;
}

export default getDB;
