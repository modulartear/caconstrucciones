import admin from './auth.js';
import sharp from 'sharp';

const db = admin.firestore();

export default async function segmentHandler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: 'Falta la imagen' });
      return;
    }

    // Primero procesamos la imagen localmente para extraer dimensiones
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const metadata = await sharp(imageBuffer).metadata();
    
    const width = metadata.width;
    const height = metadata.height;

    // Usamos SegFormer de NVIDIA para segmentación semántica
    const HF_API_URL = 'https://api-inference.huggingface.co/models/nvidia/segformer-b0-finetuned-ade-512-512';
    const HF_TOKEN = process.env.HUGGING_FACE_TOKEN || '';

    if (!HF_TOKEN) {
      // Fallback: usar detección simple si no hay token
      const { analyzeImageSimpleCanvas } = await import('./segment-simple.js');
      const result = await analyzeImageSimpleCanvas(imageBuffer, width, height);
      res.json(result);
      return;
    }

    try {
      const response = await fetch(HF_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: imageBase64,
          parameters: {
            task: 'semantic-segmentation'
          }
        })
      });

      if (!response.ok) {
        throw new Error('API de Hugging Face falló');
      }

      const data = await response.json();

      // Mapear etiquetas de ADE20k a nuestras categorías
      const wallLabels = ['wall', 'wall-other', 'partition', 'room-divider', 'doorway', 'doorframe'];
      const floorLabels = ['floor', 'floor-wood', 'floor-tile', 'floor-other', 'carpet', 'rug', 'mat'];

      let wallsMaskBase64 = '';
      let floorsMaskBase64 = '';

      // Si la API devuelve datos de segmentación, procesarlos
      if (data && typeof data === 'object') {
        if (data.mask) {
          // Si devuelve una máscara
          const { processHFMask } = await import('./segment-simple.js');
          const result = await processHFMask(data, width, height, wallLabels, floorLabels);
          wallsMaskBase64 = result.walls;
          floorsMaskBase64 = result.floors;
        } else if (Array.isArray(data)) {
          // Si devuelve una lista de segmentos
          const { processHFSegments } = await import('./segment-simple.js');
          const result = await processHFSegments(data, width, height, wallLabels, floorLabels);
          wallsMaskBase64 = result.walls;
          floorsMaskBase64 = result.floors;
        } else {
          // Fallback
          throw new Error('Formato de respuesta no reconocido');
        }
      } else {
        // Fallback
        throw new Error('Respuesta inválida');
      }

      res.json({
        walls: wallsMaskBase64,
        floors: floorsMaskBase64
      });

    } catch (hfError) {
      // Fallback a detección simple
      console.log('Fallback a detección simple:', hfError);
      const { analyzeImageSimpleCanvas } = await import('./segment-simple.js');
      const result = await analyzeImageSimpleCanvas(imageBuffer, width, height);
      res.json(result);
    }

  } catch (error) {
    console.error('Error en segmentación:', error);
    // Fallback a error
    res.status(500).json({ error: 'Error interno' });
  }
}
