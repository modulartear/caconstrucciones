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
      const result = await query('SELECT * FROM testimonials ORDER BY id');
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { id, name, role, stars, text, avatar } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const result = await query(
        `INSERT INTO testimonials (id, name, role, stars, text, avatar)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET name=$2, role=$3, stars=$4, text=$5, avatar=$6
         RETURNING *`,
        [id, name, role, stars || 5, text, avatar]
      );

      return res.status(201).json(result.rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }
      await query('DELETE FROM testimonials WHERE id = $1', [id]);
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
