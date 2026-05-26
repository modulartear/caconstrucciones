import { getUsage, setCors } from '../visualizador-common.js';

export default async function handler(req, res) {
  setCors(res, 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const sessionId = String(req.query.sessionId || '');
  if (sessionId.length < 8) return res.status(400).json({ error: 'Invalid session id.' });

  return res.status(200).json(await getUsage(sessionId));
}
