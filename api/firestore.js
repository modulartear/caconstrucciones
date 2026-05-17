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

const collections = {
  materials: 'materials',
  projects: 'projects',
  budgets: 'budgets',
  clients: 'clients',
  testimonials: 'testimonials',
  brands: 'brands',
  site: 'site'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Extraer tipo de colección de query param: /api/firestore?type=materials
    const type = req.query.type || req.body?.type;

    if (!type || !collections[type]) {
      return res.status(400).json({ error: 'Invalid type. Must be one of: ' + Object.keys(collections).join(', ') });
    }

    const collectionName = collections[type];

    // GET: obtener datos
    if (req.method === 'GET') {
      if (type === 'site') {
        const doc = await db.collection(collectionName).doc('config').get();
        return res.status(200).json(doc.exists ? doc.data() : {});
      } else {
        let query = db.collection(collectionName);
        if (type === 'budgets') {
          query = query.orderBy('date', 'desc');
        }
        const snapshot = await query.get();
        return res.status(200).json(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
      }
    }

    // POST: crear/actualizar
    if (req.method === 'POST') {
      const data = req.body;

      if (!data.name && !data.title && !data.client && type !== 'site') {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (type === 'site') {
        await db.collection(collectionName).doc('config').set(data, { merge: true });
        return res.status(201).json(data);
      } else {
        const id = data.id || type[0] + '_' + Math.random().toString(36).slice(2, 9);
        const docData = { ...data, id };
        await db.collection(collectionName).doc(id).set(docData, { merge: true });
        return res.status(201).json(docData);
      }
    }

    // DELETE: eliminar
    if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }

      await db.collection(collectionName).doc(id).delete();
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
