import { Anthropic } from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Use demo materials (no database required)
    const materials = [
      { name: 'Mármol Blanco', category: 'Revestimientos', color: '#FFFFFF', price: 850, unit: 'm²' },
      { name: 'Ladrillo Visto', category: 'Revestimientos', color: '#C41E3A', price: 180, unit: 'm²' },
      { name: 'Cemento Alisado', category: 'Pisos', color: '#8B8680', price: 350, unit: 'm²' }
    ];

    const catalog = materials
      .map(m => `• ${m.name} (${m.category}, $${m.price}/${m.unit})`)
      .join('\n');

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Sos asesor de diseño de CA Construcciones. El cliente dice:
"${prompt}"

Catálogo:
${catalog}

Recomendá 3 materiales. Por cada uno: 1 línea con nombre y 1 explicando por qué. Máximo 110 palabras, en español.`
      }]
    });

    return res.status(200).json({
      response: message.content[0].text
    });

  } catch (error) {
    console.error('AI error:', error);
    res.status(500).json({ error: error.message });
  }
}
