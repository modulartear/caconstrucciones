const { useState, useEffect, useRef, useCallback } = React;

// ───────────────────────── Procedural Swatch Generator ─────────────────────────

function generateTexture(canvas, type, baseColor, accentColor) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = baseColor; ctx.fillRect(0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const hexToRgb = (hex) => {
    const bigint = parseInt(hex.replace('#', ''), 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  };

  const rgb1 = hexToRgb(baseColor);
  const rgb2 = hexToRgb(accentColor || baseColor);
  const rand = (min, max) => Math.random() * (max - min) + min;

  const addNoise = (alpha=0.08) => {
    for (let i = 0; i < data.length; i += 4) {
      const n = rand(-15, 15);
      data[i] = Math.max(0, Math.min(255, data[i] + n));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
    }
  };

  const lerp = (a,b,t)=>a+(b-a)*t;

  if (type === 'concrete') {
    addNoise(0.12);
    for (let i = 0; i < 60; i++) {
      const x = rand(0, w), y = rand(0, h);
      const r = rand(1, 3);
      const idx = (Math.floor(y) * w + Math.floor(x)) * 4;
      const d = rand(10, 20);
      data[idx] = Math.max(0, Math.min(255, data[idx] - d));
      data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] - d));
      data[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] - d));
    }
  } else if (type === 'wood') {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const grain = Math.sin(x * 0.08 + Math.sin(y * 0.02) * 2) * 20;
        const t = Math.random();
        data[i] = lerp(rgb1.r, rgb2.r, t) + grain + rand(-8, 8);
        data[i + 1] = lerp(rgb1.g, rgb2.g, t) + grain + rand(-8, 8);
        data[i + 2] = lerp(rgb1.b, rgb2.b, t) + grain + rand(-8, 8);
      }
    }
  } else if (type === 'tiles') {
    const tw = 44, th = 44, gap = 3;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const lx = x % (tw + gap);
        const ly = y % (th + gap);
        if (lx > tw || ly > th) {
          data[i] = 30; data[i + 1] = 30; data[i + 2] = 32;
        } else {
          const noise = rand(-8, 8);
          const t = 0.35 + Math.random() * 0.35;
          data[i] = lerp(rgb1.r, rgb2.r, t) + noise;
          data[i + 1] = lerp(rgb1.g, rgb2.g, t) + noise;
          data[i + 2] = lerp(rgb1.b, rgb2.b, t) + noise;
        }
      }
    }
  } else if (type === 'paint') {
    addNoise(0.05);
    for (let i = 0; i < data.length; i += 4) {
      const v = rand(0, 1);
      if (v > 0.995) {
        const sp = rand(20, 40);
        data[i] = Math.max(0, Math.min(255, data[i] + sp));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + sp));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + sp));
      }
    }
  } else {
    addNoise(0.06);
  }

  ctx.putImageData(imageData, 0, 0);
}

function ProceduralSwatch({ material, size = 90, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (material.photo) {
      const ctx = ref.current.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, ref.current.width, ref.current.height);
      };
      img.src = material.photo;
    } else {
      generateTexture(ref.current, material.texture, material.color, material.accent);
    }
  }, [material.id, material.color, material.accent, material.texture, material.photo, size]);
  return <canvas ref={ref} className={className} />;
}

// ───────────────────────── Detection Mejorada (solo frontend) ─────────────────────────

function analyzeImage(img, width, height) {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(img, 0, 0, width, height);

  const imgData = tempCtx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const wallMask = new Uint8Array(width * height);
  const floorMask = new Uint8Array(width * height);

  const blockSize = 8;
  const floorStart = Math.floor(height * 0.55);
  const wallEnd = Math.floor(height * 0.75);

  let totalR = 0, totalG = 0, totalB = 0, totalPixels = 0;
  for (let i = 0; i < data.length; i += 4) {
    totalR += data[i];
    totalG += data[i + 1];
    totalB += data[i + 2];
    totalPixels++;
  }

  for (let by = 0; by < height; by += blockSize) {
    for (let bx = 0; bx < width; bx += blockSize) {
      const bh = Math.min(blockSize, height - by);
      const bw = Math.min(blockSize, width - bx);

      let r = 0, g = 0, b = 0, count = 0;
      for (let y = by; y < by + bh; y++) {
        for (let x = bx; x < bx + bw; x++) {
          const idx = (y * width + x) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          count++;
        }
      }
      r /= count; g /= count; b /= count;

      let variance = 0;
      for (let y = by; y < by + bh; y++) {
        for (let x = bx; x < bx + bw; x++) {
          const idx = (y * width + x) * 4;
          variance += Math.pow(data[idx] - r, 2) + Math.pow(data[idx + 1] - g, 2) + Math.pow(data[idx + 2] - b, 2);
        }
      }
      variance /= count;

      const brightness = (r + g + b) / 3;
      const maxCh = Math.max(r, g, b);
      const minCh = Math.min(r, g, b);
      const saturation = maxCh > 0 ? (maxCh - minCh) / maxCh : 0;

      const isUniform = variance < 800;
      const isNotTooDark = brightness > 40;
      const isNotTooSaturated = saturation < 0.6;
      
      const isFloorArea = by >= floorStart;
      const isWallArea = by <= wallEnd && !isFloorArea;

      let wallValue = 0;
      let floorValue = 0;

      if (isUniform && isNotTooDark && isNotTooSaturated) {
        if (isFloorArea) {
          floorValue = 1;
        } else if (isWallArea) {
          wallValue = 1;
        }
      }

      for (let y = by; y < by + bh; y++) {
        for (let x = bx; x < bx + bw; x++) {
          const idx = y * width + x;
          wallMask[idx] = wallValue;
          floorMask[idx] = floorValue;
        }
      }
    }
  }

  const dilate = (arr, times = 2) => {
    let result = new Uint8Array(arr);
    for (let t = 0; t < times; t++) {
      const temp = new Uint8Array(result);
      for (let y = 2; y < height - 2; y++) {
        for (let x = 2; x < width - 2; x++) {
          const idx = y * width + x;
          const neighbors = [
            result[(y - 2) * width + x],
            result[(y - 1) * width + x],
            result[(y + 1) * width + x],
            result[(y + 2) * width + x],
            result[y * width + (x - 2)],
            result[y * width + (x - 1)],
            result[y * width + (x + 1)],
            result[y * width + (x + 2)],
            result[(y - 1) * width + (x - 1)],
            result[(y - 1) * width + (x + 1)],
            result[(y + 1) * width + (x - 1)],
            result[(y + 1) * width + (x + 1)]
          ];
          if (neighbors.filter(n => n).length >= 5) temp[idx] = 1;
        }
      }
      result = temp;
    }
    return result;
  };

  const erode = (arr, times = 1) => {
    let result = new Uint8Array(arr);
    for (let t = 0; t < times; t++) {
      const temp = new Uint8Array(result);
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          const neighbors = [
            result[(y - 1) * width + x],
            result[(y + 1) * width + x],
            result[y * width + (x - 1)],
            result[y * width + (x + 1)],
            result[idx]
          ];
          if (!neighbors.every(n => n)) temp[idx] = 0;
        }
      }
      result = temp;
    }
    return result;
  };

  const fillHoles = (arr) => {
    let result = new Uint8Array(arr);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (result[idx] === 0) {
          const neighbors = [
            result[(y - 1) * width + x],
            result[(y + 1) * width + x],
            result[y * width + (x - 1)],
            result[y * width + (x + 1)]
          ];
          if (neighbors.every(n => n === 1)) {
            result[idx] = 1;
          }
        }
      }
    }
    return result;
  };

  let processedWalls = dilate(wallMask, 4);
  processedWalls = erode(processedWalls, 2);
  processedWalls = fillHoles(processedWalls);
  processedWalls = dilate(processedWalls, 2);
  
  let processedFloors = dilate(floorMask, 3);
  processedFloors = erode(processedFloors, 1);
  processedFloors = fillHoles(processedFloors);
  processedFloors = dilate(processedFloors, 2);

  for (let y = floorStart; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (processedFloors[idx]) {
        processedWalls[idx] = 0;
      }
    }
  }

  const maskToCanvas = (mask) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(width, height);
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      const val = mask[i] ? 255 : 0;
      imgData.data[idx] = val;
      imgData.data[idx + 1] = val;
      imgData.data[idx + 2] = val;
      imgData.data[idx + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas;
  };

  return {
    walls: maskToCanvas(processedWalls),
    floors: maskToCanvas(processedFloors)
  };
}

// ───────────────────────── MaterialTester (main) ─────────────────────────

function MaterialTester() {
  const [materials, setMaterials] = useState(() => window.CAStore.get('materials'));
  const [selectedWallId, setSelectedWallId] = useState(() => window.CAStore.get('materials')[0]?.id);
  const [selectedFloorId, setSelectedFloorId] = useState(() => window.CAStore.get('materials')[0]?.id);
  const [photo, setPhoto] = useState(null);
  const [activeSurface, setActiveSurface] = useState('walls');
  const [mode, setMode] = useState('paint');
  const [brushSize, setBrushSize] = useState(70);
  const [intensity, setIntensity] = useState(0.78);
  const [comparing, setComparing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const canvasRef = useRef(null);
  const wallMaskRef = useRef(null);
  const floorMaskRef = useRef(null);
  const wallPatternRef = useRef(null);
  const floorPatternRef = useRef(null);
  const drawing = useRef(false);
  const lastPt = useRef(null);

  if (!canvasRef.current && typeof document !== 'undefined') {
    canvasRef.current = document.createElement('canvas');
  }
  if (!wallMaskRef.current) wallMaskRef.current = document.createElement('canvas');
  if (!floorMaskRef.current) floorMaskRef.current = document.createElement('canvas');
  if (!wallPatternRef.current) wallPatternRef.current = document.createElement('canvas');
  if (!floorPatternRef.current) floorPatternRef.current = document.createElement('canvas');

  useEffect(() => window.CAStore.on('materials', (m) => {
    setMaterials(m);
    if (!m.find((x) => x.id === selectedWallId)) setSelectedWallId(m[0]?.id);
    if (!m.find((x) => x.id === selectedFloorId)) setSelectedFloorId(m[0]?.id);
  }), [selectedWallId, selectedFloorId]);

  const selectedWall = materials.find((m) => m.id === selectedWallId);
  const selectedFloor = materials.find((m) => m.id === selectedFloorId);

  const buildPattern = (material, patternCanvas) => {
    return new Promise((resolve) => {
      patternCanvas.width = 300;
      patternCanvas.height = 300;
      if (material.photo) {
        const img = new Image();
        img.onload = () => {
          const ctx = patternCanvas.getContext('2d');
          ctx.drawImage(img, 0, 0, patternCanvas.width, patternCanvas.height);
          resolve();
        };
        img.src = material.photo;
      } else {
        generateTexture(patternCanvas, material.texture, material.color, material.accent);
        resolve();
      }
    });
  };

  useEffect(() => {
    if (selectedWall) {
      buildPattern(selectedWall, wallPatternRef.current).then(composite);
    }
  }, [selectedWallId, selectedWall?.color, selectedWall?.accent, selectedWall?.texture, selectedWall?.photo]);

  useEffect(() => {
    if (selectedFloor) {
      buildPattern(selectedFloor, floorPatternRef.current).then(composite);
    }
  }, [selectedFloorId, selectedFloor?.color, selectedFloor?.accent, selectedFloor?.texture, selectedFloor?.photo]);

  const composite = useCallback(() => {
    if (!photo || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.drawImage(photo, 0, 0, canvas.width, canvas.height);
    if (comparing) return;

    const applyMaterial = (patternCanvas, maskCanvas) => {
      const ov = document.createElement('canvas');
      ov.width = canvas.width;
      ov.height = canvas.height;
      const octx = ov.getContext('2d');
      const pat = octx.createPattern(patternCanvas, 'repeat');
      octx.fillStyle = pat;
      octx.fillRect(0, 0, ov.width, ov.height);
      octx.globalCompositeOperation = 'destination-in';
      octx.drawImage(maskCanvas, 0, 0);
      
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = intensity;
      ctx.drawImage(ov, 0, 0);
      
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = intensity * 0.22;
      ctx.drawImage(ov, 0, 0);
      
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    };

    if (selectedWall && wallMaskRef.current) applyMaterial(wallPatternRef.current, wallMaskRef.current);
    if (selectedFloor && floorMaskRef.current) applyMaterial(floorPatternRef.current, floorMaskRef.current);
  }, [photo, intensity, comparing, selectedWall, selectedFloor]);

  useEffect(() => { composite(); }, [composite]);

  const loadPhoto = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        const maxW = 920;
        const maxH = 620;
        let w = img.width;
        let h = img.height;
        const ratio = Math.min(maxW / w, maxH / h, 1);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
        canvasRef.current.width = w;
        canvasRef.current.height = h;
        wallMaskRef.current.width = w;
        wallMaskRef.current.height = h;
        floorMaskRef.current.width = w;
        floorMaskRef.current.height = h;

        const { walls, floors } = analyzeImage(img, w, h);
        
        const wallCtx = walls.getContext('2d');
        const wallData = wallCtx.getImageData(0, 0, w, h);
        const wallMaskCtx = wallMaskRef.current.getContext('2d');
        wallMaskCtx.putImageData(wallData, 0, 0);

        const floorCtx = floors.getContext('2d');
        const floorData = floorCtx.getImageData(0, 0, w, h);
        const floorMaskCtx = floorMaskRef.current.getContext('2d');
        floorMaskCtx.putImageData(floorData, 0, 0);

        setPhoto(img);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const loadDemo = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      const maxW = 920;
      const maxH = 620;
      let w = img.width;
      let h = img.height;
      const ratio = Math.min(maxW / w, maxH / h, 1);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
      canvasRef.current.width = w;
      canvasRef.current.height = h;
      wallMaskRef.current.width = w;
      wallMaskRef.current.height = h;
      floorMaskRef.current.width = w;
      floorMaskRef.current.height = h;

      const { walls, floors } = analyzeImage(img, w, h);
      
      const wallCtx = walls.getContext('2d');
      const wallData = wallCtx.getImageData(0, 0, w, h);
      const wallMaskCtx = wallMaskRef.current.getContext('2d');
      wallMaskCtx.putImageData(wallData, 0, 0);

      const floorCtx = floors.getContext('2d');
      const floorData = floorCtx.getImageData(0, 0, w, h);
      const floorMaskCtx = floorMaskRef.current.getContext('2d');
      floorMaskCtx.putImageData(floorData, 0, 0);

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

  const getActiveMaskRef = () => {
    return activeSurface === 'walls' ? wallMaskRef.current : floorMaskRef.current;
  };

  const stroke = (from, to) => {
    const maskRef = getActiveMaskRef();
    if (!maskRef) return;
    const mctx = maskRef.getContext('2d');
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
    const maskRef = getActiveMaskRef();
    if (!maskRef) return;
    const mctx = maskRef.getContext('2d');
    mctx.clearRect(0, 0, maskRef.width, maskRef.height);
    composite();
  };

  const reDetect = () => {
    if (!photo) return;
    const { walls, floors } = analyzeImage(photo, canvasRef.current.width, canvasRef.current.height);
    
    const wallCtx = walls.getContext('2d');
    const wallData = wallCtx.getImageData(0, 0, walls.width, walls.height);
    const wallMaskCtx = wallMaskRef.current.getContext('2d');
    wallMaskCtx.putImageData(wallData, 0, 0);

    const floorCtx = floors.getContext('2d');
    const floorData = floorCtx.getImageData(0, 0, floors.width, floors.height);
    const floorMaskCtx = floorMaskRef.current.getContext('2d');
    floorMaskCtx.putImageData(floorData, 0, 0);

    composite();
  };

  const fillAll = () => {
    const maskRef = getActiveMaskRef();
    if (!maskRef) return;
    const mctx = maskRef.getContext('2d');
    mctx.globalCompositeOperation = 'source-over';
    mctx.fillStyle = '#fff';
    mctx.fillRect(0, 0, maskRef.width, maskRef.height);
    composite();
  };
  const download = () => {
    if (!canvasRef.current || !photo) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url; a.download = `simulacion-ca.png`;
    a.click();
  };


  return (
    <div className="tester">
      <div className="tester-header">
        <div>
          <h3>Probador de Materiales</h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: '6px 0 0' }}>
            Subí una foto y simulá cómo lucen nuestros materiales en paredes y pisos.
          </p>
        </div>
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
              <p>Detectamos automáticamente paredes y pisos. Seleccioná materiales para verlos aplicados.</p>
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
            <h4>Superficie activa</h4>
            <div className="tester-tools" style={{ marginBottom: 16 }}>
              <button 
                className={`tool-btn ${activeSurface === 'walls' ? 'active' : ''}`} 
                onClick={() => setActiveSurface('walls')}
                disabled={!photo}
              >
                🧱 Paredes
              </button>
              <button 
                className={`tool-btn ${activeSurface === 'floors' ? 'active' : ''}`} 
                onClick={() => setActiveSurface('floors')}
                disabled={!photo}
              >
                🪵 Pisos
              </button>
            </div>
          </div>

          <div>
            <h4>Material para {activeSurface === 'walls' ? 'paredes' : 'pisos'}</h4>
            <div className="tester-mat-grid">
              {materials.map((m) => {
                const isActive = activeSurface === 'walls' ? m.id === selectedWallId : m.id === selectedFloorId;
                return (
                  <div
                    key={m.id}
                    className={`tester-mat ${isActive ? 'active' : ''}`}
                    title={m.name}
                    onClick={() => {
                      if (activeSurface === 'walls') {
                        setSelectedWallId(m.id);
                      } else {
                        setSelectedFloorId(m.id);
                      }
                    }}
                  >
                    <ProceduralSwatch material={m} size={120} />
                    <div className="label">{m.name.split(' ').slice(0, 2).join(' ')}</div>
                  </div>
                );
              })}
            </div>
            {((activeSurface === 'walls' && selectedWall) || (activeSurface === 'floors' && selectedFloor)) && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)' }}>
                <b style={{ color: 'var(--text)' }}>
                  {(activeSurface === 'walls' ? selectedWall?.name : selectedFloor?.name)}
                </b> · $
                {(activeSurface === 'walls' ? selectedWall?.price : selectedFloor?.price)?.toLocaleString('es-AR')}/
                {(activeSurface === 'walls' ? selectedWall?.unit : selectedFloor?.unit)}
              </div>
            )}
          </div>

          <div>
            <h4>Herramientas</h4>
            <div className="tester-tools">
              <button className={`tool-btn ${mode === 'paint' ? 'active' : ''}`} onClick={() => setMode('paint')} disabled={!photo}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><circle cx="6" cy="6" r="2"/></svg>
                Agregar
              </button>
              <button className={`tool-btn ${mode === 'erase' ? 'active' : ''}`} onClick={() => setMode('erase')} disabled={!photo}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 20H7L3 16a2 2 0 0 1 0-2.8L13.2 3 21 10.8a2 2 0 0 1 0 2.8L14 21"/></svg>
                Remover
              </button>
              <button className="tool-btn" onClick={reDetect} disabled={!photo}>🔄 Re-detectar</button>
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
        </div>
      </div>
    </div>
  );
}

window.MaterialTester = MaterialTester;
window.ProceduralSwatch = ProceduralSwatch;
window.generateTexture = generateTexture;
