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
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, username, password } = req.body;

    // Login action
    if (action === 'login') {
      console.log('Login attempt:', { username, password });

      // Try Firestore first
      let adminData = null;

      // Check all admins
      const snapshot = await db.collection('admins').get();
      console.log('Total admins:', snapshot.size);

      for (const doc of snapshot.docs) {
        const data = doc.data();
        console.log('Checking admin:', data);

        if (data.username === username || data.email === username) {
          adminData = data;
          console.log('Found matching admin!');
          break;
        }
      }

      if (adminData) {
        if (adminData.password === password) {
          console.log('Password matches!');
          return res.status(200).json({
            success: true,
            token: Buffer.from(`${username}:${Date.now()}`).toString('base64')
          });
        } else {
          console.log('Password does not match');
        }
      } else {
        console.log('No admin found in Firestore');
      }

      // Fallback to env vars
      const adminUser = process.env.ADMIN_USERNAME || 'admin';
      const adminPass = process.env.ADMIN_PASSWORD || '1234';

      if (username === adminUser && password === adminPass) {
        return res.status(200).json({
          success: true,
          token: Buffer.from(`${username}:${Date.now()}`).toString('base64')
        });
      }

      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Verify token action
    if (action === 'verify') {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }
      try {
        const decoded = Buffer.from(token, 'base64').toString();
        if (decoded.includes(':')) {
          return res.status(200).json({ success: true });
        }
      } catch (e) {
        // continue
      }
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: error.message });
  }
}
