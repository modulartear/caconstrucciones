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
  console.log('� API AUTH handler called!');
  console.log('📥 Request:', req.method, req.body);

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

    console.log('========================================');
    console.log('LOGIN ATTEMPT STARTED');
    console.log('Input username:', JSON.stringify(username));
    console.log('Input password:', JSON.stringify(password));

    // Login action
    if (action === 'login') {
      // Get ALL admins from Firestore
      console.log('Fetching all admins from Firestore...');
      const snapshot = await db.collection('admins').get();
      console.log('Total admins found in Firestore:', snapshot.size);

      for (const doc of snapshot.docs) {
        const data = doc.data();
        console.log('---');
        console.log('Checking admin doc:', doc.id);
        console.log('Admin data:', JSON.stringify(data, null, 2));

        // Normalize all values to strings for comparison
        const dataUsername = String(data.username || '');
        const dataEmail = String(data.email || '');
        const dataPassword = String(data.password || '');
        const inputUsername = String(username || '');
        const inputPassword = String(password || '');

        console.log('Normalized:');
        console.log('- dataUsername:', JSON.stringify(dataUsername));
        console.log('- dataEmail:', JSON.stringify(dataEmail));
        console.log('- dataPassword:', JSON.stringify(dataPassword));
        console.log('- inputUsername:', JSON.stringify(inputUsername));
        console.log('- inputPassword:', JSON.stringify(inputPassword));

        // Check if matches username or email
        const usernameMatch = dataUsername === inputUsername;
        const emailMatch = dataEmail === inputUsername;
        const passwordMatch = dataPassword === inputPassword;

        console.log('Matches:');
        console.log('- usernameMatch:', usernameMatch);
        console.log('- emailMatch:', emailMatch);
        console.log('- passwordMatch:', passwordMatch);

        if ((usernameMatch || emailMatch) && passwordMatch) {
          console.log('✅ SUCCESS: Admin authenticated!');
          return res.status(200).json({
            success: true,
            token: Buffer.from(`${username}:${Date.now()}`).toString('base64')
          });
        }
      }

      console.log('❌ No matching admin found in Firestore');
      console.log('Falling back to environment variables...');

      // Fallback to env vars
      const adminUser = process.env.ADMIN_USERNAME || 'admin';
      const adminPass = process.env.ADMIN_PASSWORD || '1234';
      console.log('Env adminUser:', JSON.stringify(adminUser));
      console.log('Env adminPass:', JSON.stringify(adminPass));

      if (username === adminUser && password === adminPass) {
        console.log('✅ SUCCESS: Authenticated with env vars');
        return res.status(200).json({
          success: true,
          token: Buffer.from(`${username}:${Date.now()}`).toString('base64')
        });
      }

      console.log('❌ ALL AUTHENTICATION METHODS FAILED');
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
    console.error('❌ AUTH ERROR:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
}
