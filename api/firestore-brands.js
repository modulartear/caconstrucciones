import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    if (req.method === 'GET') {
      const snapshot = await db.collection('brands').get();
      return res.status(200).json(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
    }
    if (req.method === 'POST') {
      const { id, name } = req.body;
      if (!name) return res.status(400).json({ error: 'Name is required' });
      const docId = id || 'b_' + Math.random().toString(36).slice(2, 9);
      const data = { id: docId, name };
      await db.collection('brands').doc(docId).set(data, { merge: true });
      return res.status(201).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await db.collection('brands').doc(id).delete();
      return res.status(200).json({ success: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
