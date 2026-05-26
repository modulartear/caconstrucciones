import { loadWidgetMaterials, setCors } from './visualizador-common.js';

export default async function handler(req, res) {
  setCors(res, 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const materials = await loadWidgetMaterials();
  return res.status(200).json({ materials });
}
