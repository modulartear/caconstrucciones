import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!admin.apps.length && serviceAccountRaw) {
  const serviceAccount = JSON.parse(serviceAccountRaw);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.apps.length ? admin.firestore() : null;
export { db };

const collectionHandlers = {
  materials: {
    async get() {
      const snapshot = await db.collection('materials').get();
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    },
    async post(data) {
      const { id, name, category, texture, color, accent, price, unit, photo, description, stock } = data;
      if (!name) throw new Error('Material name is required');
      const docId = id || 'm_' + Math.random().toString(36).slice(2, 9);
      const docData = { id: docId, name, category, texture, color, accent, price: parseFloat(price), unit, photo, description, stock: parseInt(stock) || 0, created_at: new Date() };
      await db.collection('materials').doc(docId).set(docData, { merge: true });
      return docData;
    },
    async delete(data) {
      const { id } = data;
      if (!id) throw new Error('ID is required');
      await db.collection('materials').doc(id).delete();
      return { success: true };
    }
  },
  projects: {
    async get() {
      const snapshot = await db.collection('projects').get();
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    },
    async post(data) {
      const { id, title, location, status, surface, year, description, cover, gallery, progress } = data;
      if (!title) throw new Error('Title is required');
      const docId = id || 'p_' + Math.random().toString(36).slice(2, 9);
      const docData = { id: docId, title, location, status, surface, year, description, cover, gallery: gallery || [], progress: progress || 0 };
      await db.collection('projects').doc(docId).set(docData, { merge: true });
      return docData;
    },
    async delete(data) {
      const { id } = data;
      if (!id) throw new Error('ID is required');
      await db.collection('projects').doc(id).delete();
      return { success: true };
    }
  },
  admins: {
    async get() {
      const snapshot = await db.collection('admins').get();
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    },
    async post(data) {
      const { id, username, email, password, createdAt, createdBy } = data;
      if (!username && !email) throw new Error('Username or email is required');
      if (!password) throw new Error('Password is required');
      const docId = id || 'a_' + Math.random().toString(36).slice(2, 9);
      const docData = { id: docId, username, email, password, createdAt: createdAt || new Date(), createdBy: createdBy || 'system' };
      await db.collection('admins').doc(docId).set(docData, { merge: true });
      return docData;
    },
    async delete(data) {
      const { id } = data;
      if (!id) throw new Error('ID is required');
      await db.collection('admins').doc(id).delete();
      return { success: true };
    }
  },
  brands: {
    async get() {
      const snapshot = await db.collection('brands').get();
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    },
    async post(data) {
      const { id, name } = data;
      if (!name) throw new Error('Name is required');
      const docId = id || 'b_' + Math.random().toString(36).slice(2, 9);
      const docData = { id: docId, name };
      await db.collection('brands').doc(docId).set(docData, { merge: true });
      return docData;
    },
    async delete(data) {
      const { id } = data;
      if (!id) throw new Error('ID is required');
      await db.collection('brands').doc(id).delete();
      return { success: true };
    }
  },
  budgets: {
    async get() {
      const snapshot = await db.collection('budgets').orderBy('date', 'desc').get();
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    },
    async post(data) {
      const { id, client, email, phone, type, surface, message, status, date } = data;
      if (!client) throw new Error('Client name is required');
      const docId = id || 'pres_' + Math.random().toString(36).slice(2, 9);
      const docData = { id: docId, client, email, phone, type, surface, message, status: status || 'nuevo', date };
      await db.collection('budgets').doc(docId).set(docData, { merge: true });
      return docData;
    },
    async delete(data) {
      const { id } = data;
      if (!id) throw new Error('ID is required');
      await db.collection('budgets').doc(id).delete();
      return { success: true };
    }
  },
  clients: {
    async get() {
      const snapshot = await db.collection('clients').get();
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    },
    async post(data) {
      const { id, name, email, phone, project, since } = data;
      if (!name) throw new Error('Name is required');
      const docId = id || 'c_' + Math.random().toString(36).slice(2, 9);
      const docData = { id: docId, name, email, phone, project, since };
      await db.collection('clients').doc(docId).set(docData, { merge: true });
      return docData;
    },
    async delete(data) {
      const { id } = data;
      if (!id) throw new Error('ID is required');
      await db.collection('clients').doc(id).delete();
      return { success: true };
    }
  },
  site: {
    async get() {
      const doc = await db.collection('site').doc('config').get();
      return doc.exists ? doc.data() : {};
    },
    async post(data) {
      await db.collection('site').doc('config').set(data, { merge: true });
      return data;
    }
  },
  testimonials: {
    async get() {
      const snapshot = await db.collection('testimonials').get();
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    },
    async post(data) {
      const { id, name, role, stars, text, avatar } = data;
      if (!name) throw new Error('Name is required');
      const docId = id || 't_' + Math.random().toString(36).slice(2, 9);
      const docData = { id: docId, name, role, stars: stars || 5, text, avatar };
      await db.collection('testimonials').doc(docId).set(docData, { merge: true });
      return docData;
    },
    async delete(data) {
      const { id } = data;
      if (!id) throw new Error('ID is required');
      await db.collection('testimonials').doc(id).delete();
      return { success: true };
    }
  }
};

export function createHandler(collectionName) {
  return async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    try {
      const handlers = collectionHandlers[collectionName];
      if (!handlers) {
        return res.status(400).json({ error: 'Invalid collection' });
      }

      if (req.method === 'GET') {
        if (!handlers.get) return res.status(405).json({ error: 'Method not allowed' });
        const result = await handlers.get();
        return res.status(200).json(result);
      }

      if (req.method === 'POST') {
        if (!handlers.post) return res.status(405).json({ error: 'Method not allowed' });
        const result = await handlers.post(req.body);
        return res.status(201).json(result);
      }

      if (req.method === 'DELETE') {
        if (!handlers.delete) return res.status(405).json({ error: 'Method not allowed' });
        const result = await handlers.delete(req.body);
        return res.status(200).json(result);
      }

      res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
      console.error('❌ firestore error:', error);
      res.status(500).json({ error: error.message });
    }
  };
}
