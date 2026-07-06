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
    sceneMode: 'layered',
    imageUrl: '/visualizador-assets/wall-original.png',
    maskUrl: '/visualizador-assets/wall-mask-v2.png',
    surfaceMaskUrl: '/visualizador-assets/wall-mask-v2.png',
    surfaceMaskMode: 'luma',
    occluderMaskUrl: '/visualizador-assets/wall-occluders-v2.png',
    occluderMaskMode: 'luma',
    shadowMaskUrl: '',
    shadowMaskMode: 'luma',
    projectionMode: 'wall',
    finishOptions: [
      { id: 'classic', label: 'Clasico', textureKey: 'classic' },
      { id: 'fine', label: 'Texturado fino', textureKey: 'fine' },
      { id: 'medium', label: 'Texturado medio', textureKey: 'medium' },
      { id: 'coarse', label: 'Texturado grueso', textureKey: 'coarse' },
      { id: 'historical', label: 'Historico', textureKey: 'historical' }
    ],
    occluderShapes: [
      { kind: 'rect', x: 870, y: 755, width: 370, height: 270, radius: 2, feather: 4 },
      { kind: 'rect', x: 1065, y: 530, width: 180, height: 280, radius: 30, feather: 6 }
    ],
    defaults: { scale: 100, rotation: 0, offsetX: 0, offsetY: 0, opacity: 88, lighting: 35 },
    maskFile: 'wall-mask-v2.png',
    imageFile: 'wall-original.png'
  },
  {
    id: 'floor',
    label: 'Piso',
    target: 'floor',
    imageUrl: '/visualizador-assets/wall-original.png',
    maskUrl: '/visualizador-assets/floor-mask-v2.png',
    surfaceMaskUrl: '/visualizador-assets/floor-mask-v2.png',
    surfaceMaskMode: 'luma',
    occluderMaskUrl: '/visualizador-assets/floor-occluders-v2.png',
    occluderMaskMode: 'luma',
    shadowMaskUrl: '/visualizador-assets/floor-shadows-v2.png',
    shadowMaskMode: 'luma',
    projectionMode: 'floor',
    occluderShapes: [],
    shadowShapes: [],
    defaults: { scale: 120, rotation: 0, offsetX: 0, offsetY: 0, opacity: 92, lighting: 42 },
    maskFile: 'floor-mask-v2.png',
    imageFile: 'wall-original.png'
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
  const nativeWidth = metadata.width || maxWidth;
  const nativeHeight = metadata.height || maxWidth;
  const scale = Math.min(1, maxWidth / nativeWidth);
  const outputWidth = Math.max(1, Math.round(nativeWidth * scale));
  const outputHeight = Math.max(1, Math.round(nativeHeight * scale));

  const imageBuffer = await sharp(imagePath)
    .resize(outputWidth, outputHeight, { fit: 'fill' })
    .png()
    .toBuffer();

  const rawMaskBuffer = await sharp(maskPath)
    .resize(outputWidth, outputHeight, { fit: 'fill' })
    .ensureAlpha()
    .png()
    .toBuffer();

  const occluderBuffer = await buildOccluderCoverageBuffer(template, nativeWidth, nativeHeight, outputWidth, outputHeight);
  const maskBuffer = await convertSurfaceMaskForOpenAI(
    rawMaskBuffer,
    template.surfaceMaskMode || 'alpha-cutout',
    occluderBuffer,
    template.occluderMaskMode || 'luma'
  );

  return { imageBuffer, maskBuffer };
}

// Renders occluderMaskUrl + occluderShapes into a single RGBA coverage buffer so
// furniture/objects are protected in the mask sent to OpenAI, not just via prompt text.
async function buildOccluderCoverageBuffer(template, nativeWidth, nativeHeight, outputWidth, outputHeight) {
  const root = process.cwd();
  const layers = [];

  if (template.occluderMaskUrl) {
    const occluderPath = path.join(root, 'api', 'visualizador-assets', path.basename(template.occluderMaskUrl));
    if (await fileExists(occluderPath)) {
      layers.push(
        await sharp(occluderPath).resize(outputWidth, outputHeight, { fit: 'fill' }).ensureAlpha().raw().toBuffer()
      );
    }
  }

  if (template.occluderShapes?.length) {
    const svg = buildShapesSvg(template.occluderShapes, nativeWidth, nativeHeight);
    layers.push(
      await sharp(Buffer.from(svg)).resize(outputWidth, outputHeight, { fit: 'fill' }).ensureAlpha().raw().toBuffer()
    );
  }

  if (!layers.length) return null;

  const merged = Buffer.alloc(outputWidth * outputHeight * 4);
  for (const layer of layers) {
    for (let i = 0; i < merged.length; i += 4) {
      merged[i] = Math.max(merged[i], layer[i]);
      merged[i + 1] = Math.max(merged[i + 1], layer[i + 1]);
      merged[i + 2] = Math.max(merged[i + 2], layer[i + 2]);
      merged[i + 3] = Math.max(merged[i + 3], layer[i + 3]);
    }
  }
  return merged;
}

function buildShapesSvg(shapes, width, height) {
  const parts = shapes.map((shape) => {
    const feather = Number(shape.feather || 0);
    const filterAttr = feather > 0 ? ` filter="blur(${feather}px)"` : '';
    if (shape.kind === 'rect') {
      return `<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" rx="${shape.radius || 0}" fill="#ffffff"${filterAttr}/>`;
    }
    if (shape.kind === 'polygon' && Array.isArray(shape.points)) {
      const points = shape.points.map((p) => p.join(',')).join(' ');
      return `<polygon points="${points}" fill="#ffffff"${filterAttr}/>`;
    }
    if (shape.kind === 'ellipse') {
      return `<ellipse cx="${shape.cx}" cy="${shape.cy}" rx="${shape.rx}" ry="${shape.ry}" fill="#ffffff" transform="rotate(${shape.rotation || 0} ${shape.cx} ${shape.cy})"${filterAttr}/>`;
    }
    return '';
  }).join('');
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${parts}</svg>`;
}

async function convertSurfaceMaskForOpenAI(maskBuffer, maskMode, occluderBuffer = null, occluderMode = 'luma') {
  const { data, info } = await sharp(maskBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const output = Buffer.alloc(data.length);

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    const luma = Math.round((data[i] * 0.299) + (data[i + 1] * 0.587) + (data[i + 2] * 0.114));
    let coverage;

    if (maskMode === 'alpha') {
      coverage = alpha;
    } else if (maskMode === 'luma') {
      coverage = Math.round((luma * alpha) / 255);
    } else if (maskMode === 'luma-invert') {
      coverage = 255 - Math.round((luma * alpha) / 255);
    } else {
      coverage = 255 - alpha;
    }

    if (occluderBuffer) {
      const oAlpha = occluderBuffer[i + 3];
      const oLuma = Math.round((occluderBuffer[i] * 0.299) + (occluderBuffer[i + 1] * 0.587) + (occluderBuffer[i + 2] * 0.114));
      const occluderCoverage = occluderMode === 'alpha' ? oAlpha : Math.round((oLuma * oAlpha) / 255);
      coverage = Math.round(coverage * (1 - occluderCoverage / 255));
    }

    const protectedAlpha = 255 - Math.max(0, Math.min(255, coverage));
    output[i] = 0;
    output[i + 1] = 0;
    output[i + 2] = 0;
    output[i + 3] = protectedAlpha;
  }

  return sharp(output, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  }).png().toBuffer();
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
  const texture = item.texture || inferTextureFromCategory(category);
  const accent = item.accent || defaultAccentFor(swatch);
  const renderMode = texture === 'paint' || category.includes('pintura') ? 'paint' : 'material';

  return targets.map((target, index) => ({
    id: index === 0 ? String(item.id) : `${item.id}_${target}`,
    sourceId: String(item.id),
    label,
    target,
    prompt,
    swatch,
    photo,
    texture,
    accent,
    category: item.category || item.tipo || '',
    source: 'firebase',
    renderMode
  }));
}

function inferTextureFromCategory(category) {
  if (category.includes('madera')) return 'wood';
  if (category.includes('piso')) return 'wood';
  if (category.includes('pintura')) return 'paint';
  if (category.includes('revest')) return 'stone';
  return 'cement';
}

function defaultAccentFor(hex) {
  const value = String(hex || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return '#9aa0a8';
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `#${[r, g, b].map((channel) => Math.max(0, Math.min(255, Math.round(channel * 0.72))).toString(16).padStart(2, '0')).join('')}`;
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
    { id: 'wall_paint_white', label: 'Pintura blanco lino', target: 'wall', prompt: 'warm white matte wall paint', swatch: '#f3ede1', photo: '', texture: 'paint', accent: '#d8cfbe', renderMode: 'paint', category: 'Pinturas' },
    { id: 'wall_microcement', label: 'Microcemento gris', target: 'wall', prompt: 'smooth gray microcement finish', swatch: '#8a8983', photo: '', texture: 'cement', accent: '#6e6c67', renderMode: 'material', category: 'Revestimientos' },
    { id: 'floor_oak', label: 'Roble natural', target: 'floor', prompt: 'natural oak wood flooring', swatch: '#a87a4d', photo: '', texture: 'wood', accent: '#805837', renderMode: 'material', category: 'Pisos' },
    { id: 'facade_stone', label: 'Piedra natural', target: 'facade', prompt: 'natural stone facade cladding', swatch: '#8e7958', photo: '', texture: 'stone', accent: '#6f5f46', renderMode: 'material', category: 'Revestimientos' }
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
