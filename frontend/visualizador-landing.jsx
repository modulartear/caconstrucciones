// Visualizador IA integrado para la landing sin Web Components.
(function () {
  const { useEffect, useMemo, useRef, useState } = React;

  const fallbackTemplates = [
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
      occluderShapes: [],
      defaults: { scale: 100, rotation: 0, offsetX: 0, offsetY: 0, opacity: 88, lighting: 35 }
    },
    {
      id: 'floor',
      label: 'Piso',
      target: 'floor',
      imageUrl: '/visualizador-assets/floor-original.png',
      maskUrl: '/visualizador-assets/floor-mask.png',
      surfaceMaskUrl: '/visualizador-assets/floor-mask.png',
      surfaceMaskMode: 'alpha-cutout',
      occluderMaskUrl: '/visualizador-assets/floor-occluders.png',
      occluderMaskMode: 'luma',
      shadowMaskUrl: '/visualizador-assets/floor-shadows.png',
      shadowMaskMode: 'luma',
      projectionMode: 'floor',
      occluderShapes: [
        {
          kind: 'polygon',
          points: [
            [368, 446], [1104, 446], [1273, 645], [150, 645]
          ],
          feather: 12
        },
        {
          kind: 'rect',
          x: 1090,
          y: 423,
          width: 360,
          height: 177,
          radius: 4,
          feather: 6
        },
        {
          kind: 'ellipse',
          cx: 385,
          cy: 482,
          rx: 43,
          ry: 47,
          rotation: 0,
          feather: 6
        },
        {
          kind: 'ellipse',
          cx: 1426,
          cy: 515,
          rx: 29,
          ry: 46,
          rotation: 0,
          feather: 6
        }
      ],
      shadowShapes: [
        {
          kind: 'polygon',
          points: [
            [273, 400], [771, 400], [820, 446], [222, 446]
          ],
          feather: 24,
          alpha: 0.62
        },
        {
          kind: 'polygon',
          points: [
            [1020, 425], [1488, 425], [1498, 517], [1070, 534]
          ],
          feather: 20,
          alpha: 0.55
        },
        {
          kind: 'ellipse',
          cx: 771,
          cy: 467,
          rx: 170,
          ry: 50,
          rotation: 0,
          feather: 26,
          alpha: 0.5
        }
      ],
      defaults: { scale: 120, rotation: 0, offsetX: 0, offsetY: 0, opacity: 92, lighting: 42 }
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
      defaults: { scale: 95, rotation: 0, offsetX: 0, offsetY: 0, opacity: 90, lighting: 30 }
    }
  ];

  const labels = { wall: 'Pared', floor: 'Piso', facade: 'Fachada' };
  const defaultMaskEdits = { surface: [], occluders: [] };

  function ProceduralSwatch({ material, size = 90, className = '' }) {
    const ref = useRef(null);

    useEffect(() => {
      if (!ref.current) return;
      const canvas = ref.current;
      const ctx = canvas.getContext('2d');
      const baseColor = material.color || material.swatch || '#b8b7b0';

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const seed = String(material.id || material.name || baseColor)
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);

      for (let i = 0; i < 50; i++) {
        const x = seeded(seed + i * 17) * canvas.width;
        const y = seeded(seed + i * 31) * canvas.height;
        const r = seeded(seed + i * 47) * 20 + 5;
        ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }, [material.id, material.color, material.swatch, material.name, size]);

    return <canvas ref={ref} width={size} height={size} className={className} />;
  }

  function seeded(value) {
    const x = Math.sin(value) * 10000;
    return x - Math.floor(x);
  }

  function VisualizadorIAWidget({ apiUrl = '', clientId = 'ca-landing' }) {
    const maskStorageKey = `ca-viz-mask-edits-${clientId}`;
    const debugMaskEditing = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('vizdebug') === '1';
    const [sessionId] = useState(() => getSessionId(clientId));
    const [templates, setTemplates] = useState(fallbackTemplates);
    const [selectedTemplateId, setSelectedTemplateId] = useState('wall');
    const [materials, setMaterials] = useState([]);
    const [materialId, setMaterialId] = useState('');
    const [resultUrl, setResultUrl] = useState(null);
    const [quickPreviewUrl, setQuickPreviewUrl] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [status, setStatus] = useState('idle');
    const [usage, setUsage] = useState({ count: 0, registered: false, limit: 2 });
    const [showLead, setShowLead] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [budgetSent, setBudgetSent] = useState(false);
    const [controls, setControls] = useState(() => getTemplateControls(fallbackTemplates[0]));
    const [selectedFinishId, setSelectedFinishId] = useState(fallbackTemplates[0]?.finishOptions?.[0]?.id || '');
    const [previewMode, setPreviewMode] = useState('material');
    const [maskEditor, setMaskEditor] = useState({ enabled: false, target: 'surface', tool: 'erase', brushSize: 28 });
    const [maskEdits, setMaskEdits] = useState({});
    const [maskEditVersion, setMaskEditVersion] = useState(0);
    const [draftStroke, setDraftStroke] = useState(null);

    const selectedTemplate = templates.find((item) => item.id === selectedTemplateId) || templates[0];
    const target = selectedTemplate.target;
    const targetMaterials = useMemo(() => materials.filter((item) => item.target === target), [materials, target]);
    const finishOptions = useMemo(() => getFinishOptions(selectedTemplate), [selectedTemplate]);
    const visibleMaterials = useMemo(
      () => filterMaterialsForFinish(targetMaterials, selectedTemplate, selectedFinishId),
      [targetMaterials, selectedTemplate, selectedFinishId]
    );
    const selectedMaterial = visibleMaterials.find((item) => item.id === materialId) || visibleMaterials[0] || targetMaterials[0];
    const displayedAfterSrc = quickPreviewUrl;
    const displayedAfterLabel = getAfterLabel(previewMode);
    const currentMaskEdits = debugMaskEditing
      ? (maskEdits[selectedTemplateId] || defaultMaskEdits)
      : defaultMaskEdits;

    useEffect(() => {
      try {
        if (!debugMaskEditing) {
          window.localStorage.removeItem(maskStorageKey);
        }
        const saved = debugMaskEditing ? window.localStorage.getItem(maskStorageKey) : null;
        if (debugMaskEditing && saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            setMaskEdits(parsed);
            setMaskEditVersion((value) => value + 1);
          }
        }
      } catch (err) {
        console.warn('No se pudieron recuperar las mascaras editadas:', err);
      }

      fetch(`${apiUrl}/api/templates`).then((r) => r.json()).then((data) => {
        if (Array.isArray(data.templates) && data.templates.length) setTemplates(data.templates);
      }).catch(() => setTemplates(fallbackTemplates));

      fetch(`${apiUrl}/api/materials`).then((r) => r.json()).then((data) => {
        setMaterials(Array.isArray(data.materials) ? data.materials : []);
      }).catch(() => setMaterials([]));

      refreshUsage();
    }, [apiUrl, debugMaskEditing, maskStorageKey, sessionId]);

    useEffect(() => {
      if (!debugMaskEditing) return;
      try {
        window.localStorage.setItem(maskStorageKey, JSON.stringify(maskEdits));
      } catch (err) {
        console.warn('No se pudieron guardar las mascaras editadas:', err);
      }
    }, [debugMaskEditing, maskEdits, maskStorageKey]);

    useEffect(() => {
      if (!selectedMaterial && visibleMaterials[0]) setMaterialId(visibleMaterials[0].id);
    }, [selectedMaterial, visibleMaterials]);

    useEffect(() => {
      if (!selectedTemplate) return;
      setControls((current) => {
        if (current?.templateId === selectedTemplate.id) return current;
        return getTemplateControls(selectedTemplate);
      });
    }, [selectedTemplate?.id]);

    useEffect(() => {
      const nextFinishId = finishOptions[0]?.id || '';
      setSelectedFinishId((current) => {
        if (finishOptions.some((finish) => finish.id === current)) return current;
        return nextFinishId;
      });
    }, [selectedTemplate?.id, finishOptions]);

    useEffect(() => {
      if (!selectedMaterial || !selectedTemplate) {
        setQuickPreviewUrl(null);
        setPreviewLoading(false);
        return;
      }

      let cancelled = false;
      setPreviewLoading(true);
      const previewBuilder = previewMode === 'material'
        ? buildInstantComposite(selectedTemplate, selectedMaterial, controls, currentMaskEdits, selectedFinishId)
        : buildGuidePreview(selectedTemplate, previewMode, currentMaskEdits);

      previewBuilder.then((url) => {
        if (cancelled) return;
        setQuickPreviewUrl(url);
        setPreviewLoading(false);
      });

      return () => {
        cancelled = true;
      };
    }, [
      selectedTemplate?.id,
      selectedTemplate?.surfaceMaskUrl,
      selectedTemplate?.maskUrl,
      selectedTemplate?.occluderMaskUrl,
      selectedTemplate?.shadowMaskUrl,
      selectedTemplate?.projectionMode,
      selectedMaterial?.id,
      selectedMaterial?.photo,
      selectedMaterial?.swatch,
      selectedMaterial?.color,
      selectedMaterial?.texture,
      selectedMaterial?.accent,
      selectedFinishId,
      previewMode,
      maskEditVersion,
      controls.scale,
      controls.rotation,
      controls.offsetX,
      controls.offsetY,
      controls.opacity,
      controls.lighting
    ]);

    function refreshUsage() {
      fetch(`${apiUrl}/api/usage/${sessionId}`)
        .then((r) => r.json())
        .then(setUsage)
        .catch(() => {});
    }

    function changeTemplate(templateId) {
      const next = templates.find((item) => item.id === templateId);
      if (!next) return;
      const nextMaterials = materials.filter((item) => item.target === next.target);
      const nextFinishId = next.finishOptions?.[0]?.id || '';
      setSelectedTemplateId(templateId);
      setMaterialId(nextMaterials[0]?.id || '');
      setSelectedFinishId(nextFinishId);
      setResultUrl(null);
      setQuickPreviewUrl(null);
      setControls(getTemplateControls(next));
      setPreviewMode('material');
      setDraftStroke(null);
      setBudgetSent(false);
      setError('');
      setNotice('');
    }

    function resetControls() {
      setControls(getTemplateControls(selectedTemplate));
    }

    function updateControlsWithClamp(patch) {
      setControls((prev) => ({
        ...prev,
        scale: clamp(patch.scale ?? prev.scale, 50, 220),
        rotation: clamp(patch.rotation ?? prev.rotation, -45, 45),
        offsetX: clamp(patch.offsetX ?? prev.offsetX, -180, 180),
        offsetY: clamp(patch.offsetY ?? prev.offsetY, -180, 180),
        opacity: clamp(patch.opacity ?? prev.opacity, 55, 100),
        lighting: clamp(patch.lighting ?? prev.lighting, 0, 100)
      }));
    }

    function beginMaskStroke(point) {
      if (!maskEditor.enabled) return;
      setDraftStroke({
        target: maskEditor.target,
        tool: maskEditor.tool,
        brush: maskEditor.brushSize / 1000,
        points: [point]
      });
    }

    function updateMaskStroke(point) {
      if (!maskEditor.enabled) return;
      setDraftStroke((current) => {
        if (!current) return current;
        return { ...current, points: [...current.points, point] };
      });
    }

    function commitMaskStroke() {
      setDraftStroke((current) => {
        if (!current?.points?.length) return null;
        setMaskEdits((prev) => {
          const templateEdits = prev[selectedTemplateId] || { surface: [], occluders: [] };
          const nextTemplateEdits = {
            ...templateEdits,
            [current.target]: [...(templateEdits[current.target] || []), current]
          };
          return { ...prev, [selectedTemplateId]: nextTemplateEdits };
        });
        setMaskEditVersion((value) => value + 1);
        return null;
      });
    }

    function clearMaskEdits(targetKey = maskEditor.target) {
      setDraftStroke(null);
      setMaskEdits((prev) => {
        const templateEdits = prev[selectedTemplateId] || { surface: [], occluders: [] };
        const nextTemplateEdits = { ...templateEdits, [targetKey]: [] };
        return { ...prev, [selectedTemplateId]: nextTemplateEdits };
      });
      setMaskEditVersion((value) => value + 1);
    }

    function clearAllMaskEdits() {
      setDraftStroke(null);
      setMaskEdits((prev) => ({
        ...prev,
        [selectedTemplateId]: { surface: [], occluders: [] }
      }));
      setMaskEditVersion((value) => value + 1);
    }

    async function exportEditedMask(maskType) {
      try {
        const maskData = await buildExportMaskData(selectedTemplate, maskType, currentMaskEdits);
        if (!maskData) {
          setError('No se pudo exportar la mascara seleccionada.');
          return;
        }
        downloadImageData(
          maskData,
          `${selectedTemplate.id}-${maskType}-${new Date().toISOString().slice(0, 10)}.png`
        );
        setError('');
        setNotice(`Mascara ${maskType === 'surface' ? 'de superficie' : 'de oclusores'} exportada.`);
      } catch (err) {
        console.warn('No se pudo exportar la mascara:', err);
        setError('No se pudo exportar la mascara seleccionada.');
        setNotice('');
      }
    }

    async function saveMaskToProject(maskType) {
      try {
        const maskData = await buildExportMaskData(selectedTemplate, maskType, currentMaskEdits);
        if (!maskData) {
          setError('No se pudo preparar la mascara para guardar.');
          setNotice('');
          return;
        }
        const imageDataUrl = imageDataToDataUrl(maskData);
        const response = await fetch(`${apiUrl}/api/save-mask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId: selectedTemplate.id,
            maskType,
            imageDataUrl
          })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No se pudo guardar la mascara en el proyecto.');
        setError('');
        setNotice(`Mascara ${maskType === 'surface' ? 'de superficie' : 'de oclusores'} guardada en el proyecto.`);
      } catch (err) {
        console.warn('No se pudo guardar la mascara en el proyecto:', err);
        setError(err.message || 'No se pudo guardar la mascara en el proyecto.');
        setNotice('');
      }
    }

    async function generate() {
      if (!selectedMaterial) {
        setError('Elegí un material para continuar.');
        return;
      }

      if (!usage.registered && usage.count >= usage.limit) {
        setShowLead(true);
        setError('Para generar más visualizaciones, dejá tus datos.');
        return;
      }

      setStatus('generating');
      setError('');
      try {
        const response = await fetch(`${apiUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId: selectedTemplate.id,
            target,
            materialId: selectedMaterial.id,
            clientId,
            sessionId
          })
        });
        const data = await response.json();
        if (!response.ok) {
          if (data.usage) setUsage(data.usage);
          if (data.requireRegistration) setShowLead(true);
          throw new Error(data.detail || data.error || 'No se pudo generar la visualización.');
        }
        setResultUrl(data.resultUrl);
        setBudgetSent(false);
        if (data.usage) setUsage(data.usage);
      } catch (err) {
        setError(err.message || 'No se pudo generar la visualización.');
      } finally {
        setStatus('idle');
      }
    }

    return (
      <div className="ca-viz">
        <div className="ca-viz-panel">
          <div>
            <div className="ca-viz-label">Escena</div>
            <div className="ca-viz-tabs">
              {templates.map((template) => (
                <button key={template.id} className={selectedTemplateId === template.id ? 'active' : ''} onClick={() => changeTemplate(template.id)}>
                  {template.label}
                </button>
              ))}
            </div>
          </div>

          {finishOptions.length > 0 && (
            <div>
              <div className="ca-viz-label">Acabado</div>
              <div className="ca-viz-finishes">
                {finishOptions.map((finish) => (
                  <button
                    key={finish.id}
                    type="button"
                    className={selectedFinishId === finish.id ? 'active' : ''}
                    onClick={() => setSelectedFinishId(finish.id)}
                  >
                    <FinishThumb finish={finish} color={selectedMaterial?.swatch || '#d8cfbf'} accent={selectedMaterial?.accent || '#b59d86'} />
                    <span>{finish.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="ca-viz-label">{finishOptions.length ? 'Color / material' : `Material para ${labels[target].toLowerCase()}`}</div>
            <div className="ca-viz-materials">
              {visibleMaterials.map((material) => (
                <button key={material.id} className={selectedMaterial?.id === material.id ? 'active' : ''} onClick={() => { setMaterialId(material.id); setResultUrl(null); setBudgetSent(false); }}>
                  <MaterialThumb material={material} />
                  <span>
                    <strong>{material.label}</strong>
                    {material.category ? <small>{material.category}</small> : null}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {showLead && <LeadForm apiUrl={apiUrl} clientId={clientId} sessionId={sessionId} setUsage={setUsage} setShowLead={setShowLead} setError={setError} />}

        <CompareSlider
          beforeSrc={selectedTemplate.imageUrl}
          afterSrc={displayedAfterSrc}
          beforeLabel="Antes"
          afterLabel={displayedAfterLabel}
          loadingLabel={previewLoading ? 'Generando vista previa...' : 'Elegí un material'}
        />

        <div className="ca-viz-footer">
          <span>Escena: {selectedTemplate.label}</span>
          <span>Elegí un material y deslizá para comparar el antes y el después.</span>
          {error && <strong>{error}</strong>}
        </div>
      </div>
    );
  }

  function TextureCanvas({ textureKey, color, accent, size = 62, className = '' }) {
    const ref = useRef(null);

    useEffect(() => {
      if (!ref.current) return;
      const canvas = ref.current;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      drawTexturePreview(ctx, size, size, textureKey, color, accent);
    }, [textureKey, color, accent, size]);

    return <canvas ref={ref} width={size} height={size} className={className} />;
  }

  function FinishThumb({ finish, color, accent }) {
    return (
      <TextureCanvas
        textureKey={finish.textureKey}
        color={color}
        accent={accent}
        size={72}
        className="ca-viz-finish-thumb"
      />
    );
  }

  function MaterialThumb({ material }) {
    if (material.photo) {
      return <img className="ca-viz-material-photo" src={material.photo} alt="" loading="lazy" />;
    }
    return (
      <TextureCanvas
        textureKey={material.texture || (material.renderMode === 'paint' ? 'paint' : 'cement')}
        color={material.swatch || material.color || '#ccc'}
        accent={material.accent || deriveAccent(material.swatch || material.color || '#ccc')}
        size={62}
        className="ca-viz-swatch"
      />
    );
  }

  function RangeControl({ label, value, min, max, step, suffix = '', onChange }) {
    return (
      <label className="ca-viz-control">
        <span>{label}</span>
        <strong>{value}{suffix}</strong>
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      </label>
    );
  }

  async function buildInstantComposite(template, material, controls, maskEditsForTemplate = null, selectedFinishId = '') {
    const surfaceMaskUrl = template?.surfaceMaskUrl || template?.maskUrl;
    if (!template?.imageUrl || !surfaceMaskUrl) return null;

    try {
      const [baseImg, surfaceMaskImg, occluderMaskImg, shadowMaskImg] = await Promise.all([
        loadImage(template.imageUrl),
        loadImage(surfaceMaskUrl),
        loadOptionalImage(template.occluderMaskUrl),
        loadOptionalImage(template.shadowMaskUrl)
      ]);
      const width = baseImg.naturalWidth || baseImg.width;
      const height = baseImg.naturalHeight || baseImg.height;
      if (!width || !height) return null;

      const baseCanvas = document.createElement('canvas');
      baseCanvas.width = width;
      baseCanvas.height = height;
      const baseCtx = baseCanvas.getContext('2d');
      baseCtx.drawImage(baseImg, 0, 0, width, height);
      const baseData = baseCtx.getImageData(0, 0, width, height);

      let surfaceMaskData = getMaskImageData(surfaceMaskImg, width, height);
      let occluderMaskData = combineMaskData(width, height, [
        occluderMaskImg ? getMaskImageData(occluderMaskImg, width, height) : null,
        template.occluderShapes?.length ? buildShapesMaskData(template.occluderShapes, width, height) : null
      ]);
      const shadowMaskData = combineMaskData(width, height, [
        shadowMaskImg ? getMaskImageData(shadowMaskImg, width, height) : null,
        template.shadowShapes?.length ? buildShapesMaskData(template.shadowShapes, width, height, true) : null
      ]);
      surfaceMaskData = applyMaskEditsToImageData(surfaceMaskData, maskEditsForTemplate?.surface, template.surfaceMaskMode || 'alpha-cutout');
      occluderMaskData = applyMaskEditsToImageData(occluderMaskData, maskEditsForTemplate?.occluders, template.occluderMaskMode || 'luma');

      const finish = resolveFinish(template, selectedFinishId);
      const tileCanvas = await buildMaterialTile(material, controls, template, finish);
      const projectedCanvas = document.createElement('canvas');
      projectedCanvas.width = width;
      projectedCanvas.height = height;
      if (template.sceneMode === 'layered') {
        paintLayeredMaterial(projectedCanvas.getContext('2d'), tileCanvas, width, height, controls, finish);
      } else {
        paintProjectedMaterial(projectedCanvas.getContext('2d'), tileCanvas, width, height, controls, template.projectionMode);
      }

      const projectedCtx = projectedCanvas.getContext('2d');
      const projectedData = projectedCtx.getImageData(0, 0, width, height);
      const layerPixels = projectedData.data;
      const basePixels = baseData.data;
      const surfacePixels = surfaceMaskData.data;
      const occluderPixels = occluderMaskData?.data;
      const shadowPixels = shadowMaskData?.data;
      const globalOpacity = controls.opacity / 100;
      const lightingStrength = controls.lighting / 100;
      const effectiveOpacity = template.sceneMode === 'layered'
        ? Math.max(globalOpacity, 0.96)
        : globalOpacity;

      for (let i = 0; i < layerPixels.length; i += 4) {
        const surfaceAlpha = readMaskCoverage(surfacePixels, i, template.surfaceMaskMode || 'alpha-cutout');
        if (!surfaceAlpha) {
          layerPixels[i + 3] = 0;
          continue;
        }

        const occluderAlpha = occluderPixels ? readMaskCoverage(occluderPixels, i, template.occluderMaskMode || 'luma') : 0;
        const availableAlpha = clamp((surfaceAlpha / 255) * (1 - occluderAlpha / 255), 0, 1);
        if (availableAlpha <= 0) {
          layerPixels[i + 3] = 0;
          continue;
        }

        const lightLuma = getLuma(basePixels[i], basePixels[i + 1], basePixels[i + 2]) / 255;
        const shadowAlpha = shadowPixels ? readMaskCoverage(shadowPixels, i, template.shadowMaskMode || 'luma') / 255 : 1;
        const detailFactor = 1 + ((lightLuma - 0.5) * 1.35 * lightingStrength * shadowAlpha);
        const floorShadowBoost = template.projectionMode === 'floor' ? (1 - shadowAlpha) * 0.18 * lightingStrength : 0;

        layerPixels[i] = clamp(layerPixels[i] * detailFactor * (1 - floorShadowBoost), 0, 255);
        layerPixels[i + 1] = clamp(layerPixels[i + 1] * detailFactor * (1 - floorShadowBoost), 0, 255);
        layerPixels[i + 2] = clamp(layerPixels[i + 2] * detailFactor * (1 - floorShadowBoost), 0, 255);
        layerPixels[i + 3] = Math.round(255 * availableAlpha * effectiveOpacity);
      }

      projectedCtx.putImageData(projectedData, 0, 0);

      const outCanvas = document.createElement('canvas');
      outCanvas.width = width;
      outCanvas.height = height;
      const outCtx = outCanvas.getContext('2d');
      const layeredParts = buildSceneLayerCanvases(baseData, surfaceMaskData, occluderMaskData, template);
      const surfaceDetailCanvas = template.sceneMode === 'layered'
        ? buildSurfaceDetailCanvas(baseData, surfaceMaskData, template, finish)
        : null;

      if (template.sceneMode === 'layered') {
        if (layeredParts.backgroundCanvas) outCtx.drawImage(layeredParts.backgroundCanvas, 0, 0);
        outCtx.drawImage(projectedCanvas, 0, 0);
        drawSurfaceDetailOverlay(outCtx, surfaceDetailCanvas, finish);
        if (layeredParts.foregroundCanvas) outCtx.drawImage(layeredParts.foregroundCanvas, 0, 0);
      } else {
        outCtx.drawImage(baseImg, 0, 0, width, height);
        outCtx.drawImage(projectedCanvas, 0, 0);
        if (layeredParts.foregroundCanvas) outCtx.drawImage(layeredParts.foregroundCanvas, 0, 0);
      }

      return outCanvas.toDataURL('image/png');
    } catch (err) {
      console.warn('No se pudo generar la vista previa instantánea:', err);
      return null;
    }
  }

  function CompareSlider({
    beforeSrc,
    afterSrc,
    beforeLabel = 'Antes',
    afterLabel = 'Después',
    loadingLabel = '',
    interactive = false,
    controls = null,
    onControlsChange = null,
    onResetControls = null,
    maskEditor = null,
    draftStroke = null,
    onMaskStrokeStart = null,
    onMaskStrokeMove = null,
    onMaskStrokeEnd = null
  }) {
    const [percent, setPercent] = useState(50);
    const frameRef = useRef(null);
    const dragStateRef = useRef(null);
    const paintStateRef = useRef(null);

    function normalizePoint(event) {
      const rect = frameRef.current?.getBoundingClientRect();
      if (!rect) return null;
      return {
        x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
        y: clamp((event.clientY - rect.top) / rect.height, 0, 1)
      };
    }

    function handlePointerDown(event) {
      if (event.button !== 0) return;
      if (maskEditor?.enabled && (onMaskStrokeStart || onMaskStrokeMove)) {
        const point = normalizePoint(event);
        if (!point) return;
        paintStateRef.current = true;
        onMaskStrokeStart?.(point);
        frameRef.current?.setPointerCapture?.(event.pointerId);
        return;
      }
      if (!interactive || !onControlsChange || !controls) return;
      dragStateRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        offsetX: controls.offsetX,
        offsetY: controls.offsetY
      };
      frameRef.current?.setPointerCapture?.(event.pointerId);
    }

    function handlePointerMove(event) {
      if (paintStateRef.current && maskEditor?.enabled) {
        const point = normalizePoint(event);
        if (point) onMaskStrokeMove?.(point);
        return;
      }
      if (!interactive || !onControlsChange || !dragStateRef.current) return;
      const drag = dragStateRef.current;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      onControlsChange({
        offsetX: drag.offsetX + dx,
        offsetY: drag.offsetY + dy
      });
    }

    function handlePointerEnd(event) {
      if (paintStateRef.current) {
        paintStateRef.current = null;
        onMaskStrokeEnd?.();
      }
      dragStateRef.current = null;
      frameRef.current?.releasePointerCapture?.(event.pointerId);
    }

    function handleWheel(event) {
      if (!interactive || !onControlsChange || !controls) return;
      event.preventDefault();
      const delta = event.deltaY < 0 ? 6 : -6;
      onControlsChange({ scale: controls.scale + delta });
    }

    function handleKeyDown(event) {
      if (maskEditor?.enabled) {
        if (event.key.toLowerCase() === 'e') {
          event.preventDefault();
          return;
        }
      }
      if (!interactive || !onControlsChange || !controls) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onControlsChange({ offsetX: controls.offsetX - 8 });
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        onControlsChange({ offsetX: controls.offsetX + 8 });
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        onControlsChange({ offsetY: controls.offsetY - 8 });
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        onControlsChange({ offsetY: controls.offsetY + 8 });
      } else if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        onControlsChange({ scale: controls.scale + 6 });
      } else if (event.key === '-') {
        event.preventDefault();
        onControlsChange({ scale: controls.scale - 6 });
      } else if (event.key === '[') {
        event.preventDefault();
        onControlsChange({ rotation: controls.rotation - 2 });
      } else if (event.key === ']') {
        event.preventDefault();
        onControlsChange({ rotation: controls.rotation + 2 });
      } else if (event.key === '0' && onResetControls) {
        event.preventDefault();
        onResetControls();
      }
    }

    return (
      <div className="ca-compare">
        <div
          ref={frameRef}
          className={`ca-compare-frame ${interactive ? 'is-interactive' : ''} ${maskEditor?.enabled ? 'is-editing-mask' : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onPointerLeave={handlePointerEnd}
          onWheel={handleWheel}
          onKeyDown={handleKeyDown}
          tabIndex={interactive || maskEditor?.enabled ? 0 : -1}
        >
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
          {interactive && controls && (
            <div className="ca-compare-hud">
              <strong>Edicion directa</strong>
              <span>Arrastrar: mover textura</span>
              <span>Rueda: zoom</span>
              <span>Flechas: desplazar</span>
              <span>`[` `]`: rotar</span>
              <span>`0`: resetear</span>
              <div className="ca-compare-stats">
                <b>Esc {Math.round(controls.scale)}%</b>
                <b>Rot {Math.round(controls.rotation)}°</b>
                <b>X {Math.round(controls.offsetX)}</b>
                <b>Y {Math.round(controls.offsetY)}</b>
              </div>
            </div>
          )}
          {maskEditor?.enabled && (
            <div className="ca-compare-hud ca-compare-hud-editor">
              <strong>Editor de mascara</strong>
              <span>{maskEditor.target === 'surface' ? 'Editando superficie' : 'Editando oclusores'}</span>
              <span>{maskEditor.tool === 'add' ? 'Modo pintar' : 'Modo borrar'}</span>
              <span>Pincel {maskEditor.brushSize}px</span>
            </div>
          )}
          {maskEditor?.enabled && draftStroke?.points?.length > 0 && (
            <svg className="ca-compare-overlay" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
              <polyline
                fill="none"
                stroke={maskEditor.target === 'surface' ? '#4cc9ff' : '#ff7b7b'}
                strokeOpacity="0.95"
                strokeWidth={Math.max(8, maskEditor.brushSize)}
                strokeLinecap="round"
                strokeLinejoin="round"
                points={draftStroke.points.map((point) => `${point.x * 1000},${point.y * 1000}`).join(' ')}
              />
            </svg>
          )}
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

  function LeadForm({ apiUrl, clientId, sessionId, setUsage, setShowLead, setError }) {
    const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', locality: '' });
    const [saving, setSaving] = useState(false);

    async function submit(e) {
      e.preventDefault();
      setSaving(true);
      setError('');
      try {
        const response = await fetch(`${apiUrl}/api/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, clientId, sessionId })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No se pudo guardar el contacto.');
        setUsage(data.usage);
        setShowLead(false);
      } catch (err) {
        setError(err.message || 'No se pudo guardar el contacto.');
      } finally {
        setSaving(false);
      }
    }

    return (
      <form className="ca-viz-lead" onSubmit={submit}>
        <strong>Dejá tus datos para generar más visualizaciones</strong>
        <input required placeholder="Nombre" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        <input required placeholder="Apellido" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        <input required placeholder="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input required placeholder="Localidad" value={form.locality} onChange={(e) => setForm({ ...form, locality: e.target.value })} />
        <button className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Registrarme'}</button>
      </form>
    );
  }

  function BudgetForm({
    apiUrl, clientId, sessionId, selectedTemplate, selectedMaterial, target, resultUrl,
    setUsage, setError, budgetSent, setBudgetSent
  }) {
    const [form, setForm] = useState({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      locality: '',
      surface: '',
      notes: ''
    });
    const [saving, setSaving] = useState(false);

    async function submit(e) {
      e.preventDefault();
      setSaving(true);
      setError('');
      try {
        const resultImage = await compressImageForBudget(resultUrl);
        const response = await fetch(`${apiUrl}/api/visualizador-budget`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            clientId,
            sessionId,
            templateId: selectedTemplate.id,
            sceneLabel: selectedTemplate.label,
            target,
            materialId: selectedMaterial.id,
            materialLabel: selectedMaterial.label,
            materialPhoto: selectedMaterial.photo || '',
            originalImage: selectedTemplate.imageUrl,
            resultImage
          })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No se pudo enviar el presupuesto.');
        if (data.usage) setUsage(data.usage);
        setBudgetSent(true);
      } catch (err) {
        setError(err.message || 'No se pudo enviar el presupuesto.');
      } finally {
        setSaving(false);
      }
    }

    return (
      <form className="ca-viz-budget" onSubmit={submit}>
        <div className="ca-viz-budget-head">
          <strong>{budgetSent ? 'Propuesta enviada' : 'Enviar este diseño para presupuesto'}</strong>
          <span>{budgetSent ? 'La solicitud quedó guardada en el panel de presupuestos.' : 'Adjuntamos la imagen generada y tus datos para contactarte.'}</span>
        </div>
        {!budgetSent && (
          <>
            <input required placeholder="Nombre" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <input required placeholder="Apellido" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            <input required placeholder="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input required placeholder="Localidad" value={form.locality} onChange={(e) => setForm({ ...form, locality: e.target.value })} />
            <input type="number" min="0" placeholder="Superficie estimada (m²)" value={form.surface} onChange={(e) => setForm({ ...form, surface: e.target.value })} />
            <textarea placeholder="Comentarios para el presupuesto" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}></textarea>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Enviando...' : 'Enviar propuesta'}</button>
          </>
        )}
      </form>
    );
  }

  async function compressImageForBudget(src) {
    const img = await loadImage(src);
    const maxWidth = 900;
    const ratio = Math.min(1, maxWidth / img.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * ratio));
    canvas.height = Math.max(1, Math.round(img.height * ratio));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.72);
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.crossOrigin = 'anonymous';
      img.src = src;
    });
  }

  function loadOptionalImage(src) {
    if (!src) return Promise.resolve(null);
    return loadImage(src).catch(() => null);
  }

  function getTemplateControls(template) {
    const defaults = template?.defaults || {};
    return {
      templateId: template?.id || '',
      scale: defaults.scale ?? 100,
      rotation: defaults.rotation ?? 0,
      offsetX: defaults.offsetX ?? 0,
      offsetY: defaults.offsetY ?? 0,
      opacity: defaults.opacity ?? 90,
      lighting: defaults.lighting ?? 35
    };
  }

  function getMaskImageData(image, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, width, height);
    return ctx.getImageData(0, 0, width, height);
  }

  function buildShapesMaskData(shapes, width, height, useAlphaAsCoverage = false) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    shapes.forEach((shape) => {
      const feather = Number(shape.feather || 0);
      ctx.save();

      if (feather > 0) {
        ctx.filter = `blur(${feather}px)`;
      }

      const alpha = clamp(shape.alpha ?? 1, 0, 1);
      ctx.fillStyle = useAlphaAsCoverage ? `rgba(255,255,255,${alpha})` : '#ffffff';
      if (shape.kind === 'rect') {
        fillRoundedRect(ctx, shape.x, shape.y, shape.width, shape.height, shape.radius || 0);
      } else if (shape.kind === 'polygon' && Array.isArray(shape.points) && shape.points.length >= 3) {
        ctx.beginPath();
        ctx.moveTo(shape.points[0][0], shape.points[0][1]);
        for (let i = 1; i < shape.points.length; i += 1) {
          ctx.lineTo(shape.points[i][0], shape.points[i][1]);
        }
        ctx.closePath();
        ctx.fill();
      } else if (shape.kind === 'ellipse') {
        ctx.beginPath();
        ctx.ellipse(shape.cx, shape.cy, shape.rx, shape.ry, ((shape.rotation || 0) * Math.PI) / 180, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    return ctx.getImageData(0, 0, width, height);
  }

  function combineMaskData(width, height, masks) {
    const validMasks = masks.filter(Boolean);
    if (!validMasks.length) return null;
    if (validMasks.length === 1) return validMasks[0];

    const merged = new ImageData(width, height);
    for (let i = 0; i < merged.data.length; i += 4) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (const mask of validMasks) {
        r = Math.max(r, mask.data[i]);
        g = Math.max(g, mask.data[i + 1]);
        b = Math.max(b, mask.data[i + 2]);
        a = Math.max(a, mask.data[i + 3]);
      }
      merged.data[i] = r;
      merged.data[i + 1] = g;
      merged.data[i + 2] = b;
      merged.data[i + 3] = a;
    }
    return merged;
  }

  async function buildExportMaskData(template, maskType, maskEditsForTemplate = null) {
    const surfaceMaskUrl = template?.surfaceMaskUrl || template?.maskUrl;
    if (!template?.imageUrl || !surfaceMaskUrl) return null;

    const [baseImg, surfaceMaskImg, occluderMaskImg] = await Promise.all([
      loadImage(template.imageUrl),
      loadImage(surfaceMaskUrl),
      loadOptionalImage(template.occluderMaskUrl)
    ]);

    const width = baseImg.naturalWidth || baseImg.width;
    const height = baseImg.naturalHeight || baseImg.height;
    if (!width || !height) return null;

    if (maskType === 'surface') {
      const surfaceMaskData = applyMaskEditsToImageData(
        getMaskImageData(surfaceMaskImg, width, height),
        maskEditsForTemplate?.surface,
        template.surfaceMaskMode || 'alpha-cutout'
      );
      return normalizeMaskForExport(surfaceMaskData, template.surfaceMaskMode || 'alpha-cutout');
    }

    const occluderMaskData = applyMaskEditsToImageData(
      combineMaskData(width, height, [
        occluderMaskImg ? getMaskImageData(occluderMaskImg, width, height) : null,
        template.occluderShapes?.length ? buildShapesMaskData(template.occluderShapes, width, height) : null
      ]),
      maskEditsForTemplate?.occluders,
      template.occluderMaskMode || 'luma'
    );
    return normalizeMaskForExport(occluderMaskData, template.occluderMaskMode || 'luma');
  }

  function applyMaskEditsToImageData(maskData, strokes, maskMode = 'luma') {
    if (!strokes?.length && maskData) return maskData;
    if (!strokes?.length) return maskData;

    const width = maskData?.width || 1024;
    const height = maskData?.height || 1024;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (maskData) {
      ctx.putImageData(cloneImageData(maskData), 0, 0);
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    strokes.forEach((stroke) => {
      if (!stroke?.points?.length) return;
      const lineWidth = Math.max(4, (stroke.brush || 0.02) * Math.min(width, height));
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = lineWidth;

      if (maskMode === 'alpha-cutout') {
        if (stroke.tool === 'add') {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.strokeStyle = 'rgba(0,0,0,1)';
          ctx.fillStyle = 'rgba(0,0,0,1)';
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = 'rgba(0,0,0,1)';
          ctx.fillStyle = 'rgba(0,0,0,1)';
        }
      } else {
        if (stroke.tool === 'add') {
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = 'rgba(255,255,255,1)';
          ctx.fillStyle = 'rgba(255,255,255,1)';
        } else {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.strokeStyle = 'rgba(0,0,0,1)';
          ctx.fillStyle = 'rgba(0,0,0,1)';
        }
      }

      if (stroke.points.length === 1) {
        const point = stroke.points[0];
        ctx.beginPath();
        ctx.arc(point.x * width, point.y * height, lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x * width, stroke.points[0].y * height);
        for (let i = 1; i < stroke.points.length; i += 1) {
          ctx.lineTo(stroke.points[i].x * width, stroke.points[i].y * height);
        }
        ctx.stroke();
      }
      ctx.restore();
    });

    return ctx.getImageData(0, 0, width, height);
  }

  function cloneImageData(imageData) {
    return new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
  }

  function normalizeMaskForExport(maskData, maskMode = 'luma') {
    if (!maskData) return null;
    const out = new ImageData(maskData.width, maskData.height);
    for (let i = 0; i < out.data.length; i += 4) {
      const coverage = readMaskCoverage(maskData.data, i, maskMode);
      out.data[i] = coverage;
      out.data[i + 1] = coverage;
      out.data[i + 2] = coverage;
      out.data[i + 3] = 255;
    }
    return out;
  }

  function downloadImageData(imageData, fileName) {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext('2d').putImageData(imageData, 0, 0);
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function imageDataToDataUrl(imageData) {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext('2d').putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  }

  async function buildGuidePreview(template, mode, maskEditsForTemplate = null) {
    const surfaceMaskUrl = template?.surfaceMaskUrl || template?.maskUrl;
    if (!template?.imageUrl || !surfaceMaskUrl) return null;

    try {
      const [baseImg, surfaceMaskImg, occluderMaskImg, shadowMaskImg] = await Promise.all([
        loadImage(template.imageUrl),
        loadImage(surfaceMaskUrl),
        loadOptionalImage(template.occluderMaskUrl),
        loadOptionalImage(template.shadowMaskUrl)
      ]);
      const width = baseImg.naturalWidth || baseImg.width;
      const height = baseImg.naturalHeight || baseImg.height;
      if (!width || !height) return null;

      let surfaceMaskData = getMaskImageData(surfaceMaskImg, width, height);
      let occluderMaskData = combineMaskData(width, height, [
        occluderMaskImg ? getMaskImageData(occluderMaskImg, width, height) : null,
        template.occluderShapes?.length ? buildShapesMaskData(template.occluderShapes, width, height) : null
      ]);
      const shadowMaskData = combineMaskData(width, height, [
        shadowMaskImg ? getMaskImageData(shadowMaskImg, width, height) : null,
        template.shadowShapes?.length ? buildShapesMaskData(template.shadowShapes, width, height, true) : null
      ]);
      surfaceMaskData = applyMaskEditsToImageData(surfaceMaskData, maskEditsForTemplate?.surface, template.surfaceMaskMode || 'alpha-cutout');
      occluderMaskData = applyMaskEditsToImageData(occluderMaskData, maskEditsForTemplate?.occluders, template.occluderMaskMode || 'luma');

      const selectedMaskData = mode === 'surface'
        ? surfaceMaskData
        : (mode === 'occluders' ? occluderMaskData : shadowMaskData);

      if (!selectedMaskData) return template.imageUrl;

      const overlayStyles = {
        surface: { color: [50, 184, 255], opacity: 0.42, maskMode: template.surfaceMaskMode || 'alpha-cutout' },
        occluders: { color: [255, 90, 90], opacity: 0.58, maskMode: template.occluderMaskMode || 'luma' },
        shadows: { color: [140, 102, 255], opacity: 0.52, maskMode: template.shadowMaskMode || 'luma' }
      };
      const overlayStyle = overlayStyles[mode] || overlayStyles.surface;

      const outCanvas = document.createElement('canvas');
      outCanvas.width = width;
      outCanvas.height = height;
      const outCtx = outCanvas.getContext('2d');
      outCtx.drawImage(baseImg, 0, 0, width, height);

      const overlay = outCtx.createImageData(width, height);
      const pixels = selectedMaskData.data;
      for (let i = 0; i < overlay.data.length; i += 4) {
        const coverage = readMaskCoverage(pixels, i, overlayStyle.maskMode) / 255;
        overlay.data[i] = overlayStyle.color[0];
        overlay.data[i + 1] = overlayStyle.color[1];
        overlay.data[i + 2] = overlayStyle.color[2];
        overlay.data[i + 3] = Math.round(255 * coverage * overlayStyle.opacity);
      }

      const overlayCanvas = document.createElement('canvas');
      overlayCanvas.width = width;
      overlayCanvas.height = height;
      overlayCanvas.getContext('2d').putImageData(overlay, 0, 0);
      outCtx.drawImage(overlayCanvas, 0, 0);

      return outCanvas.toDataURL('image/png');
    } catch (err) {
      console.warn('No se pudo generar la vista guía:', err);
      return template.imageUrl;
    }
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

  async function buildMaterialTile(material, controls, template, finish = null) {
    const tileSize = Math.max(160, Math.round(280 * (controls.scale / 100)));
    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = tileSize;
    tileCanvas.height = tileSize;
    const ctx = tileCanvas.getContext('2d');

    if (material?.photo) {
      const matImg = await loadImage(material.photo);
      ctx.drawImage(matImg, 0, 0, tileSize, tileSize);
    } else {
      drawProceduralTile(ctx, tileSize, material, template, finish);
    }

    return tileCanvas;
  }

  function drawProceduralTile(ctx, tileSize, material, template, finish = null) {
    const baseColor = material?.swatch || material?.color || '#b8b7b0';
    const accent = material?.accent || deriveAccent(baseColor);
    const textureKey = finish?.textureKey || material?.texture || (material?.renderMode === 'paint' ? 'paint' : 'cement');
    drawTexturePreview(ctx, tileSize, tileSize, textureKey, baseColor, accent, template?.projectionMode);
  }

  function paintProjectedMaterial(ctx, tileCanvas, width, height, controls, projectionMode = 'wall') {
    ctx.clearRect(0, 0, width, height);

    if (projectionMode === 'floor') {
      drawFloorProjection(ctx, tileCanvas, width, height, controls);
      return;
    }

    drawFlatProjection(ctx, tileCanvas, width, height, controls, projectionMode === 'facade' ? 0.04 : 0);
  }

  function paintLayeredMaterial(ctx, tileCanvas, width, height, controls, finish = null) {
    ctx.clearRect(0, 0, width, height);
    const finishScale = finish?.id === 'fine' ? 1.08 : finish?.id === 'medium' ? 1 : finish?.id === 'coarse' ? 0.9 : finish?.id === 'historical' ? 0.94 : 1.05;
    const scaledCanvas = scaleTileCanvas(tileCanvas, finishScale);
    const layeredControls = {
      ...controls,
      rotation: finish?.id === 'historical' ? -2 : 0,
      offsetX: Math.round((controls.offsetX || 0) * 0.28),
      offsetY: Math.round((controls.offsetY || 0) * 0.24)
    };
    drawFlatProjection(ctx, scaledCanvas, width, height, layeredControls, finish?.id === 'historical' ? 0.02 : 0);
  }

  function drawTexturePreview(ctx, width, height, textureKey, color, accent, projectionMode = 'wall') {
    const baseColor = color || '#d9d1c4';
    const detailColor = accent || deriveAccent(baseColor);
    const seed = String(`${textureKey}-${baseColor}-${detailColor}-${projectionMode}`).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, width, height);

    if (textureKey === 'wood') {
      for (let y = 0; y < height; y += 10) {
        ctx.strokeStyle = y % 20 === 0 ? alpha(detailColor, 0.42) : 'rgba(255,255,255,.14)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y + seeded(seed + y) * 4);
        for (let x = 0; x <= width; x += 18) ctx.lineTo(x, y + Math.sin((x + seed) * 0.035) * 5);
        ctx.stroke();
      }
      return;
    }

    if (textureKey === 'brick') {
      ctx.strokeStyle = alpha(detailColor, 0.38);
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
        ctx.strokeStyle = i % 3 === 0 ? alpha(detailColor, 0.35) : 'rgba(255,255,255,.22)';
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

    if (textureKey === 'stone' || textureKey === 'cement' || textureKey === 'classic') {
      for (let i = 0; i < 46; i++) {
        ctx.fillStyle = i % 2 ? alpha(detailColor, 0.14) : 'rgba(255,255,255,.09)';
        ctx.beginPath();
        ctx.arc(seeded(seed + i * 13) * width, seeded(seed + i * 29) * height, seeded(seed + i * 43) * 10 + 2, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    if (textureKey === 'fine' || textureKey === 'medium' || textureKey === 'coarse' || textureKey === 'historical') {
      const density = textureKey === 'fine' ? 150 : textureKey === 'medium' ? 110 : textureKey === 'coarse' ? 84 : 92;
      const radius = textureKey === 'fine' ? 1.7 : textureKey === 'medium' ? 2.6 : textureKey === 'coarse' ? 4.1 : 3.3;
      const shadowAlpha = textureKey === 'historical' ? 0.12 : 0.08;
      for (let i = 0; i < density; i++) {
        const x = seeded(seed + i * 17) * width;
        const y = seeded(seed + i * 31) * height;
        const r = radius + seeded(seed + i * 47) * radius;
        ctx.fillStyle = i % 2 ? alpha(detailColor, 0.18) : `rgba(255,255,255,${textureKey === 'fine' ? 0.07 : 0.05})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (textureKey === 'historical') {
        ctx.fillStyle = alpha(detailColor, shadowAlpha);
        for (let i = 0; i < 7; i++) {
          const w = width * (0.18 + seeded(seed + i * 11) * 0.24);
          const h = height * (0.12 + seeded(seed + i * 21) * 0.2);
          const x = seeded(seed + i * 9) * (width - w);
          const y = seeded(seed + i * 15) * (height - h);
          ctx.fillRect(x, y, w, h);
        }
      }
      return;
    }

    if (textureKey === 'paint') {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, baseColor);
      grad.addColorStop(1, mixHex(baseColor, detailColor, 0.16));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      return;
    }

    for (let i = 0; i < 42; i++) {
      const x = seeded(seed + i * 17) * width;
      const y = seeded(seed + i * 31) * height;
      const r = seeded(seed + i * 47) * (projectionMode === 'floor' ? 24 : 18) + 6;
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.11)' : 'rgba(0,0,0,0.08)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawFlatProjection(ctx, tileCanvas, width, height, controls, verticalBreath = 0) {
    const radians = (controls.rotation * Math.PI) / 180;
    const stepX = tileCanvas.width;
    const stepY = tileCanvas.height;
    const span = Math.max(width, height) * 2;

    ctx.save();
    ctx.translate(width / 2 + controls.offsetX, height / 2 + controls.offsetY);
    ctx.rotate(radians);

    for (let x = -span; x < span; x += stepX) {
      for (let y = -span; y < span; y += stepY) {
        const wave = verticalBreath ? Math.sin((y / stepY) * Math.PI * 0.5) * verticalBreath * stepY : 0;
        ctx.drawImage(tileCanvas, x + wave, y, stepX, stepY);
      }
    }

    ctx.restore();
  }

  function drawFloorProjection(ctx, tileCanvas, width, height, controls) {
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = width * 2;
    patternCanvas.height = height * 2;
    const patternCtx = patternCanvas.getContext('2d');
    drawFlatProjection(patternCtx, tileCanvas, patternCanvas.width, patternCanvas.height, controls);

    const sourceCenterX = patternCanvas.width / 2;
    const maxSourceWidth = patternCanvas.width * 0.88;
    const horizon = height * 0.1;
    const visibleHeight = height - horizon;

    for (let y = 0; y < visibleHeight; y += 3) {
      const t = y / visibleHeight;
      const perspective = Math.pow(t, 1.55);
      const sourceWidth = Math.max(tileCanvas.width * 0.55, maxSourceWidth * (0.14 + perspective * 0.86));
      const srcX = clamp(sourceCenterX - sourceWidth / 2 + controls.offsetX * 0.5, 0, patternCanvas.width - sourceWidth);
      const srcY = clamp(y * (0.55 + perspective * 0.45) + controls.offsetY, 0, patternCanvas.height - 3);
      const destY = horizon + y;
      ctx.drawImage(patternCanvas, srcX, srcY, sourceWidth, 3, 0, destY, width, 3);
    }
  }

  function buildSceneLayerCanvases(baseData, surfaceMaskData, occluderMaskData, template) {
    const width = baseData.width;
    const height = baseData.height;
    const surfacePixels = surfaceMaskData?.data;
    const occluderPixels = occluderMaskData?.data;

    const backgroundData = cloneImageData(baseData);
    const foregroundData = cloneImageData(baseData);
    const backgroundPixels = backgroundData.data;
    const foregroundPixels = foregroundData.data;

    for (let i = 0; i < backgroundPixels.length; i += 4) {
      const surfaceCoverage = surfacePixels
        ? readMaskCoverage(surfacePixels, i, template.surfaceMaskMode || 'alpha-cutout')
        : 0;
      const occluderCoverage = occluderPixels
        ? readMaskCoverage(occluderPixels, i, template.occluderMaskMode || 'luma')
        : 0;
      const surfaceRatio = surfaceCoverage / 255;
      const occluderRatio = occluderCoverage / 255;

      if (template.sceneMode === 'layered') {
        const backgroundKeep = clamp(1 - Math.max(surfaceRatio, occluderRatio), 0, 1);
        backgroundPixels[i + 3] = Math.round(backgroundPixels[i + 3] * backgroundKeep);
      }

      foregroundPixels[i + 3] = occluderCoverage;
    }

    return {
      backgroundCanvas: imageDataToCanvas(backgroundData),
      foregroundCanvas: occluderPixels ? imageDataToCanvas(foregroundData) : null
    };
  }

  function buildSurfaceDetailCanvas(baseData, surfaceMaskData, template, finish = null) {
    const width = baseData.width;
    const height = baseData.height;
    const surfacePixels = surfaceMaskData?.data;
    if (!surfacePixels) return null;

    const detailData = new ImageData(width, height);
    const output = detailData.data;
    const source = baseData.data;
    const strength = getLayeredDetailStrength(template, finish);

    for (let i = 0; i < output.length; i += 4) {
      const surfaceCoverage = readMaskCoverage(surfacePixels, i, template.surfaceMaskMode || 'alpha-cutout');
      if (!surfaceCoverage) continue;
      const luma = getLuma(source[i], source[i + 1], source[i + 2]);
      const centered = clamp(128 + (luma - 128) * 1.22, 48, 214);
      output[i] = centered;
      output[i + 1] = centered;
      output[i + 2] = centered;
      output[i + 3] = Math.round(surfaceCoverage * strength);
    }

    return imageDataToCanvas(detailData);
  }

  function drawSurfaceDetailOverlay(ctx, detailCanvas, finish = null) {
    if (!detailCanvas) return;
    const blendMode = finish?.id === 'classic' ? 'soft-light' : 'multiply';
    ctx.save();
    ctx.globalCompositeOperation = blendMode;
    ctx.globalAlpha = finish?.id === 'classic' ? 0.26 : 0.34;
    ctx.drawImage(detailCanvas, 0, 0);
    ctx.restore();
  }

  function getLayeredDetailStrength(template, finish = null) {
    if (template?.target !== 'wall') return 0.42;
    if (finish?.id === 'classic') return 0.38;
    if (finish?.id === 'historical') return 0.62;
    if (finish?.id === 'coarse') return 0.56;
    return 0.48;
  }

  function getFinishOptions(template) {
    return Array.isArray(template?.finishOptions) ? template.finishOptions : [];
  }

  function resolveFinish(template, finishId) {
    const options = getFinishOptions(template);
    return options.find((finish) => finish.id === finishId) || options[0] || null;
  }

  function filterMaterialsForFinish(materials, template, finishId) {
    const options = getFinishOptions(template);
    if (!options.length) return materials;
    const finish = resolveFinish(template, finishId);
    if (!finish) return materials;
    if (template?.target !== 'wall') return materials;
    if (finish.id === 'historical') {
      const historical = materials.filter((material) => material.texture === 'stone' || material.texture === 'brick');
      return historical.length ? historical : materials;
    }
    if (finish.id === 'classic') {
      const classic = materials.filter((material) => material.renderMode === 'paint' || material.texture === 'paint');
      return classic.length ? classic : materials;
    }
    const filtered = materials.filter((material) => material.texture !== 'wood');
    return filtered.length ? filtered : materials;
  }

  function alpha(hex, opacity) {
    const { r, g, b } = parseHex(hex);
    return `rgba(${r}, ${g}, ${b}, ${clamp(opacity, 0, 1)})`;
  }

  function deriveAccent(hex) {
    const { r, g, b } = parseHex(hex);
    return toHex(
      Math.round(r * 0.72),
      Math.round(g * 0.72),
      Math.round(b * 0.72)
    );
  }

  function mixHex(baseHex, otherHex, amount = 0.5) {
    const base = parseHex(baseHex);
    const other = parseHex(otherHex);
    const t = clamp(amount, 0, 1);
    return toHex(
      Math.round(base.r + (other.r - base.r) * t),
      Math.round(base.g + (other.g - base.g) * t),
      Math.round(base.b + (other.b - base.b) * t)
    );
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

  function imageDataToCanvas(imageData) {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext('2d').putImageData(imageData, 0, 0);
    return canvas;
  }

  function scaleTileCanvas(tileCanvas, multiplier = 1) {
    if (!tileCanvas || multiplier === 1) return tileCanvas;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(64, Math.round(tileCanvas.width * multiplier));
    canvas.height = Math.max(64, Math.round(tileCanvas.height * multiplier));
    canvas.getContext('2d').drawImage(tileCanvas, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  function toHex(r, g, b) {
    return `#${[r, g, b].map((channel) => clamp(channel, 0, 255).toString(16).padStart(2, '0')).join('')}`;
  }

  function readMaskCoverage(pixels, index, mode = 'alpha-cutout') {
    const alpha = pixels[index + 3];
    const luma = getLuma(pixels[index], pixels[index + 1], pixels[index + 2]);

    if (mode === 'alpha') return alpha;
    if (mode === 'luma') return Math.round((luma * alpha) / 255);
    if (mode === 'luma-invert') return 255 - Math.round((luma * alpha) / 255);
    return 255 - alpha;
  }

  function getLuma(r, g, b) {
    return (r * 0.299) + (g * 0.587) + (b * 0.114);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function projectionLabel(mode) {
    if (mode === 'floor') return 'suelo';
    if (mode === 'facade') return 'fachada';
    return 'muro';
  }

  function guideModeLabel(mode) {
    if (mode === 'surface') return 'superficie a intervenir';
    if (mode === 'occluders') return 'oclusores protegidos';
    if (mode === 'shadows') return 'sombras y volumen';
    return 'resultado compuesto';
  }

  function getAfterLabel(mode) {
    if (mode === 'surface') return 'Guía de superficie';
    if (mode === 'occluders') return 'Guía de oclusores';
    if (mode === 'shadows') return 'Guía de sombras';
    return 'Después';
  }

  function getSessionId(clientId) {
    const key = `visualizador-ia-session:${clientId}`;
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const next = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, next);
    return next;
  }

  window.ProceduralSwatch = ProceduralSwatch;
  window.VisualizadorIAWidget = VisualizadorIAWidget;
})();
