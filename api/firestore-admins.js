import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const snapshot = await db.collection('admins').get();
      const admins = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      return res.status(200).json(admins);
    }

    if (req.method === 'POST') {
      console.log('firestore-admins POST received:', req.body);
      const { id, username, email, password, createdAt, createdBy } = req.body;

      if (!username && !email) {
        return res.status(400).json({ error: 'Username or email is required' });
      }
      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }

      const docId = id || 'a_' + Math.random().toString(36).slice(2, 9);
      const data = {
        id: docId,
        username,
        email,
        password,
        createdAt: createdAt || new Date(),
        createdBy: createdBy || 'system',
      };

      console.log('Saving admin to Firestore:', data);
      await db.collection('admins').doc(docId).set(data, { merge: true });
      return res.status(201).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }
      await db.collection('admins').doc(id).delete();
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
