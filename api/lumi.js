// Chatbot Lumi · endpoint unificado
// Acepta { question, context } y usa OpenAI (primero) o Anthropic (segundo) segun variables.
// Si no hay keys configuradas responde status 501 y el frontend hace fallback local.

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

  const openaiKey = process.env.OPENAI_API_KEY || '';
  const anthropicKey = process.env.ANTHROPIC_API_KEY || '';

  if (!openaiKey && !anthropicKey) {
    return res.status(501).json({
      error: 'LLM keys not configured',
      fallback: true,
    });
  }

  try {
    const { question, context } = req.body || {};
    if (!question || !String(question).trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const system = [
      'Sos "Lumi", el asesor virtual oficial de CA Construcciones (Venado Tuerto, Santa Fe).',
      'Tu trabajo es responder solo con la informacion que exista en el CONTEXTO provisto por el cliente.',
      'Si la respuesta no esta en el contexto, decilo claramente y sugiere: ',
      '  - Escribir al WhatsApp oficial (si el contexto lo incluye).',
      '  - Dejar un pedido de presupuesto en la seccion Contacto.',
      'Nunca inventes precios, materiales, plazos ni datos que no aparezcan en el contexto.',
      'Manten el tono amable, cercano y en espanol argentino. Respuestas cortas (max 150 palabras).',
    ].join('\n');

    const user = `PREGUNTA DEL CLIENTE:\n${question}\n\nCONTEXTO EXTRAIDO DE LA PAGINA DE CA CONSTRUCCIONES:\n${context || 'Sin contexto.'}`;

    if (openaiKey) {
      return res.status(200).json(await callOpenAI(openaiKey, system, user));
    }

    return res.status(200).json(await callAnthropic(anthropicKey, system, user));
  } catch (error) {
    console.error('[lumi] error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function callOpenAI(apiKey, system, user) {
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 380,
      temperature: 0.25,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenAI ${resp.status}: ${err.slice(0, 200)}`);
  }
  const data = await resp.json();
  return {
    response: data.choices?.[0]?.message?.content || 'Sin respuesta por ahora.',
    model,
    provider: 'openai',
  };
}

async function callAnthropic(apiKey, system, user) {
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest';
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 380,
      temperature: 0.25,
      system,
      messages: [
        { role: 'user', content: user },
      ],
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Anthropic ${resp.status}: ${err.slice(0, 200)}`);
  }
  const data = await resp.json();
  return {
    response: data.content?.[0]?.text || 'Sin respuesta por ahora.',
    model,
    provider: 'anthropic',
  };
}
