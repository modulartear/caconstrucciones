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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    // Verificar si ya existe algún admin
    const adminsSnapshot = await db.collection('admins').limit(1).get();
    if (!adminsSnapshot.empty) {
      return res.status(403).json({ error: 'Ya existe un administrador. Usa el panel para crear más.' });
    }

    // Crear usuario en Firebase Auth
    const userRecord = await auth.createUser({ email, password });

    // Crear documento en colección admins
    await db.collection('admins').doc(userRecord.uid).set({
      email,
      uid: userRecord.uid,
      createdAt: new Date(),
      createdBy: 'sistema (setup inicial)'
    });

    return res.status(201).json({
      success: true,
      message: 'Administrador inicial creado correctamente',
      email: email,
      uid: userRecord.uid
    });
  } catch (error) {
    console.error('[Setup API Error]', error);

    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    res.status(500).json({ error: error.message });
  }
}
