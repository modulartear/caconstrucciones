import path from 'node:path';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import OpenAI, { toFile } from 'openai';
import sharp from 'sharp';
import admin from 'firebase-admin';
import { db } from './firestore-common.js';

export const FREE_GENERATIONS_LIMIT = Number(process.env.FREE_GENERATIONS_LIMIT || 2);
const LOCAL_USAGE_FILE = path.join(process.cwd(), '.visualizador-local-usage.json');
const LOCAL_BUDGETS_FILE = path.join(process.cwd(), '.visualizador-local-budgets.json');

export const TEMPLATES = [
  { id: 'wall', label: 'Pared', target: 'wall', imageUrl: '/visualizador-assets/wall-original.png', maskFile: 'wall-mask.png', imageFile: 'wall-original.png' },
  { id: 'floor', label: 'Piso', target: 'floor', imageUrl: '/visualizador-assets/floor-original.png', maskFile: 'floor-mask.png', imageFile: 'floor-original.png' },
  { id: 'facade', label: 'Fachada', target: 'facade', imageUrl: '/visualizador-assets/facade-original.png', maskFile: 'facade-mask.png', imageFile: 'facade-original.png' }
];

export function setCors(res, methods = 'GET,OPTIONS,POST') {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export function findTemplate(templateId) {
  return TEMPLATES.find((template) => template.id === templateId);
}

export async function loadWidgetMaterials() {
  if (!db) return fallbackMaterials();

  const snapshot = await db.collection('materials').get();
  const materials = [];

  snapshot.docs.forEach((doc) => {
    const item = { ...doc.data(), id: doc.id };
    materials.push(...normalizeMaterial(item));
  });

  return materials.length ? materials : fallbackMaterials();
}

export async function findWidgetMaterial(materialId, target) {
  const materials = await loadWidgetMaterials();
  return materials.find((material) => material.id === materialId && material.target === target);
}

export async function getUsage(sessionId) {
  if (!db) {
    const usage = await readLocalUsage(sessionId);
    return {
      count: Number(usage.count || 0),
      registered: Boolean(usage.registered),
      limit: FREE_GENERATIONS_LIMIT
    };
  }

  const doc = await db.collection('visualizer_sessions').doc(sessionId).get();
  const data = doc.data() || {};

  return {
    count: Number(data.generationCount || 0),
    registered: Boolean(data.registered),
    limit: FREE_GENERATIONS_LIMIT
  };
}

export async function canGenerate(sessionId) {
  const usage = await getUsage(sessionId);
  return usage.registered || usage.count < usage.limit;
}

export async function recordGeneration(sessionId, clientId) {
  if (!db) {
    const usage = await readLocalUsage(sessionId);
    await writeLocalUsage(sessionId, { ...usage, count: Number(usage.count || 0) + 1, clientId });
    return;
  }

  await db.collection('visualizer_sessions').doc(sessionId).set({
    clientId,
    generationCount: admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

export async function saveLead(data) {
  if (!db) {
    const usage = await readLocalUsage(data.sessionId);
    await writeLocalUsage(data.sessionId, { ...usage, registered: true, clientId: data.clientId });
    return;
  }

  await db.collection('visualizer_leads').add({
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    source: 'visualizador-ia-widget'
  });

  await db.collection('visualizer_sessions').doc(data.sessionId).set({
    clientId: data.clientId,
    registered: true,
    leadUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

export async function saveVisualizerBudget(data) {
  const now = new Date();
  const budget = {
    id: `pres_${randomUUID().slice(0, 8)}`,
    client: `${data.firstName} ${data.lastName}`.trim(),
    email: data.email,
    phone: data.phone,
    locality: data.locality,
    type: 'Visualizador IA',
    surface: Number(data.surface || 0),
    message: buildBudgetMessage(data),
    status: 'nuevo',
    date: now.toISOString().slice(0, 10),
    source: 'visualizador-ia-widget',
    clientId: data.clientId,
    sessionId: data.sessionId,
    visualizerImage: data.resultImage || '',
    visualizerOriginalImage: data.originalImage || '',
    visualizerScene: data.sceneLabel || data.templateId,
    visualizerTarget: data.target,
    visualizerMaterialId: data.materialId,
    visualizerMaterialName: data.materialLabel,
    visualizerMaterialPhoto: data.materialPhoto || '',
    createdAt: now.toISOString()
  };

  if (!db) {
    const budgets = await readLocalBudgets();
    budgets.unshift(budget);
    await fs.writeFile(LOCAL_BUDGETS_FILE, JSON.stringify(budgets, null, 2));
    return budget;
  }

  await db.collection('budgets').doc(budget.id).set({
    ...budget,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  await saveLead({
    sessionId: data.sessionId,
    clientId: data.clientId,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    email: data.email,
    locality: data.locality
  });

  return budget;
}

export async function generateWithOpenAI({ template, target, material }) {
  if (!process.env.OPENAI_API_KEY) {
    return {
      resultId: `demo_${Date.now()}`,
      resultUrl: createDemoSvg(material),
      demo: true,
      mode: 'demo'
    };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prepared = await prepareInputs(template);
  const prompt = [
    'Edit only the transparent masked area of the image.',
    `Target surface: ${target}.`,
    `New material: ${material.prompt || material.label}.`,
    'Preserve the original camera angle, geometry, lighting, shadows, reflections and perspective.',
    'Preserve all furniture, doors, windows, appliances, fixtures, plants, floor, ceiling and every unmasked area exactly.',
    'Do not redesign the scene. Make the edited surface photorealistic and consistent with the original image.'
  ].join('\n');

  const response = await client.images.edit({
    model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1.5',
    image: await toFile(prepared.imageBuffer, 'image.png', { type: 'image/png' }),
    mask: await toFile(prepared.maskBuffer, 'mask.png', { type: 'image/png' }),
    prompt,
    quality: process.env.OPENAI_IMAGE_QUALITY || 'low',
    size: process.env.OPENAI_IMAGE_SIZE || '1024x1024',
    output_format: 'png'
  });

  const imageBase64 = response.data?.[0]?.b64_json;
  if (!imageBase64) {
    throw new Error('OpenAI did not return an edited image.');
  }

  return {
    resultId: `res_${randomUUID()}`,
    resultUrl: `data:image/png;base64,${imageBase64}`,
    demo: false,
    mode: 'openai-edit',
    usage: response.usage
  };
}

async function prepareInputs(template) {
  const root = process.cwd();
  const imagePath = path.join(root, 'frontend', 'visualizador-assets', template.imageFile);
  const maskPath = path.join(root, 'api', 'visualizador-assets', template.maskFile);
  const maxWidth = Number(process.env.OPENAI_MAX_INPUT_WIDTH || 1024);
  const metadata = await sharp(imagePath).metadata();
  const width = metadata.width || maxWidth;
  const height = metadata.height || maxWidth;
  const scale = Math.min(1, maxWidth / width);
  const outputWidth = Math.max(1, Math.round(width * scale));
  const outputHeight = Math.max(1, Math.round(height * scale));

  const imageBuffer = await sharp(imagePath)
    .resize(outputWidth, outputHeight, { fit: 'fill' })
    .png()
    .toBuffer();

  const maskBuffer = await sharp(maskPath)
    .resize(outputWidth, outputHeight, { fit: 'fill' })
    .ensureAlpha()
    .png()
    .toBuffer();

  return { imageBuffer, maskBuffer };
}

function normalizeMaterial(item) {
  const category = String(item.category || item.tipo || item.target || '').toLowerCase();
  const targets = targetsForCategory(category);
  const label = item.name || item.nombre || 'Material';
  const prompt = item.description || item.prompt || item.texture || label;
  const swatch = item.color || item.swatch || '#b8b7b0';
  const photo = item.photo || item.image || item.imageUrl || item.textureUrl || '';

  return targets.map((target, index) => ({
    id: index === 0 ? String(item.id) : `${item.id}_${target}`,
    sourceId: String(item.id),
    label,
    target,
    prompt,
    swatch,
    photo,
    source: 'firebase',
    renderMode: item.texture === 'paint' || category.includes('pintura') ? 'paint' : 'material'
  }));
}

function targetsForCategory(category) {
  if (category.includes('piso') || category.includes('madera')) return ['floor'];
  if (category.includes('pintura')) return ['wall'];
  if (category.includes('revest')) return ['wall', 'facade'];
  return ['wall'];
}

async function readLocalUsage(sessionId) {
  try {
    const all = JSON.parse(await fs.readFile(LOCAL_USAGE_FILE, 'utf8'));
    return all[sessionId] || { count: 0, registered: false };
  } catch {
    return { count: 0, registered: false };
  }
}

async function writeLocalUsage(sessionId, usage) {
  let all = {};
  try {
    all = JSON.parse(await fs.readFile(LOCAL_USAGE_FILE, 'utf8'));
  } catch {
    all = {};
  }
  all[sessionId] = usage;
  await fs.writeFile(LOCAL_USAGE_FILE, JSON.stringify(all, null, 2));
}

async function readLocalBudgets() {
  try {
    return JSON.parse(await fs.readFile(LOCAL_BUDGETS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function fallbackMaterials() {
  return [
    { id: 'wall_paint_white', label: 'Pintura blanco lino', target: 'wall', prompt: 'warm white matte wall paint', swatch: '#f3ede1', photo: '', renderMode: 'paint' },
    { id: 'wall_microcement', label: 'Microcemento gris', target: 'wall', prompt: 'smooth gray microcement finish', swatch: '#8a8983', photo: '', renderMode: 'material' },
    { id: 'floor_oak', label: 'Roble natural', target: 'floor', prompt: 'natural oak wood flooring', swatch: '#a87a4d', photo: '', renderMode: 'material' },
    { id: 'facade_stone', label: 'Piedra natural', target: 'facade', prompt: 'natural stone facade cladding', swatch: '#8e7958', photo: '', renderMode: 'material' }
  ];
}

function buildBudgetMessage(data) {
  const lines = [
    'Solicitud generada desde el Visualizador IA.',
    `Escena: ${data.sceneLabel || data.templateId}`,
    `Zona: ${data.target}`,
    `Material: ${data.materialLabel || data.materialId}`,
  ];
  if (data.locality) lines.push(`Localidad: ${data.locality}`);
  if (data.notes) lines.push(`Mensaje del cliente: ${data.notes}`);
  return lines.join('\n');
}

function createDemoSvg(material) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${material.swatch || '#ddd'}"/><text x="80" y="520" font-family="Arial" font-size="48" fill="#111">Demo: ${escapeXml(material.label)}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function escapeXml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}
