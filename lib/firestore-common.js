import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'node:fs';

dotenv.config({ path: './backend/.env' });

let db = null;
let initError = null;

try {
  const serviceAccount = readServiceAccount();
  if (serviceAccount) {
    if (!admin.apps.length) {
      const appConfig = {
        credential: admin.credential.cert(serviceAccount),
      };
      if (process.env.FIREBASE_DATABASE_URL) appConfig.databaseURL = process.env.FIREBASE_DATABASE_URL;
      admin.initializeApp(appConfig);
    }
    db = admin.firestore();
  } else {
    initError = 'FIREBASE_SERVICE_ACCOUNT no definido en variables de entorno.';
  }
} catch (e) {
  initError = e.message || String(e);
  console.error('[firestore-common] Firebase init error:', e);
}

const FIRESTORE_WRITE_OPTIONS = { merge: true, ignoreUndefinedProperties: true };
export { db, initError, FIRESTORE_WRITE_OPTIONS };

function readServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;

  const value = raw.trim();

  if (value.startsWith('{')) {
    try { return JSON.parse(value); }
    catch (e) {
      console.error('[firestore-common] JSON.parse inline failed:', e.message);
      try { return JSON.parse(value.replace(/[\u0000-\u001F]/g, '')); }
      catch (_) { return null; }
    }
  }

  try {
    if (fs.existsSync(value)) {
      return JSON.parse(fs.readFileSync(value, 'utf8'));
    }
  } catch (e) {
    console.error('[firestore-common] leyendo archivo service-account:', e.message);
  }

  try { return JSON.parse(value); } catch (_) { return null; }
}

const collectionHandlers = {
  materials: {
    async get() {
      const snapshot = await db.collection('materials').get();
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    },
    async post(data) {
      const { id, name, category, texture, color, accent, price, unit, photo, description, stock, brand } = data;
      if (!name) throw new Error('Material name is required');
      const docId = id || 'm_' + Math.random().toString(36).slice(2, 9);
      const docData = { id: docId, name, category, texture, color, accent, price: parseFloat(price), unit, photo, description, stock: parseInt(stock) || 0, brand: brand || null, created_at: new Date() };
      await db.collection('materials').doc(docId).set(docData, FIRESTORE_WRITE_OPTIONS);
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
      await db.collection('projects').doc(docId).set(docData, FIRESTORE_WRITE_OPTIONS);
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
      await db.collection('admins').doc(docId).set(docData, FIRESTORE_WRITE_OPTIONS);
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
      const { id, name, logo } = data;
      if (!name) throw new Error('Name is required');
      const docId = id || 'b_' + Math.random().toString(36).slice(2, 9);
      const docData = { id: docId, name, logo: logo || null };
      await db.collection('brands').doc(docId).set(docData, FIRESTORE_WRITE_OPTIONS);
      return docData;
    },
    async delete(data) {
      const { id } = data;
      if (!id) throw new Error('ID is required');
      await db.collection('brands').doc(id).delete();
      return { success: true };
    }
  },
  categories: {
    async get() {
      const snapshot = await db.collection('categories').get();
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    },
    async post(data) {
      const { id, name, description, order, color } = data || {};
      if (!name) throw new Error('Name is required');
      const docId = id || 'cat_' + Math.random().toString(36).slice(2, 9);
      const docData = {
        id: docId,
        name: name || '',
        description: description || '',
        order: parseInt(order) || 0,
        color: color || null,
      };
      await db.collection('categories').doc(docId).set(docData, FIRESTORE_WRITE_OPTIONS);
      return docData;
    },
    async delete(data) {
      const { id } = data;
      if (!id) throw new Error('ID is required');
      await db.collection('categories').doc(id).delete();
      return { success: true };
    }
  },
  budgets: {
    async get() {
      let snapshot;
      try {
        snapshot = await db.collection('budgets').orderBy('date', 'desc').get();
      } catch (e) {
        console.warn('budgets.get orderBy falló, leyendo sin orden:', e.message);
        snapshot = await db.collection('budgets').get();
      }
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      return docs.sort((a, b) => {
        const ad = a.date || '';
        const bd = b.date || '';
        if (ad < bd) return 1;
        if (ad > bd) return -1;
        return 0;
      });
    },
    async post(data) {
      const {
        id, client, email, phone, type, surface, message, status, date, locality,
        source, clientId, sessionId, visualizerImage, visualizerOriginalImage,
        visualizerScene, visualizerTarget, visualizerMaterialId, visualizerMaterialName,
        visualizerMaterialPhoto
      } = data || {};
      if (!client) throw new Error('Client name is required');
      const docId = id || 'pres_' + Math.random().toString(36).slice(2, 9);
      const docData = {
        id: docId,
        client: client || '',
        email: email || '',
        phone: phone || '',
        type: type || 'Obra nueva',
        surface: parseInt(surface) || 0,
        message: message || '',
        locality: locality || '',
        status: status || 'nuevo',
        date: date || new Date().toISOString().slice(0, 10),
        source: source || null,
        clientId: clientId || null,
        sessionId: sessionId || null,
        visualizerImage: visualizerImage || null,
        visualizerOriginalImage: visualizerOriginalImage || null,
        visualizerScene: visualizerScene || null,
        visualizerTarget: visualizerTarget || null,
        visualizerMaterialId: visualizerMaterialId || null,
        visualizerMaterialName: visualizerMaterialName || null,
        visualizerMaterialPhoto: visualizerMaterialPhoto || null,
      };
      await db.collection('budgets').doc(docId).set(docData, FIRESTORE_WRITE_OPTIONS);
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
      await db.collection('clients').doc(docId).set(docData, FIRESTORE_WRITE_OPTIONS);
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
      await db.collection('site').doc('config').set(data, FIRESTORE_WRITE_OPTIONS);
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
      await db.collection('testimonials').doc(docId).set(docData, FIRESTORE_WRITE_OPTIONS);
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

export { collectionHandlers };

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
