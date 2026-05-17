import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

// Initialize Firebase Admin
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
      console.log('=== LOGIN ATTEMPT ===');
      console.log('Username/Email:', username);
      console.log('Password:', password);
      
      try {
        // First try Firestore for admins - search by username OR email
        let adminDoc = null;
        let adminData = null;
        
        // Get ALL admins to debug
        const allAdminsSnapshot = await db.collection('admins').get();
        console.log('Total admins in Firestore:', allAdminsSnapshot.size);
        allAdminsSnapshot.docs.forEach(doc => {
          console.log('Admin doc:', doc.id, doc.data());
        });
        
        // Try by username
        const usernameSnapshot = await db.collection('admins').where('username', '==', username).get();
        console.log('Username query results:', usernameSnapshot.size);
        if (!usernameSnapshot.empty) {
          adminDoc = usernameSnapshot.docs[0];
          adminData = adminDoc.data();
          console.log('Admin found by username:', adminData);
        } else {
          // Try by email
          const emailSnapshot = await db.collection('admins').where('email', '==', username).get();
          console.log('Email query results:', emailSnapshot.size);
          if (!emailSnapshot.empty) {
            adminDoc = emailSnapshot.docs[0];
            adminData = adminDoc.data();
            console.log('Admin found by email:', adminData);
          }
        }
        
        if (adminData) {
          console.log('Comparing passwords:');
          console.log('- Input password:', password);
          console.log('- Stored password:', adminData.password);
          console.log('- Match:', adminData.password === password);
          
          // Check password (NOTE: In production, you should hash passwords!)
          if (adminData.password === password) {
            console.log('Password matches!');
            return res.status(200).json({
              success: true,
              token: Buffer.from(`${username}:${Date.now()}`).toString('base64')
            });
          } else {
            console.log('Password does NOT match');
          }
        } else {
          console.log('No admin found with identifier:', username);
        }
      } catch (error) {
        console.error('Firestore query error:', error);
      }
      
      // Fallback to environment variables for backwards compatibility
      const adminUser = process.env.ADMIN_USERNAME || 'admin';
      const adminPass = process.env.ADMIN_PASSWORD || '1234';

      if (username === adminUser && password === adminPass) {
        return res.status(200).json({
          success: true,
          token: Buffer.from(`${username}:${Date.now()}`).toString('base64')
        });
      } else {
        return res.status(401).json({ error: 'Credenciales incorrectas' });
      }
    }

    // Verify token action
    if (action === 'verify') {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }
      // Simple token validation
      try {
        const decoded = Buffer.from(token, 'base64').toString();
        if (decoded.includes(':')) {
          return res.status(200).json({ success: true });
        }
      } catch (e) {
        // continue to error
      }
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: error.message });
  }
}
