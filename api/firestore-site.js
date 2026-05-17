import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    if (req.method === 'GET') {
      const doc = await db.collection('site').doc('config').get();
      return res.status(200).json(doc.exists ? doc.data() : {});
    }
    if (req.method === 'POST') {
      const data = req.body;
      await db.collection('site').doc('config').set(data, { merge: true });
      return res.status(201).json(data);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
