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
      const snapshot = await db.collection('materials').get();
      const materials = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      return res.status(200).json(materials);
    }

    if (req.method === 'POST') {
      const { id, name, category, texture, color, accent, price, unit, photo, description, stock } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Material name is required' });
      }

      const docId = id || 'm_' + Math.random().toString(36).slice(2, 9);
      const data = {
        id: docId,
        name,
        category,
        texture,
        color,
        accent,
        price: parseFloat(price),
        unit,
        photo,
        description,
        stock: parseInt(stock) || 0,
        created_at: new Date()
      };

      await db.collection('materials').doc(docId).set(data, { merge: true });
      return res.status(201).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }
      await db.collection('materials').doc(id).delete();
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
