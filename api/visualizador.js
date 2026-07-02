import Replicate from 'replicate';
import {
  canGenerate,
  findTemplate,
  findWidgetMaterial,
  generateWithOpenAI,
  getUsage,
  listTemplateMaskAssets,
  loadWidgetMaterials,
  recordGeneration,
  restoreTemplateMaskAsset,
  saveTemplateMaskAsset,
  saveLead,
  saveVisualizerBudget,
  setCors,
  TEMPLATES
} from '../lib/visualizador-common.js';

const legacyMaterialPrompts = {
  brick: 'Replace only the masked wall areas with realistic exposed red brick. Keep floor, doors, windows, railings, people, shadows and perspective unchanged. Ultra realistic architectural rendering.',
  stone: 'Replace only the masked wall areas with realistic natural stone cladding. Keep floor, doors, windows, railings, people, shadows and perspective unchanged. Ultra realistic architectural rendering.',
  wood: 'Replace only the masked wall areas with realistic wood paneling. Keep floor, doors, windows, railings, people, shadows and perspective unchanged. Ultra realistic architectural rendering.',
  microcement: 'Replace only the masked wall areas with realistic smooth microcement finish. Keep floor, doors, windows, railings, people, shadows and perspective unchanged. Ultra realistic architectural rendering.',
  tile: 'Replace only the masked wall areas with realistic ceramic tiles. Keep floor, doors, windows, railings, people, shadows and perspective unchanged. Ultra realistic architectural rendering.',
  paint: 'Replace only the masked wall areas with a fresh paint finish. Keep floor, doors, windows, railings, people, shadows and perspective unchanged. Ultra realistic architectural rendering.'
};

export default async function handler(req, res) {
  const action = getQueryValue(req.query?.action);
  setCors(res, 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (action === 'templates') return handleTemplates(req, res);
    if (action === 'materials') return handleMaterials(req, res);
    if (action === 'usage') return handleUsage(req, res);
    if (action === 'template-masks') return handleTemplateMasks(req, res);
    if (action === 'generate') return handleGenerate(req, res);
    if (action === 'leads') return handleLeads(req, res);
    if (action === 'budget') return handleBudget(req, res);
    if (action === 'save-mask') return handleSaveMask(req, res);
    if (action === 'restore-mask') return handleRestoreMask(req, res);
    if (action === 'legacy-visualize') return handleLegacyVisualize(req, res);
    return res.status(404).json({ error: 'Visualizer route not found.' });
  } catch (error) {
    console.error('Visualizer router error:', error);
    if (error?.statusCode === 400 || error?.message === 'Invalid JSON') {
      return res.status(400).json({ error: 'Invalid JSON payload.' });
    }
    return res.status(error?.statusCode || 500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

async function handleTemplates(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  return res.status(200).json({ templates: TEMPLATES });
}

async function handleMaterials(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  return res.status(200).json({ materials: await loadWidgetMaterials() });
}

async function handleUsage(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const sessionId = getQueryValue(req.query?.sessionId);
  if (!sessionId) return res.status(400).json({ error: 'Missing sessionId.' });
  return res.status(200).json(await getUsage(sessionId));
}

async function handleTemplateMasks(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  return res.status(200).json({ templates: await listTemplateMaskAssets() });
}

async function handleGenerate(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
}

async function handleLeads(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = await readJsonBody(req);
  const { sessionId, clientId, firstName, lastName, phone, email, locality } = body || {};
  if (!sessionId || !clientId || !firstName || !lastName || !phone || !email || !locality) {
    return res.status(400).json({ error: 'Completa nombre, apellido, telefono, email y localidad.' });
  }

  await saveLead({ sessionId, clientId, firstName, lastName, phone, email, locality });
  return res.status(200).json({ ok: true, usage: await getUsage(sessionId) });
}

async function handleBudget(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = await readJsonBody(req);
  const {
    sessionId, clientId, firstName, lastName, phone, email, locality,
    templateId, target, materialId, resultImage
  } = body || {};

  if (!sessionId || !clientId || !firstName || !lastName || !phone || !email || !locality) {
    return res.status(400).json({ error: 'Completa nombre, apellido, telefono, email y localidad.' });
  }
  if (!templateId || !target || !materialId || !resultImage) {
    return res.status(400).json({ error: 'Falta la visualizacion generada para adjuntar al presupuesto.' });
  }

  const budget = await saveVisualizerBudget(body);
  return res.status(200).json({ ok: true, budget, usage: await getUsage(sessionId) });
}

async function handleSaveMask(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = await readJsonBody(req);
  const { templateId, maskType, imageDataUrl } = body || {};
  if (!templateId || !maskType || !imageDataUrl) {
    return res.status(400).json({ error: 'Faltan templateId, maskType o imageDataUrl.' });
  }

  const result = await saveTemplateMaskAsset({ templateId, maskType, imageDataUrl });
  return res.status(200).json(result);
}

async function handleRestoreMask(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = await readJsonBody(req);
  const { templateId, maskType } = body || {};
  if (!templateId || !maskType) {
    return res.status(400).json({ error: 'Faltan templateId o maskType.' });
  }

  const result = await restoreTemplateMaskAsset({ templateId, maskType });
  return res.status(200).json(result);
}

async function handleLegacyVisualize(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo no permitido' });

  const { imageBase64, materialType } = await readJsonBody(req);
  if (!imageBase64 || !materialType) {
    return res.status(400).json({ error: 'Faltan datos: imageBase64 y materialType son requeridos' });
  }

  if (!process.env.REPLICATE_API_TOKEN) {
    return res.status(501).json({
      error: 'Probador de IA no disponible',
      message: 'REPLICATE_API_TOKEN no esta configurado en Vercel.',
      fallbackMode: true
    });
  }

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  const prompt = legacyMaterialPrompts[materialType] || legacyMaterialPrompts.paint;

  let segmentationOutput = null;
  try {
    segmentationOutput = await replicate.run(
      'nvidia/segformer-b0-finetuned-ade-512-512:9e7b669669a0f172717897958e25e44c3d50a97104e22737226866f54e8381',
      { input: { image: imageBase64 } }
    );
  } catch (segError) {
    console.warn('SegFormer failed, continuing without mask:', segError.message);
  }

  const fluxInput = {
    prompt,
    image: imageBase64,
    strength: 0.75,
    control_depth: 0.55,
    seed: Math.floor(Math.random() * 2147483647),
    steps: 20,
    guidance_scale: 3.0,
    negative_prompt: 'blurry, distorted, low quality, ugly, cartoon, drawing, painting, illustration, deformed, mutated, bad anatomy'
  };

  if (segmentationOutput) fluxInput.mask = segmentationOutput;

  const fluxOutput = await replicate.run(
    'fofr/flux-kontext-max:3ed1c679e834a442c4e34562062ef990a34f73b9994c2a1073e49d11112c5',
    { input: fluxInput }
  );

  return res.status(200).json({
    success: true,
    outputUrl: Array.isArray(fluxOutput) ? fluxOutput[0] : fluxOutput
  });
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

function getQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}
