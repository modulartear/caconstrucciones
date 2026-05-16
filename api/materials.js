export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // For now, just acknowledge requests without requiring a database
    // The admin panel uses localStorage, so API calls are optional
    if (req.method === 'GET') {
      return res.status(200).json({
        materials: [],
        count: 0
      });
    }

    if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'DELETE') {
      // Verify token if needed
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
      }

      // For now, just return success
      return res.status(200).json({ success: true, message: 'Data processed' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
