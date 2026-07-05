import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const assetsDir = path.join(root, 'frontend', 'visualizador-assets');
const apiAssetsDir = path.join(root, 'api', 'visualizador-assets');
const sourcePath = path.join(assetsDir, 'wall-original.png');

const REFERENCE_WIDTH = 1024;
const REFERENCE_HEIGHT = 683;

const outputs = [
  {
    file: 'floor-mask-v2.png',
    background: 'rgba(0,0,0,0)',
    shapes: [
      polygon(
        [
          [0, 520],
          [775, 520],
          [1024, 682],
          [0, 682]
        ],
        'white'
      )
    ]
  },
  {
    file: 'floor-occluders-v2.png',
    background: 'black',
    shapes: [
      ellipse(174, 540, 72, 92, 'white'),
      polygon(
        [
          [240, 405],
          [289, 381],
          [357, 383],
          [727, 382],
          [756, 391],
          [757, 520],
          [240, 520]
        ],
        'white'
      ),
      rect(443, 426, 202, 171, 8, 'white'),
      polygon(
        [
          [0, 518],
          [798, 518],
          [829, 622],
          [0, 682]
        ],
        'white'
      ),
      rect(765, 444, 259, 126, 3, 'white'),
      ellipse(944, 534, 38, 58, 'white')
    ]
  },
  {
    file: 'floor-shadows-v2.png',
    background: 'black',
    shapes: [
      polygon(
        [
          [208, 478],
          [780, 478],
          [818, 530],
          [178, 535]
        ],
        'rgba(255,255,255,0.52)'
      ),
      rect(427, 457, 234, 126, 18, 'rgba(255,255,255,0.44)'),
      polygon(
        [
          [720, 468],
          [1024, 468],
          [1024, 576],
          [744, 576]
        ],
        'rgba(255,255,255,0.38)'
      )
    ]
  }
];

const metadata = await sharp(sourcePath).metadata();
const width = metadata.width || REFERENCE_WIDTH;
const height = metadata.height || REFERENCE_HEIGHT;

await fs.mkdir(apiAssetsDir, { recursive: true });

for (const output of outputs) {
  const svg = buildSvg(width, height, output.background, output.shapes);
  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
  await fs.writeFile(path.join(assetsDir, output.file), buffer);
  await fs.writeFile(path.join(apiAssetsDir, output.file), buffer);
  console.log(`Generado ${output.file}`);
}

function scaleX(value, width) {
  return (value / REFERENCE_WIDTH) * width;
}

function scaleY(value, height) {
  return (value / REFERENCE_HEIGHT) * height;
}

function polygon(points, fill) {
  return { kind: 'polygon', points, fill };
}

function rect(x, y, width, height, rx, fill) {
  return { kind: 'rect', x, y, width, height, rx, fill };
}

function ellipse(cx, cy, rx, ry, fill) {
  return { kind: 'ellipse', cx, cy, rx, ry, fill };
}

function buildSvg(width, height, background, shapes) {
  const body = shapes.map((shape) => renderShape(shape, width, height)).join('');
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="${background}" />`,
    body,
    '</svg>'
  ].join('');
}

function renderShape(shape, width, height) {
  if (shape.kind === 'polygon') {
    const points = shape.points
      .map(([x, y]) => `${scaleX(x, width)},${scaleY(y, height)}`)
      .join(' ');
    return `<polygon points="${points}" fill="${shape.fill}" />`;
  }
  if (shape.kind === 'rect') {
    return `<rect x="${scaleX(shape.x, width)}" y="${scaleY(shape.y, height)}" width="${scaleX(shape.width, width)}" height="${scaleY(shape.height, height)}" rx="${scaleX(shape.rx, width)}" fill="${shape.fill}" />`;
  }
  if (shape.kind === 'ellipse') {
    return `<ellipse cx="${scaleX(shape.cx, width)}" cy="${scaleY(shape.cy, height)}" rx="${scaleX(shape.rx, width)}" ry="${scaleY(shape.ry, height)}" fill="${shape.fill}" />`;
  }
  return '';
}
