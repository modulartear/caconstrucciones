import admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const auth = admin.auth();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { action } = req.body;

    // Verificar token de Firebase
    if (action === 'verify') {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'Sin token' });
      }

      try {
        const decodedToken = await auth.verifyIdToken(token);
        const uid = decodedToken.uid;

        const adminDoc = await db.collection('admins').doc(uid).get();
        if (!adminDoc.exists) {
          return res.status(403).json({ error: 'No es administrador' });
        }

        return res.status(200).json({ success: true, email: decodedToken.email });
      } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
      }
    }

    res.status(400).json({ error: 'Acción inválida' });
  } catch (error) {
    console.error('[Auth API Error]', error);
    res.status(500).json({ error: error.message });
  }
}
