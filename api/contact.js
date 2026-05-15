import { query } from '../backend/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'POST') {
      const { name, email, message } = req.body;

      if (!email || !message) {
        return res.status(400).json({ error: 'Email and message are required' });
      }

      await query(
        `INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3)`,
        [name || 'Anonymous', email, message]
      );

      return res.status(201).json({ message: 'Message saved' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
