import { collectionHandlers } from '../lib/firestore-common.js';
import { db, initError } from '../lib/firestore-common.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!db) {
    return res.status(500).json({
      error: 'Firestore no inicializado. ' +
        (initError || 'Define FIREBASE_SERVICE_ACCOUNT en Vercel Environment Variables.')
    });
  }

  try {
    const collectionName =
      req.query.collection ||
      req.query.name ||
      extractFromPath(req);

    if (!collectionName) {
      return res.status(400).json({ error: 'Missing collection parameter' });
    }

    const handlers = collectionHandlers[collectionName];
    if (!handlers) {
      return res.status(400).json({ error: `Invalid collection: ${collectionName}` });
    }

    if (req.method === 'GET') {
      if (!handlers.get) return res.status(405).json({ error: 'Method not allowed' });
      const result = await handlers.get();
      return res.status(200).json(result);
    }

    if (req.method === 'POST') {
      if (!handlers.post) return res.status(405).json({ error: 'Method not allowed' });
      const result = await handlers.post(req.body || {});
      return res.status(201).json(result);
    }

    if (req.method === 'DELETE') {
      if (!handlers.delete) return res.status(405).json({ error: 'Method not allowed' });
      const result = await handlers.delete(req.body || {});
      return res.status(200).json(result);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('❌ firestore unified error:', error);
    res.status(500).json({ error: error.message });
  }
}

function extractFromPath(req) {
  try {
    const url = req.url || '';
    const m = url.match(/\/api\/firestore-([a-zA-Z0-9_-]+)/);
    if (m) return m[1];
  } catch (_) {}
  return null;
}
