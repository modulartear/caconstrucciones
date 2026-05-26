import { getUsage, saveLead, setCors } from './visualizador-common.js';

export default async function handler(req, res) {
  setCors(res, 'POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sessionId, clientId, firstName, lastName, phone, email, locality } = req.body || {};
  if (!sessionId || !clientId || !firstName || !lastName || !phone || !email || !locality) {
    return res.status(400).json({ error: 'Completa nombre, apellido, telefono, email y localidad.' });
  }

  await saveLead({ sessionId, clientId, firstName, lastName, phone, email, locality });
  return res.status(200).json({ ok: true, usage: await getUsage(sessionId) });
}
