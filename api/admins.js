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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];

    // GET: Listar todos los admins
    if (req.method === 'GET') {
      const snapshot = await db.collection('admins').get();
      return res.status(200).json(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }

    // POST: Crear nuevo admin
    if (req.method === 'POST') {
      if (!token) {
        return res.status(401).json({ error: 'Sin autorización' });
      }

      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña requeridos' });
      }

      try {
        const verifiedToken = await auth.verifyIdToken(token);
        const creatorEmail = verifiedToken.email;

        const userRecord = await auth.createUser({ email, password });

        await db.collection('admins').doc(userRecord.uid).set({
          email,
          uid: userRecord.uid,
          createdAt: new Date(),
          createdBy: creatorEmail
        });

        return res.status(201).json({
          success: true,
          uid: userRecord.uid,
          email: email
        });
      } catch (error) {
        if (error.code === 'auth/email-already-exists') {
          return res.status(400).json({ error: 'El email ya está registrado' });
        }
        throw error;
      }
    }

    // DELETE: Eliminar admin
    if (req.method === 'DELETE') {
      if (!token) {
        return res.status(401).json({ error: 'Sin autorización' });
      }

      const { uid } = req.body;

      if (!uid) {
        return res.status(400).json({ error: 'UID requerido' });
      }

      try {
        await auth.verifyIdToken(token);
        await auth.deleteUser(uid);
        await db.collection('admins').doc(uid).delete();

        return res.status(200).json({ success: true });
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        throw error;
      }
    }

    res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('[Admins API Error]', error);
    res.status(500).json({ error: error.message });
  }
}
