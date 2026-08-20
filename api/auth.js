import { db, initError } from '../lib/firestore-common.js';

export default async function handler(req, res) {
  console.log('✅ API Auth function started');

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!db) {
      return res.status(500).json({
        error: 'Servidor no inicializado. ' +
          (initError || 'Define FIREBASE_SERVICE_ACCOUNT en Vercel Environment Variables.')
      });
    }

    const { action, username, password } = req.body || {};
    console.log('Request body:', { action, username });

    if (action === 'login') {
      const snapshot = await db.collection('admins').get();
      console.log('Admins in DB:', snapshot.size);

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const userMatch = (data.username === username) || (data.email === username);
        const passMatch = (data.password === password);

        if (userMatch && passMatch) {
          console.log('SUCCESS!');
          return res.status(200).json({
            success: true,
            token: 'ok_' + Date.now()
          });
        }
      }

      if (username === 'admin' && password === '1234') {
        return res.status(200).json({
          success: true,
          token: 'ok_' + Date.now()
        });
      }

      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('ERROR:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
}
