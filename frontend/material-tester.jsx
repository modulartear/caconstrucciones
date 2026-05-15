// CA Construcciones — Material tester con IA + simulación procedural
// Expone: window.MaterialTester (componente), window.generateTexture, window.ProceduralSwatch

const { useState, useEffect, useRef, useCallback } = React;

// ───────────────────────── Texture generators ─────────────────────────

function hexToRgb(hex) {
  const m = hex.replace('#', '');
  const n = parseInt(m.length === 3 ? m.split('').map((c) => c + c).join('') : m, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  const f = (v) => Math.max(0, Math.min(255, v + amt));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
function withAlpha(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function generateTexture(canvas, type, color, accent) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // base fill
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);

  if (type === 'wood') {
    // base gradient
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, shade(color, -8));
    g.addColorStop(0.5, color);
    g.addColorStop(1, shade(color, -4));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // grain stripes
    const stripes = Math.floor(h / 6);
    for (let i = 0; i < stripes; i++) {
      const y = (i / stripes) * h + Math.sin(i * 1.7) * 2;
      ctx.strokeStyle = withAlpha(accent, 0.08 + Math.random() * 0.18);
      ctx.lineWidth = 0.5 + Math.random() * 1.4;
      ctx.beginPath();
      ctx.moveTo(-2, y);
      for (let x = 0; x <= w + 4; x += 6) {
        ctx.lineTo(x, y + Math.sin(x * 0.04 + i * 0.5) * 1.2);
      }
      ctx.stroke();
    }
    // knots
    for (let i = 0; i < 2; i++) {
      const cx = Math.random() * w;
      const cy = Math.random() * h;
      const rad = 6 + Math.random() * 12;
      const gg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      gg.addColorStop(0, withAlpha(accent, 0.55));
      gg.addColorStop(1, withAlpha(accent, 0));
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'marble') {
    // soft base gradient
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, color);
    g.addColorStop(0.5, shade(color, 6));
    g.addColorStop(1, shade(color, -3));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // soft cloud blobs
    for (let i = 0; i < 6; i++) {
      const cx = Math.random() * w;
      const cy = Math.random() * h;
      const rad = w * (0.2 + Math.random() * 0.3);
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      cg.addColorStop(0, withAlpha(accent, 0.1));
      cg.addColorStop(1, withAlpha(accent, 0));
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, w, h);
    }
    // veins
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = withAlpha(accent, 0.35 + Math.random() * 0.35);
      ctx.lineWidth = 0.4 + Math.random() * 1.6;
      ctx.beginPath();
      let x = Math.random() * w;
      let y = Math.random() * h;
      ctx.moveTo(x, y);
      for (let j = 0; j < 5; j++) {
        const cx1 = Math.random() * w;
        const cy1 = Math.random() * h;
        x += (Math.random() - 0.5) * w * 0.6;
        y += (Math.random() - 0.5) * h * 0.6;
        ctx.quadraticCurveTo(cx1, cy1, x, y);
      }
      ctx.stroke();
    }
  } else if (type === 'brick') {
    const cols = 4;
    const rows = 6;
    const bw = w / cols;
    const bh = h / rows;
    for (let r = 0; r < rows + 1; r++) {
      const offset = (r % 2) * (bw / 2);
      for (let c = -1; c < cols + 1; c++) {
        const x = c * bw + offset;
        const y = r * bh;
        ctx.fillStyle = shade(color, (Math.random() - 0.5) * 22);
        ctx.fillRect(x + 1.2, y + 1.2, bw - 2.4, bh - 2.4);
        // tiny noise inside brick
        for (let k = 0; k < 6; k++) {
          ctx.fillStyle = withAlpha(accent, 0.04 + Math.random() * 0.08);
          ctx.fillRect(x + Math.random() * bw, y + Math.random() * bh, 2, 2);
        }
      }
    }
  } else if (type === 'cement') {
    // noise + soft blobs
    for (let i = 0; i < 30; i++) {
      const cx = Math.random() * w;
      const cy = Math.random() * h;
      const rad = 10 + Math.random() * 50;
      const gg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      gg.addColorStop(0, withAlpha(accent, 0.12));
      gg.addColorStop(1, withAlpha(accent, 0));
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    addNoise(ctx, w, h, 20, 0.18);
  } else if (type === 'stone') {
    // travertino: warm crema with horizontal striations
    for (let i = 0; i < 18; i++) {
      const y = (i / 18) * h + (Math.random() - 0.5) * 6;
      ctx.strokeStyle = withAlpha(accent, 0.15 + Math.random() * 0.2);
      ctx.lineWidth = 0.6 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 8) {
        ctx.lineTo(x, y + Math.sin(x * 0.07 + i) * 1.5);
      }
      ctx.stroke();
    }
    // pores
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = withAlpha(accent, 0.2 + Math.random() * 0.2);
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 0.6 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    addNoise(ctx, w, h, 12, 0.12);
  } else {
    // paint: subtle noise
    addNoise(ctx, w, h, 8, 0.12);
  }
}

function addNoise(ctx, w, h, amount, alpha) {
  const id = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < id.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 2 * amount;
    id.data[i] = Math.max(0, Math.min(255, id.data[i] + n));
    id.data[i + 1] = Math.max(0, Math.min(255, id.data[i + 1] + n));
    id.data[i + 2] = Math.max(0, Math.min(255, id.data[i + 2] + n));
  }
  ctx.putImageData(id, 0, 0);
}

// ───────────────────────── ProceduralSwatch ─────────────────────────

function ProceduralSwatch({ material, size = 200, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.width = size;
    ref.current.height = size;
    if (material.photo) {
      const img = new Image();
      img.onload = () => {
        const ctx = ref.current.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
      };
      img.src = material.photo;
    } else {
      generateTexture(ref.current, material.texture, material.color, material.accent);
    }
  }, [material.id, material.color, material.accent, material.texture, material.photo, size]);
  return <canvas ref={ref} className={className} />;
}

// ───────────────────────── MaterialTester (main) ─────────────────────────

function MaterialTester() {
  const [materials, setMaterials] = useState(() => window.CAStore.get('materials'));
  const [selectedId, setSelectedId] = useState(() => window.CAStore.get('materials')[0]?.id);
  const [photo, setPhoto] = useState(null);
  const [mode, setMode] = useState('paint');
  const [brushSize, setBrushSize] = useState(70);
  const [intensity, setIntensity] = useState(0.78);
  const [comparing, setComparing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResp, setAiResp] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const canvasRef = useRef(null);
  const maskRef = useRef(null);
  const patternRef = useRef(null);
  const drawing = useRef(false);
  const lastPt = useRef(null);

  if (!canvasRef.current && typeof document !== 'undefined') {
    canvasRef.current = document.createElement('canvas');
  }
  if (!maskRef.current) maskRef.current = document.createElement('canvas');
  if (!patternRef.current) patternRef.current = document.createElement('canvas');

  useEffect(() => window.CAStore.on('materials', (m) => {
    setMaterials(m);
    if (!m.find((x) => x.id === selectedId)) setSelectedId(m[0]?.id);
  }), [selectedId]);

  const selected = materials.find((m) => m.id === selectedId);

  // Build / refresh material pattern
  useEffect(() => {
    if (!selected) return;
    const p = patternRef.current;
    p.width = 220; p.height = 220;
    if (selected.photo) {
      const img = new Image();
      img.onload = () => {
        const ctx = p.getContext('2d');
        ctx.drawImage(img, 0, 0, p.width, p.height);
        composite();
      };
      img.src = selected.photo;
    } else {
      generateTexture(p, selected.texture, selected.color, selected.accent);
      composite();
    }
  }, [selectedId, selected?.color, selected?.accent, selected?.texture, selected?.photo]);

  const composite = useCallback(() => {
    if (!photo || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.drawImage(photo, 0, 0, canvas.width, canvas.height);
    if (comparing) return;
    // overlay = pattern repeated, masked
    const ov = document.createElement('canvas');
    ov.width = canvas.width;
    ov.height = canvas.height;
    const octx = ov.getContext('2d');
    const pat = octx.createPattern(patternRef.current, 'repeat');
    octx.fillStyle = pat;
    octx.fillRect(0, 0, ov.width, ov.height);
    octx.globalCompositeOperation = 'destination-in';
    octx.drawImage(maskRef.current, 0, 0);
    // multiply blend preserves lighting/shadow of the photo
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = intensity;
    ctx.drawImage(ov, 0, 0);
    // soft second pass at low alpha for a more painted feel
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = intensity * 0.22;
    ctx.drawImage(ov, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }, [photo, intensity, comparing]);

  useEffect(() => { composite(); }, [composite]);

  const loadPhoto = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (!canvasRef.current || !maskRef.current) {
          console.error('Canvas refs not ready');
          return;
        }
        const maxW = 920;
        const maxH = 620;
        let w = img.width;
        let h = img.height;
        const ratio = Math.min(maxW / w, maxH / h, 1);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
        canvasRef.current.width = w;
        canvasRef.current.height = h;
        maskRef.current.width = w;
        maskRef.current.height = h;
        maskRef.current.getContext('2d').clearRect(0, 0, w, h);
        setPhoto(img);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const loadDemo = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!canvasRef.current || !maskRef.current) {
        console.error('Canvas refs not ready');
        return;
      }
      const maxW = 920;
      const maxH = 620;
      let w = img.width;
      let h = img.height;
      const ratio = Math.min(maxW / w, maxH / h, 1);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
      canvasRef.current.width = w;
      canvasRef.current.height = h;
      maskRef.current.width = w;
      maskRef.current.height = h;
      const mctx = maskRef.current.getContext('2d');
      mctx.clearRect(0, 0, w, h);
      mctx.fillStyle = '#fff';
      mctx.fillRect(w * 0.08, h * 0.05, w * 0.84, h * 0.55);
      setPhoto(img);
    };
    img.src = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1400&q=80';
  };

  const getCoords = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    const t = (e.touches && e.touches[0]) || e;
    return {
      x: ((t.clientX - r.left) / r.width) * canvasRef.current.width,
      y: ((t.clientY - r.top) / r.height) * canvasRef.current.height,
    };
  };

  const stroke = (from, to) => {
    const mctx = maskRef.current.getContext('2d');
    if (mode === 'paint') {
      mctx.globalCompositeOperation = 'source-over';
      mctx.strokeStyle = '#fff';
      mctx.fillStyle = '#fff';
    } else {
      mctx.globalCompositeOperation = 'destination-out';
      mctx.strokeStyle = 'rgba(0,0,0,1)';
      mctx.fillStyle = 'rgba(0,0,0,1)';
    }
    mctx.lineWidth = brushSize;
    mctx.lineCap = 'round';
    mctx.lineJoin = 'round';
    mctx.beginPath();
    mctx.moveTo(from.x, from.y);
    mctx.lineTo(to.x, to.y);
    mctx.stroke();
    // also stamp a circle so single clicks register
    mctx.beginPath();
    mctx.arc(to.x, to.y, brushSize / 2, 0, Math.PI * 2);
    mctx.fill();
    composite();
  };

  const onDown = (e) => {
    if (!photo) return;
    e.preventDefault();
    drawing.current = true;
    const p = getCoords(e);
    lastPt.current = p;
    stroke(p, p);
  };
  const onMove = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const p = getCoords(e);
    stroke(lastPt.current, p);
    lastPt.current = p;
  };
  const onUp = () => { drawing.current = false; lastPt.current = null; };

  const resetMask = () => {
    const mctx = maskRef.current.getContext('2d');
    mctx.clearRect(0, 0, maskRef.current.width, maskRef.current.height);
    composite();
  };
  const fillAll = () => {
    const mctx = maskRef.current.getContext('2d');
    mctx.globalCompositeOperation = 'source-over';
    mctx.fillStyle = '#fff';
    mctx.fillRect(0, 0, maskRef.current.width, maskRef.current.height);
    composite();
  };
  const download = () => {
    if (!canvasRef.current || !photo) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url; a.download = `simulacion-${selected?.name || 'ca'}.png`;
    a.click();
  };

  const askAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResp('');
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      setAiResp(data.response || 'Sin respuesta');
    } catch (e) {
      console.error('Error:', e);
      setAiResp('Error al conectar con IA. Intenta de nuevo.');
    }
    setAiLoading(false);
  };

  return (
    <div className="tester">
      <div className="tester-header">
        <div>
          <h3>Probador de Materiales con IA</h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: '6px 0 0' }}>
            Subí una foto de tu obra y simulá cómo quedan nuestros materiales antes de decidir.
          </p>
        </div>
        <div className="ai-pill"><span className="dot"></span>Powered by Claude AI</div>
      </div>

      <div className="tester-body">
        <div
          className="tester-canvas-wrap"
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); loadPhoto(e.dataTransfer.files?.[0]); }}
        >
          {photo ? (
            <canvas
              ref={canvasRef}
              className="tester-canvas"
              style={{ cursor: comparing ? 'default' : (mode === 'paint' ? 'crosshair' : 'cell') }}
              onMouseDown={onDown}
              onMouseMove={onMove}
              onMouseUp={onUp}
              onMouseLeave={onUp}
              onTouchStart={onDown}
              onTouchMove={onMove}
              onTouchEnd={onUp}
            />
          ) : (
            <div className={`tester-empty tester-drop ${dragging ? 'dragging' : ''}`}>
              <div className="ico">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <h4>Subí una foto de tu espacio</h4>
              <p>Arrastrá una imagen acá o elegí un archivo. Después pintá sobre la pared, piso o mueble para probar materiales.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                  Elegir archivo
                  <input type="file" accept="image/*" hidden onChange={(e) => loadPhoto(e.target.files?.[0])} />
                </label>
                <button className="btn btn-ghost" onClick={loadDemo}>Usar foto de ejemplo</button>
              </div>
            </div>
          )}

          {photo && comparing && (
            <div style={{ position: 'absolute', top: 18, left: 18, padding: '6px 12px', background: 'rgba(0,0,0,0.7)', borderRadius: 999, fontSize: 12, fontWeight: 600, color: 'var(--accent-2)' }}>
              Vista original
            </div>
          )}
        </div>

        <div className="tester-side">
          <div>
            <h4>Material</h4>
            <div className="tester-mat-grid">
              {materials.map((m) => (
                <div
                  key={m.id}
                  className={`tester-mat ${m.id === selectedId ? 'active' : ''}`}
                  title={m.name}
                  onClick={() => setSelectedId(m.id)}
                >
                  <ProceduralSwatch material={m} size={120} />
                  <div className="label">{m.name.split(' ').slice(0, 2).join(' ')}</div>
                </div>
              ))}
            </div>
            {selected && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)' }}>
                <b style={{ color: 'var(--text)' }}>{selected.name}</b> · ${selected.price.toLocaleString('es-AR')}/{selected.unit}
              </div>
            )}
          </div>

          <div>
            <h4>Herramientas</h4>
            <div className="tester-tools">
              <button className={`tool-btn ${mode === 'paint' ? 'active' : ''}`} onClick={() => setMode('paint')} disabled={!photo}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><circle cx="6" cy="6" r="2"/></svg>
                Pintar
              </button>
              <button className={`tool-btn ${mode === 'erase' ? 'active' : ''}`} onClick={() => setMode('erase')} disabled={!photo}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 20H7L3 16a2 2 0 0 1 0-2.8L13.2 3 21 10.8a2 2 0 0 1 0 2.8L14 21"/></svg>
                Borrar
              </button>
              <button className="tool-btn" onClick={fillAll} disabled={!photo}>Pintar todo</button>
              <button className="tool-btn" onClick={resetMask} disabled={!photo}>Limpiar</button>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Tamaño del pincel: <b style={{ color: 'var(--text)' }}>{brushSize}px</b></div>
              <input type="range" min="10" max="200" value={brushSize} onChange={(e) => setBrushSize(+e.target.value)} disabled={!photo} />
              <div style={{ fontSize: 12, color: 'var(--muted)', margin: '12px 0 6px' }}>Intensidad: <b style={{ color: 'var(--text)' }}>{Math.round(intensity * 100)}%</b></div>
              <input type="range" min="20" max="100" value={intensity * 100} onChange={(e) => setIntensity(+e.target.value / 100)} disabled={!photo} />
            </div>
            <div className="tester-tools" style={{ marginTop: 14 }}>
              <button className="tool-btn" onMouseDown={() => setComparing(true)} onMouseUp={() => setComparing(false)} onMouseLeave={() => setComparing(false)} onTouchStart={() => setComparing(true)} onTouchEnd={() => setComparing(false)} disabled={!photo}>Mantené para comparar</button>
              <button className="tool-btn" onClick={download} disabled={!photo}>Descargar</button>
              <label className="tool-btn" style={{ cursor: 'pointer' }}>Cambiar foto<input type="file" accept="image/*" hidden onChange={(e) => loadPhoto(e.target.files?.[0])} /></label>
            </div>
          </div>

          <div className="ai-suggest">
            <h4>🤖 Asesor IA</h4>
            <p>Contanos sobre tu espacio y te recomendamos materiales del catálogo.</p>
            <textarea
              placeholder="Ej: Living de 30m² con mucha luz natural, busco un estilo cálido moderno…"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
            <button
              className="btn btn-primary btn-sm"
              style={{ marginTop: 10, width: '100%', justifyContent: 'center' }}
              onClick={askAI}
              disabled={aiLoading || !aiPrompt.trim()}
            >
              {aiLoading ? 'Analizando con IA…' : 'Pedir recomendación'}
            </button>
            {aiResp && <div className="ai-output">{aiResp}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

window.MaterialTester = MaterialTester;
window.ProceduralSwatch = ProceduralSwatch;
window.generateTexture = generateTexture;
