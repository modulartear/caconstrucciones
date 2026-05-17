import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || ''
});

const materialPrompts = {
  brick: 'Replace only the masked wall areas with realistic exposed red brick. Keep floor, doors, windows, railings, people, shadows and perspective unchanged. Ultra realistic architectural rendering.',
  stone: 'Replace only the masked wall areas with realistic natural stone cladding. Keep floor, doors, windows, railings, people, shadows and perspective unchanged. Ultra realistic architectural rendering.',
  wood: 'Replace only the masked wall areas with realistic wood paneling. Keep floor, doors, windows, railings, people, shadows and perspective unchanged. Ultra realistic architectural rendering.',
  microcement: 'Replace only the masked wall areas with realistic smooth microcement finish. Keep floor, doors, windows, railings, people, shadows and perspective unchanged. Ultra realistic architectural rendering.',
  tile: 'Replace only the masked wall areas with realistic ceramic tiles. Keep floor, doors, windows, railings, people, shadows and perspective unchanged. Ultra realistic architectural rendering.',
  paint: 'Replace only the masked wall areas with a fresh paint finish. Keep floor, doors, windows, railings, people, shadows and perspective unchanged. Ultra realistic architectural rendering.'
};

export default async function visualizeHandler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  try {
    const { imageBase64, materialType } = req.body;

    if (!imageBase64 || !materialType) {
      res.status(400).json({ error: 'Faltan datos: imageBase64 y materialType son requeridos' });
      return;
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      res.status(500).json({ error: 'REPLICATE_API_TOKEN no está configurado' });
      return;
    }

    const prompt = materialPrompts[materialType] || materialPrompts.paint;

    // Primero detectamos las paredes con SegFormer
    console.log('🔍 Detectando paredes con SegFormer...');
    const segmentationOutput = await replicate.run(
      'nvidia/segformer-b0-finetuned-ade-512-512:9e7b669669a0f172717897958e25e44c3d50a97104e22737226866f54e8381',
      {
        input: {
          image: imageBase64
        }
      }
    );

    console.log('✅ Paredes detectadas');

    // Ahora generamos la imagen con FLUX Kontext Max
    console.log('🎨 Generando imagen con FLUX Kontext Max...');
    const fluxOutput = await replicate.run(
      'fofr/flux-kontext-max:3ed1c679e834a442c4e34562062ef990a34f73b9994c2a1073e49d11112c5',
      {
        input: {
          prompt: prompt,
          image: imageBase64,
          mask: segmentationOutput,
          strength: 0.85,
          control_depth: 0.65,
          seed: Math.floor(Math.random() * 2147483647),
          steps: 28,
          guidance_scale: 3.5,
          negative_prompt: 'blurry, distorted, low quality, ugly, cartoon, drawing, painting, illustration, deformed, mutated, bad anatomy'
        }
      }
    );

    console.log('✅ Imagen generada!');

    res.json({
      success: true,
      outputUrl: Array.isArray(fluxOutput) ? fluxOutput[0] : fluxOutput
    });

  } catch (error) {
    console.error('❌ Error en visualización:', error);
    res.status(500).json({
      error: 'Error al generar la imagen',
      details: error.message
    });
  }
}
