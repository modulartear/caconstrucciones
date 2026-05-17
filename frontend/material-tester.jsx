const { useState, useEffect, useRef, useCallback } = React;

function ProceduralSwatch({ material, size = 90, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const ctx = ref.current.getContext('2d');
    if (material.photo) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, ref.current.width, ref.current.height);
      img.src = material.photo;
    } else {
      ctx.fillStyle = material.color;
      ctx.fillRect(0, 0, ref.current.width, ref.current.height);
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * ref.current.width;
        const y = Math.random() * ref.current.height;
        const r = Math.random() * 20 + 5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [material.id, material.color, material.photo, size]);
  return <canvas ref={ref} width={size} height={size} className={className} />;
}

function MaterialTester() {
  const [materials, setMaterials] = useState(() => window.CAStore.get('materials'));
  const [selectedMaterialId, setSelectedMaterialId] = useState(() => window.CAStore.get('materials')[0]?.id);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [outputImage, setOutputImage] = useState(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => window.CAStore.on('materials', (m) => {
    setMaterials(m);
    if (!m.find((x) => x.id === selectedMaterialId)) setSelectedMaterialId(m[0]?.id);
  }), [selectedMaterialId]);

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId);

  const getMaterialType = (material) => {
    if (!material) return 'paint';
    const name = material.name.toLowerCase();
    if (name.includes('ladrillo') || name.includes('brick')) return 'brick';
    if (name.includes('piedra') || name.includes('stone')) return 'stone';
    if (name.includes('madera') || name.includes('wood')) return 'wood';
    if (name.includes('microcemento') || name.includes('microcement')) return 'microcement';
    if (name.includes('azulejo') || name.includes('tile')) return 'tile';
    return 'paint';
  };

  const generateImage = async () => {
    if (!photo || !selectedMaterial) return;
    
    setLoading(true);
    setOutputImage(null);

    try {
      const tempCanvas = document.createElement('canvas');
      const maxW = 1024;
      const maxH = 1024;
      let w = photo.width;
      let h = photo.height;
      const ratio = Math.min(maxW / w, maxH / h, 1);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
      tempCanvas.width = w;
      tempCanvas.height = h;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(photo, 0, 0, w, h);
      const imageBase64 = tempCanvas.toDataURL('image/jpeg', 0.9);

      const materialType = getMaterialType(selectedMaterial);

      const response = await fetch('/api/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, materialType })
      });

      const data = await response.json();
      
      if (data.success && data.outputUrl) {
        setOutputImage(data.outputUrl);
      } else if (data.fallbackMode) {
        alert('⚠️ Probador de IA no disponible: REPLICATE_API_TOKEN no está configurado en Vercel.');
      } else {
        throw new Error(data.error || 'No se generó la imagen');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un error al generar la imagen. ' + (error.message || 'Intenta nuevamente.'));
    } finally {
      setLoading(false);
    }
  };

  const loadPhoto = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setPhoto(img);
        setOutputImage(null);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const loadDemo = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setPhoto(img);
      setOutputImage(null);
    };
    img.src = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1400&q=80';
  };

  const reset = () => {
    setPhoto(null);
    setOutputImage(null);
  };

  return (
    <div className="tester">
      <div className="tester-header">
        <div>
          <h3>Probador de Materiales con IA</h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: '6px 0 0' }}>
            Subí una foto y la IA detectará automáticamente las paredes y aplicará el material.
          </p>
        </div>
      </div>

      <div className="tester-body">
        <div
          className="tester-canvas-wrap"
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); loadPhoto(e.dataTransfer.files?.[0]); }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 520 }}
        >
          {!photo ? (
            <div className={`tester-empty tester-drop ${dragging ? 'dragging' : ''}`}>
              <div className="ico">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <h4>Subí una foto de tu espacio</h4>
              <p>La IA detectará automáticamente las paredes y aplicará el material que elijas.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                  Elegir archivo
                  <input type="file" accept="image/*" hidden onChange={(e) => loadPhoto(e.target.files?.[0])} />
                </label>
                <button className="btn btn-ghost" onClick={loadDemo}>Usar foto de ejemplo</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1 }}>
              <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ padding: 10, background: 'var(--surface)', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600 }}>
                  Original
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c', minHeight: 300 }}>
                  <img src={photo.src} style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain' }} />
                </div>
              </div>
              <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ padding: 10, background: 'var(--surface)', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600 }}>
                  Resultado con IA
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c', minHeight: 300 }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>🎨</div>
                      <div>Generando con IA...</div>
                      <div style={{ fontSize: 12, marginTop: 8 }}>Esto puede tardar 10-30 segundos</div>
                    </div>
                  ) : outputImage ? (
                    <img src={outputImage} style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain' }} />
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
                      Clic en "Generar con IA" para ver el resultado
                    </div>
                  )}
                </div>
              </div>
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
                  className={`tester-mat ${m.id === selectedMaterialId ? 'active' : ''}`}
                  title={m.name}
                  onClick={() => setSelectedMaterialId(m.id)}
                >
                  <ProceduralSwatch material={m} size={120} />
                  <div className="label">{m.name.split(' ').slice(0, 2).join(' ')}</div>
                </div>
              ))}
            </div>
            {selectedMaterial && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)' }}>
                <b style={{ color: 'var(--text)' }}>{selectedMaterial.name}</b> · ${selectedMaterial.price.toLocaleString('es-AR')}/{selectedMaterial.unit}
              </div>
            )}
          </div>

          <div style={{ marginTop: 20 }}>
            <h4>Acciones</h4>
            <div className="tester-tools">
              <button 
                className="btn btn-primary" 
                onClick={generateImage} 
                disabled={!photo || loading}
                style={{ width: '100%' }}
              >
                {loading ? '⏳ Generando...' : '✨ Generar con IA'}
              </button>
              {photo && (
                <button className="btn btn-ghost" onClick={reset} style={{ width: '100%' }}>
                  🔄 Cargar nueva foto
                </button>
              )}
            </div>
          </div>

          <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--muted)' }}>
            <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>💡 Cómo funciona</div>
            <div style={{ marginBottom: 6 }}>1. Subí una foto de tu espacio</div>
            <div style={{ marginBottom: 6 }}>2. Seleccioná un material</div>
            <div style={{ marginBottom: 6 }}>3. Clic en "Generar con IA"</div>
            <div>4. La IA detectará solo las paredes y aplicará el material</div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.MaterialTester = MaterialTester;
window.ProceduralSwatch = ProceduralSwatch;
