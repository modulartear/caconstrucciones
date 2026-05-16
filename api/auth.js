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
      const adminUser = process.env.ADMIN_USERNAME || 'admin';
      const adminPass = process.env.ADMIN_PASSWORD || 'cambiar-en-produccion';

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
