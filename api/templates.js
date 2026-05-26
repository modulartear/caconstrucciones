import { setCors, TEMPLATES } from './visualizador-common.js';

export default async function handler(req, res) {
  setCors(res, 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  return res.status(200).json({
    templates: TEMPLATES.map(({ id, label, target, imageUrl }) => ({ id, label, target, imageUrl }))
  });
}
