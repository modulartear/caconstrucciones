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
      const result = await query('SELECT * FROM budgets ORDER BY date DESC');
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { id, client, email, phone, type, surface, message, status, date } = req.body;

      if (!client) {
        return res.status(400).json({ error: 'Client name is required' });
      }

      const result = await query(
        `INSERT INTO budgets (id, client, email, phone, type, surface, message, status, date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET client=$2, email=$3, phone=$4, type=$5, surface=$6, message=$7, status=$8, date=$9
         RETURNING *`,
        [id, client, email, phone, type, surface, message, status || 'nuevo', date]
      );

      return res.status(201).json(result.rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }
      await query('DELETE FROM budgets WHERE id = $1', [id]);
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
