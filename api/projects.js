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
      const result = await query('SELECT * FROM projects ORDER BY id');
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { id, title, location, status, surface, year, description, cover, gallery, progress } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const result = await query(
        `INSERT INTO projects (id, title, location, status, surface, year, description, cover, gallery, progress)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET title=$2, location=$3, status=$4, surface=$5, year=$6, description=$7, cover=$8, gallery=$9, progress=$10
         RETURNING *`,
        [id, title, location, status, surface, year, description, cover, gallery || [], progress || 0]
      );

      return res.status(201).json(result.rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }
      await query('DELETE FROM projects WHERE id = $1', [id]);
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
