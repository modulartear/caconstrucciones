import { query } from '../backend/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const result = await query('SELECT * FROM materials ORDER BY id');
      return res.status(200).json({
        materials: result.rows,
        count: result.rows.length
      });
    }

    if (req.method === 'POST') {
      const { name, category, texture, color, accent, price, unit, photo } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Material name is required' });
      }

      const result = await query(
        `INSERT INTO materials (name, category, texture, color, accent, price, unit, photo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [name, category, texture, color, accent, price, unit, photo]
      );

      return res.status(201).json(result.rows[0]);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
