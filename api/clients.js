import { query } from '../backend/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const result = await query('SELECT * FROM clients ORDER BY id');
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { id, name, email, phone, project, since } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Client name is required' });
      }

      const result = await query(
        `INSERT INTO clients (id, name, email, phone, project, since)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET name=$2, email=$3, phone=$4, project=$5, since=$6
         RETURNING *`,
        [id, name, email, phone, project, since]
      );

      return res.status(201).json(result.rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }
      await query('DELETE FROM clients WHERE id = $1', [id]);
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
