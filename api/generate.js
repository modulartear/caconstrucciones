import {
  canGenerate,
  findTemplate,
  findWidgetMaterial,
  generateWithOpenAI,
  getUsage,
  recordGeneration,
  setCors
} from './visualizador-common.js';

export default async function handler(req, res) {
  setCors(res, 'POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = await readJsonBody(req);
    const { templateId, target, materialId, clientId = 'unknown', sessionId } = body || {};
    if (!templateId || !target || !materialId || !sessionId) {
      return res.status(400).json({ error: 'Invalid payload.' });
    }

    const template = findTemplate(templateId);
    if (!template || template.target !== target) {
      return res.status(400).json({ error: 'Template does not match selected target.' });
    }

    const material = await findWidgetMaterial(materialId, target);
    if (!material) {
      return res.status(400).json({ error: 'Material does not match selected target.' });
    }

    if (!(await canGenerate(sessionId))) {
      return res.status(403).json({
        error: 'Free generation limit reached.',
        detail: 'Para generar mas visualizaciones, registra tus datos de contacto.',
        requireRegistration: true,
        usage: await getUsage(sessionId)
      });
    }

    const result = await generateWithOpenAI({ template, target, material });
    await recordGeneration(sessionId, clientId);

    return res.status(200).json({
      ...result,
      usage: await getUsage(sessionId)
    });
  } catch (error) {
    console.error('Visualizer generate error:', error);
    if (error?.statusCode === 400 || error?.message === 'Invalid JSON') {
      return res.status(400).json({ error: 'Invalid JSON payload.' });
    }
    return res.status(502).json({
      error: 'OpenAI image edit failed.',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function readJsonBody(req) {
  try {
    if (typeof req.body === 'object' && req.body !== null) return req.body;
    if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  } catch (error) {
    if (error?.message !== 'Invalid JSON') throw error;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? JSON.parse(raw) : {};
}
