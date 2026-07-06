// Visualizador de pared sobre foto fija: mascara pre-calculada + blend mode en canvas.
// Misma tecnica que el demo "repintado_pared_demo.html" (destination-in + globalCompositeOperation),
// con materiales cargados desde el catalogo real (Firestore via /api/materials).
(function () {
  const { useCallback, useEffect, useRef, useState } = React;

  const WALL_PHOTO = '/visualizador-assets/wall-original.png';
  const WALL_MASK = '/visualizador-assets/wall-mask-v2.png';

  // La mascara PNG de oclusores esta vacia en este set de fotos: el sillon y la
  // mesa se protegen recortando estos rectangulos (con difuminado) de la mascara.
  const OCCLUDER_SHAPES = [
    { x: 870, y: 755, width: 370, height: 270, radius: 2, feather: 4 },
    { x: 1065, y: 530, width: 180, height: 280, radius: 30, feather: 6 }
  ];

  const BLEND_MODES = [
    { id: 'color', label: 'Color' },
    { id: 'multiply', label: 'Multiply' },
    { id: 'hue', label: 'Tono' },
    { id: 'normal', label: 'Textura real' }
  ];

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.crossOrigin = 'anonymous';
      img.src = src;
    });
  }

  function seeded(value) {
    const x = Math.sin(value) * 10000;
    return x - Math.floor(x);
  }

  function parseHex(hex) {
    const value = String(hex || '').replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(value)) return { r: 154, g: 160, b: 168 };
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16)
    };
  }

  function alphaColor(hex, opacity) {
    const { r, g, b } = parseHex(hex);
    return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, opacity))})`;
  }

  function deriveAccent(hex) {
    const { r, g, b } = parseHex(hex);
    return `#${[r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c * 0.72))).toString(16).padStart(2, '0')).join('')}`;
  }

  function fillRoundedRect(ctx, x, y, width, height, radius) {
    const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  // Genera una miniatura procedural (sin foto) para que el swatch de cada
  // material de todos modos transmita si es pintura lisa, madera, piedra, etc.
  function drawTexturePreview(ctx, width, height, textureKey, color, accent) {
    const baseColor = color || '#d9d1c4';
    const detailColor = accent || deriveAccent(baseColor);
    const seed = String(`${textureKey}-${baseColor}-${detailColor}`).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, width, height);

    if (textureKey === 'wood') {
      for (let y = 0; y < height; y += 10) {
        ctx.strokeStyle = y % 20 === 0 ? alphaColor(detailColor, 0.42) : 'rgba(255,255,255,.14)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y + seeded(seed + y) * 4);
        for (let x = 0; x <= width; x += 18) ctx.lineTo(x, y + Math.sin((x + seed) * 0.035) * 5);
        ctx.stroke();
      }
      return;
    }

    if (textureKey === 'brick') {
      ctx.strokeStyle = alphaColor(detailColor, 0.38);
      ctx.lineWidth = 2;
      const rowH = Math.max(20, Math.round(height / 4.2));
      const brickW = Math.max(38, Math.round(width / 2.6));
      for (let y = 0; y < height + rowH; y += rowH) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        const offset = Math.floor(y / rowH) % 2 ? brickW / 2 : 0;
        for (let x = -offset; x < width + brickW; x += brickW) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + rowH);
          ctx.stroke();
        }
      }
      return;
    }

    if (textureKey === 'marble') {
      for (let i = 0; i < 16; i++) {
        ctx.strokeStyle = i % 3 === 0 ? alphaColor(detailColor, 0.35) : 'rgba(255,255,255,.22)';
        ctx.lineWidth = seeded(seed + i) * 2 + 0.8;
        ctx.beginPath();
        const startY = seeded(seed + i * 9) * height;
        ctx.moveTo(-20, startY);
        for (let x = 0; x <= width + 20; x += 18) {
          ctx.lineTo(x, startY + Math.sin((x + i * 21) * 0.045) * 10 + seeded(seed + x + i) * 7);
        }
        ctx.stroke();
      }
      return;
    }

    if (textureKey === 'stone' || textureKey === 'cement') {
      for (let i = 0; i < 46; i++) {
        ctx.fillStyle = i % 2 ? alphaColor(detailColor, 0.14) : 'rgba(255,255,255,.09)';
        ctx.beginPath();
        ctx.arc(seeded(seed + i * 13) * width, seeded(seed + i * 29) * height, seeded(seed + i * 43) * 10 + 2, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    if (textureKey === 'paint') {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, baseColor);
      grad.addColorStop(1, deriveAccent(baseColor));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      return;
    }

    for (let i = 0; i < 42; i++) {
      const x = seeded(seed + i * 17) * width;
      const y = seeded(seed + i * 31) * height;
      const r = seeded(seed + i * 47) * 18 + 6;
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.11)' : 'rgba(0,0,0,0.08)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function TextureCanvas({ textureKey, color, accent, size = 62, className = '' }) {
    const ref = useRef(null);

    useEffect(() => {
      if (!ref.current) return;
      const ctx = ref.current.getContext('2d');
      drawTexturePreview(ctx, size, size, textureKey, color, accent);
    }, [textureKey, color, accent, size]);

    return <canvas ref={ref} width={size} height={size} className={className} />;
  }

  function MaterialThumb({ material }) {
    if (material.photo) {
      return <img className="ca-viz-material-photo" src={material.photo} alt="" loading="lazy" />;
    }
    return (
      <TextureCanvas
        textureKey={material.texture || (material.renderMode === 'paint' ? 'paint' : 'cement')}
        color={material.swatch || '#ccc'}
        accent={material.accent || deriveAccent(material.swatch || '#ccc')}
        size={62}
        className="ca-viz-swatch"
      />
    );
  }

  // Convierte la mascara de pared (grises: blanco = pared) en una mascara alpha
  // real y recorta el sillon/mesa, para poder usarla despues con destination-in.
  function buildWallMaskCanvas(maskImg, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(maskImg, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const luma = Math.round((data[i] * 0.299) + (data[i + 1] * 0.587) + (data[i + 2] * 0.114));
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = luma;
    }
    ctx.putImageData(imageData, 0, 0);

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    OCCLUDER_SHAPES.forEach((shape) => {
      ctx.save();
      if (shape.feather) ctx.filter = `blur(${shape.feather}px)`;
      ctx.fillStyle = '#fff';
      fillRoundedRect(ctx, shape.x, shape.y, shape.width, shape.height, shape.radius || 0);
      ctx.restore();
    });
    ctx.restore();

    return canvas;
  }

  function CompareSlider({ beforeSrc, afterSrc, beforeLabel = 'Antes', afterLabel = 'Después', loadingLabel = '' }) {
    const [percent, setPercent] = useState(50);

    return (
      <div className="ca-compare">
        <div className="ca-compare-frame">
          {afterSrc ? (
            <img className="ca-compare-img ca-compare-after" src={afterSrc} alt={afterLabel} />
          ) : (
            <div className="ca-compare-img ca-compare-empty">{loadingLabel || afterLabel}</div>
          )}
          {beforeSrc && (
            <img
              className="ca-compare-img ca-compare-before"
              src={beforeSrc}
              alt={beforeLabel}
              style={{ clipPath: `inset(0 ${100 - percent}% 0 0)` }}
            />
          )}
          <div className="ca-compare-line" style={{ left: `${percent}%` }} />
          <span className="ca-compare-tag ca-compare-tag-before">{beforeLabel}</span>
          <span className="ca-compare-tag ca-compare-tag-after">{afterLabel}</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={percent}
          onChange={(e) => setPercent(Number(e.target.value))}
          className="ca-compare-range"
          aria-label="Deslizar para comparar antes y después"
        />
      </div>
    );
  }

  function VisualizadorIAWidget({ apiUrl = '' }) {
    const [materials, setMaterials] = useState([]);
    const [materialId, setMaterialId] = useState('');
    const [blendMode, setBlendMode] = useState('color');
    const [photoImg, setPhotoImg] = useState(null);
    const [maskCanvas, setMaskCanvas] = useState(null);
    const [textureImg, setTextureImg] = useState(null);
    const [afterUrl, setAfterUrl] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
      fetch(`${apiUrl}/api/materials`)
        .then((r) => r.json())
        .then((data) => {
          const wallMaterials = (Array.isArray(data.materials) ? data.materials : []).filter((m) => m.target === 'wall');
          setMaterials(wallMaterials);
        })
        .catch(() => setError('No se pudo cargar la lista de materiales.'));
    }, [apiUrl]);

    useEffect(() => {
      let cancelled = false;
      Promise.all([loadImage(WALL_PHOTO), loadImage(WALL_MASK)])
        .then(([photo, mask]) => {
          if (cancelled) return;
          const width = photo.naturalWidth || photo.width;
          const height = photo.naturalHeight || photo.height;
          setPhotoImg(photo);
          setMaskCanvas(buildWallMaskCanvas(mask, width, height));
        })
        .catch(() => setError('No se pudo cargar la foto de la escena.'));
      return () => {
        cancelled = true;
      };
    }, []);

    useEffect(() => {
      if (materials.length && !materials.some((m) => m.id === materialId)) {
        setMaterialId(materials[0].id);
      }
    }, [materials, materialId]);

    const material = materials.find((m) => m.id === materialId) || materials[0] || null;

    useEffect(() => {
      if (material) setBlendMode(material.photo ? 'normal' : 'color');
    }, [material?.id]);

    useEffect(() => {
      let cancelled = false;
      if (material?.photo) {
        loadImage(material.photo)
          .then((img) => { if (!cancelled) setTextureImg(img); })
          .catch(() => setTextureImg(null));
      } else {
        setTextureImg(null);
      }
      return () => {
        cancelled = true;
      };
    }, [material?.photo]);

    const render = useCallback(() => {
      if (!photoImg || !maskCanvas || !material) return;
      const width = photoImg.naturalWidth || photoImg.width;
      const height = photoImg.naturalHeight || photoImg.height;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // 1. foto base
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(photoImg, 0, 0, width, height);

      // 2. capa de color/textura recortada con la mascara de pared
      const layer = document.createElement('canvas');
      layer.width = width;
      layer.height = height;
      const lctx = layer.getContext('2d');
      if (textureImg && material.photo) {
        const tileSize = 420;
        const scale = tileSize / textureImg.width;
        lctx.save();
        lctx.scale(scale, scale);
        lctx.fillStyle = lctx.createPattern(textureImg, 'repeat');
        lctx.fillRect(0, 0, width / scale, height / scale);
        lctx.restore();
      } else {
        lctx.fillStyle = material.swatch || '#b8b7b0';
        lctx.fillRect(0, 0, width, height);
      }
      lctx.globalCompositeOperation = 'destination-in';
      lctx.drawImage(maskCanvas, 0, 0, width, height);

      // 3. mezcla la capa recortada sobre la foto, preservando luces y sombras
      ctx.globalCompositeOperation = blendMode === 'normal' ? 'source-over' : blendMode;
      ctx.drawImage(layer, 0, 0);
      ctx.globalCompositeOperation = 'source-over';

      setAfterUrl(canvas.toDataURL('image/png'));
    }, [photoImg, maskCanvas, material, textureImg, blendMode]);

    useEffect(() => { render(); }, [render]);

    const blendOptions = material?.photo ? BLEND_MODES : BLEND_MODES.filter((mode) => mode.id !== 'normal');

    return (
      <div className="ca-viz">
        <div className="ca-viz-panel">
          <div>
            <div className="ca-viz-label">Material para pared</div>
            <div className="ca-viz-materials">
              {materials.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={material?.id === m.id ? 'active' : ''}
                  onClick={() => setMaterialId(m.id)}
                >
                  <MaterialThumb material={m} />
                  <span>
                    <strong>{m.label}</strong>
                    {m.category ? <small>{m.category}</small> : null}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="ca-viz-label">Modo de pintado</div>
            <div className="ca-viz-viewmodes">
              {blendOptions.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={blendMode === mode.id ? 'active' : ''}
                  onClick={() => setBlendMode(mode.id)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <CompareSlider
          beforeSrc={WALL_PHOTO}
          afterSrc={afterUrl}
          beforeLabel="Antes"
          afterLabel="Después"
          loadingLabel="Preparando la escena..."
        />

        <div className="ca-viz-footer">
          <span>Escena: Pared</span>
          <span>Elegí un material y deslizá para comparar el antes y el después.</span>
          {error && <strong>{error}</strong>}
        </div>
      </div>
    );
  }

  window.VisualizadorIAWidget = VisualizadorIAWidget;
})();
