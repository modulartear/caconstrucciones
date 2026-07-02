import path from 'node:path';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import dotenv from 'dotenv';
import OpenAI, { toFile } from 'openai';
import sharp from 'sharp';
import admin from 'firebase-admin';
import { db } from './firestore-common.js';

dotenv.config();
dotenv.config({ path: './backend/.env' });

export const FREE_GENERATIONS_LIMIT = Number(process.env.FREE_GENERATIONS_LIMIT || 2);
const LOCAL_USAGE_FILE = path.join(process.cwd(), '.visualizador-local-usage.json');
const LOCAL_BUDGETS_FILE = path.join(process.cwd(), '.visualizador-local-budgets.json');

export const TEMPLATES = [
  {
    id: 'wall',
    label: 'Pared',
    target: 'wall',
    imageUrl: '/visualizador-assets/wall-original.png',
    maskUrl: '/visualizador-assets/wall-mask.png',
    surfaceMaskUrl: '/visualizador-assets/wall-mask.png',
    surfaceMaskMode: 'alpha-cutout',
    occluderMaskUrl: '/visualizador-assets/wall-occluders.png',
    occluderMaskMode: 'luma',
    shadowMaskUrl: '',
    shadowMaskMode: 'luma',
    projectionMode: 'wall',
    occluderShapes: [
      { kind: 'rect', x: 469, y: 226, width: 142, height: 157, radius: 4, feather: 2 },
      { kind: 'rect', x: 0, y: 66, width: 102, height: 496, feather: 14 },
      {
        kind: 'ellipse',
        cx: 122,
        cy: 364,
        rx: 82,
        ry: 142,
        rotation: -8,
        feather: 10
      },
      {
        kind: 'polygon',
        points: [
          [171, 404], [204, 392], [289, 390], [360, 394], [452, 392], [552, 393],
          [641, 390], [706, 398], [738, 411], [742, 531], [171, 531]
        ],
        feather: 10
      },
      {
        kind: 'polygon',
        points: [
          [132, 481], [148, 465], [175, 447], [196, 447], [205, 472], [207, 530], [129, 530]
        ],
        feather: 8
      }
    ],
    defaults: { scale: 100, rotation: 0, offsetX: 0, offsetY: 0, opacity: 88, lighting: 35 },
    maskFile: 'wall-mask.png',
    imageFile: 'wall-original.png'
  },
  {
    id: 'floor',
    label: 'Piso',
    target: 'floor',
    imageUrl: '/visualizador-assets/floor-original.png',
    maskUrl: '/visualizador-assets/floor-mask.png',
    surfaceMaskUrl: '/visualizador-assets/floor-mask.png',
    surfaceMaskMode: 'alpha-cutout',
    occluderMaskUrl: '/visualizador-assets/floor-occluders.png',
    occluderMaskMode: 'luma',
    shadowMaskUrl: '/visualizador-assets/floor-shadows.png',
    shadowMaskMode: 'luma',
    projectionMode: 'floor',
    occluderShapes: [
      {
        kind: 'polygon',
        points: [
          [368, 446], [1104, 446], [1273, 645], [150, 645]
        ],
        feather: 12
      },
      {
        kind: 'rect',
        x: 1090,
        y: 423,
        width: 360,
        height: 177,
        radius: 4,
        feather: 6
      },
      {
        kind: 'ellipse',
        cx: 385,
        cy: 482,
        rx: 43,
        ry: 47,
        rotation: 0,
        feather: 6
      },
      {
        kind: 'ellipse',
        cx: 1426,
        cy: 515,
        rx: 29,
        ry: 46,
        rotation: 0,
        feather: 6
      }
    ],
    shadowShapes: [
      {
        kind: 'polygon',
        points: [
          [273, 400], [771, 400], [820, 446], [222, 446]
        ],
        feather: 24,
        alpha: 0.62
      },
      {
        kind: 'polygon',
        points: [
          [1020, 425], [1488, 425], [1498, 517], [1070, 534]
        ],
        feather: 20,
        alpha: 0.55
      },
      {
        kind: 'ellipse',
        cx: 771,
        cy: 467,
        rx: 170,
        ry: 50,
        rotation: 0,
        feather: 26,
        alpha: 0.5
      }
    ],
    defaults: { scale: 120, rotation: 0, offsetX: 0, offsetY: 0, opacity: 92, lighting: 42 },
    maskFile: 'floor-mask.png',
    imageFile: 'floor-original.png'
  },
  {
    id: 'facade',
    label: 'Fachada',
    target: 'facade',
    imageUrl: '/visualizador-assets/facade-original.png',
    maskUrl: '/visualizador-assets/facade-mask.png',
    surfaceMaskUrl: '/visualizador-assets/facade-mask.png',
    surfaceMaskMode: 'alpha-cutout',
    occluderMaskUrl: '/visualizador-assets/facade-occluders.png',
    occluderMaskMode: 'luma',
    shadowMaskUrl: '/visualizador-assets/facade-shadows.png',
    shadowMaskMode: 'luma',
    projectionMode: 'facade',
    occluderShapes: [
      { kind: 'rect', x: 94, y: 301, width: 297, height: 179, radius: 2, feather: 4 },
      { kind: 'rect', x: 490, y: 291, width: 95, height: 190, radius: 2, feather: 3 },
      { kind: 'rect', x: 831, y: 304, width: 41, height: 176, radius: 1, feather: 2 },
      { kind: 'rect', x: 387, y: 258, width: 268, height: 22, radius: 1, feather: 3 },
      { kind: 'rect', x: 624, y: 346, width: 12, height: 38, radius: 4, feather: 2 },
      {
        kind: 'polygon',
        points: [
          [0, 448], [144, 448], [141, 486], [0, 487]
        ],
        feather: 8
      },
      {
        kind: 'polygon',
        points: [
          [414, 430], [804, 430], [808, 480], [392, 480]
        ],
        feather: 10
      },
      {
        kind: 'polygon',
        points: [
          [0, 479], [1023, 479], [1023, 684], [0, 684]
        ],
        feather: 4
      }
    ],
    shadowShapes: [
      {
        kind: 'polygon',
        points: [
          [653, 267], [828, 267], [1023, 374], [1023, 471], [620, 471], [620, 311]
        ],
        feather: 26,
        alpha: 0.68
      },
      {
        kind: 'polygon',
        points: [
          [387, 280], [654, 280], [622, 324], [421, 324]
        ],
        feather: 18,
        alpha: 0.52
      },
      {
        kind: 'ellipse',
        cx: 472,
        cy: 369,
        rx: 104,
        ry: 66,
        rotation: 0,
        feather: 28,
        alpha: 0.42
      }
    ],
    defaults: { scale: 95, rotation: 0, offsetX: 0, offsetY: 0, opacity: 90, lighting: 30 },
    maskFile: 'facade-mask.png',
    imageFile: 'facade-original.png'
  }
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
    const error = new Error('OPENAI_API_KEY no esta configurada. Agrega la variable en Vercel o en .env local para generar imagenes reales.');
    error.statusCode = 503;
    throw error;
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

export async function saveTemplateMaskAsset({ templateId, maskType, imageDataUrl }) {
  const template = findTemplate(templateId);
  if (!template) {
    const error = new Error('Template no encontrado.');
    error.statusCode = 404;
    throw error;
  }
  if (!['surface', 'occluders'].includes(maskType)) {
    const error = new Error('Tipo de mascara no soportado.');
    error.statusCode = 400;
    throw error;
  }
  const buffer = decodeImageDataUrl(imageDataUrl);
  const root = process.cwd();
  const writes = [];
  const publicPaths = [];

  if (maskType === 'surface') {
    const fileName = template.maskFile || `${template.id}-mask.png`;
    const frontendPath = path.join(root, 'frontend', 'visualizador-assets', fileName);
    const apiPath = path.join(root, 'api', 'visualizador-assets', fileName);
    await ensureBackup(frontendPath);
    await ensureBackup(apiPath);
    writes.push(writeBinaryFile(frontendPath, buffer), writeBinaryFile(apiPath, buffer));
    publicPaths.push(`/visualizador-assets/${fileName}`, `/api/visualizador-assets/${fileName}`);
  }

  if (maskType === 'occluders') {
    const fileName = path.basename(template.occluderMaskUrl || `${template.id}-occluders.png`);
    const frontendPath = path.join(root, 'frontend', 'visualizador-assets', fileName);
    await ensureBackup(frontendPath);
    writes.push(writeBinaryFile(frontendPath, buffer));
    publicPaths.push(`/visualizador-assets/${fileName}`);
  }

  await Promise.all(writes);
  return { ok: true, publicPaths };
}

export async function listTemplateMaskAssets() {
  const root = process.cwd();
  const templates = await Promise.all(TEMPLATES.map(async (template) => {
    const surfaceFile = template.maskFile || `${template.id}-mask.png`;
    const occluderFile = path.basename(template.occluderMaskUrl || `${template.id}-occluders.png`);
    const shadowFile = template.shadowMaskUrl ? path.basename(template.shadowMaskUrl) : '';
    const surfacePath = path.join(root, 'frontend', 'visualizador-assets', surfaceFile);
    const occluderPath = path.join(root, 'frontend', 'visualizador-assets', occluderFile);
    const shadowPath = shadowFile ? path.join(root, 'frontend', 'visualizador-assets', shadowFile) : '';
    const apiSurfacePath = path.join(root, 'api', 'visualizador-assets', surfaceFile);

    await ensureBackup(surfacePath);
    await ensureBackup(occluderPath);
    await ensureBackup(apiSurfacePath);
    if (shadowPath) await ensureBackup(shadowPath);

    return {
      id: template.id,
      label: template.label,
      target: template.target,
      imageUrl: template.imageUrl,
      masks: {
        surface: await describeMaskAsset({
          filePath: surfacePath,
          publicUrl: `/visualizador-assets/${surfaceFile}`,
          backupPublicUrl: `/visualizador-assets/${backupNameFor(surfaceFile)}`
        }),
        occluders: await describeMaskAsset({
          filePath: occluderPath,
          publicUrl: `/visualizador-assets/${occluderFile}`,
          backupPublicUrl: `/visualizador-assets/${backupNameFor(occluderFile)}`
        }),
        shadows: shadowFile ? await describeMaskAsset({
          filePath: shadowPath,
          publicUrl: `/visualizador-assets/${shadowFile}`,
          backupPublicUrl: `/visualizador-assets/${backupNameFor(shadowFile)}`
        }) : null
      }
    };
  }));

  return templates;
}

export async function restoreTemplateMaskAsset({ templateId, maskType }) {
  const template = findTemplate(templateId);
  if (!template) {
    const error = new Error('Template no encontrado.');
    error.statusCode = 404;
    throw error;
  }
  if (!['surface', 'occluders'].includes(maskType)) {
    const error = new Error('Tipo de mascara no soportado.');
    error.statusCode = 400;
    throw error;
  }

  const root = process.cwd();
  if (maskType === 'surface') {
    const fileName = template.maskFile || `${template.id}-mask.png`;
    const frontendPath = path.join(root, 'frontend', 'visualizador-assets', fileName);
    const apiPath = path.join(root, 'api', 'visualizador-assets', fileName);
    await restoreBackup(frontendPath);
    await restoreBackup(apiPath);
    return { ok: true, publicPaths: [`/visualizador-assets/${fileName}`, `/api/visualizador-assets/${fileName}`] };
  }

  const fileName = path.basename(template.occluderMaskUrl || `${template.id}-occluders.png`);
  const frontendPath = path.join(root, 'frontend', 'visualizador-assets', fileName);
  await restoreBackup(frontendPath);
  return { ok: true, publicPaths: [`/visualizador-assets/${fileName}`] };
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

function decodeImageDataUrl(imageDataUrl) {
  const match = String(imageDataUrl || '').match(/^data:image\/png;base64,(.+)$/);
  if (!match) {
    const error = new Error('La imagen debe enviarse como PNG en base64.');
    error.statusCode = 400;
    throw error;
  }
  return Buffer.from(match[1], 'base64');
}

async function writeBinaryFile(filePath, buffer) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
}

async function describeMaskAsset({ filePath, publicUrl, backupPublicUrl }) {
  const exists = await fileExists(filePath);
  const backupPath = path.join(path.dirname(filePath), backupNameFor(path.basename(filePath)));
  const backupExists = await fileExists(backupPath);
  const updatedAt = exists ? (await fs.stat(filePath)).mtime.toISOString() : null;
  return {
    exists,
    publicUrl,
    backupPublicUrl: backupExists ? backupPublicUrl : null,
    updatedAt
  };
}

async function ensureBackup(filePath) {
  if (!(await fileExists(filePath))) return;
  const backupPath = path.join(path.dirname(filePath), backupNameFor(path.basename(filePath)));
  if (await fileExists(backupPath)) return;
  await fs.copyFile(filePath, backupPath);
}

async function restoreBackup(filePath) {
  const backupPath = path.join(path.dirname(filePath), backupNameFor(path.basename(filePath)));
  if (!(await fileExists(backupPath))) {
    const error = new Error('No existe un respaldo original para restaurar.');
    error.statusCode = 404;
    throw error;
  }
  await fs.copyFile(backupPath, filePath);
}

function backupNameFor(fileName) {
  const parsed = path.parse(fileName);
  return `${parsed.name}.original${parsed.ext}`;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
