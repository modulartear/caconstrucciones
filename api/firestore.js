import { collectionHandlers } from '../lib/firestore-common.js';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'node:fs';

dotenv.config({ path: './backend/.env' });

const serviceAccount = readServiceAccount();
if (!admin.apps.length && serviceAccount) {
  const appConfig = {
    credential: admin.credential.cert(serviceAccount),
  };
  if (process.env.FIREBASE_DATABASE_URL) appConfig.databaseURL = process.env.FIREBASE_DATABASE_URL;
  admin.initializeApp(appConfig);
}
const db = admin.apps.length ? admin.firestore() : null;

function readServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;

  const value = raw.trim();
  if (value.startsWith('{')) return JSON.parse(value);

  if (fs.existsSync(value)) {
    return JSON.parse(fs.readFileSync(value, 'utf8'));
  }

  return JSON.parse(value);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
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
