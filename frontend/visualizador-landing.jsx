// Visualizador IA integrado para la landing sin Web Components.
(function () {
  const { useEffect, useMemo, useRef, useState } = React;

  const fallbackTemplates = [
    { id: 'wall', label: 'Pared', target: 'wall', imageUrl: '/visualizador-assets/wall-original.png' },
    { id: 'floor', label: 'Piso', target: 'floor', imageUrl: '/visualizador-assets/floor-original.png' },
    { id: 'facade', label: 'Fachada', target: 'facade', imageUrl: '/visualizador-assets/facade-original.png' }
  ];

  const labels = { wall: 'Pared', floor: 'Piso', facade: 'Fachada' };

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
    const [sessionId] = useState(() => getSessionId(clientId));
    const [templates, setTemplates] = useState(fallbackTemplates);
    const [selectedTemplateId, setSelectedTemplateId] = useState('wall');
    const [materials, setMaterials] = useState([]);
    const [materialId, setMaterialId] = useState('');
    const [resultUrl, setResultUrl] = useState(null);
    const [status, setStatus] = useState('idle');
    const [usage, setUsage] = useState({ count: 0, registered: false, limit: 2 });
    const [showLead, setShowLead] = useState(false);
    const [error, setError] = useState('');
    const [budgetSent, setBudgetSent] = useState(false);

    const selectedTemplate = templates.find((item) => item.id === selectedTemplateId) || templates[0];
    const target = selectedTemplate.target;
    const targetMaterials = useMemo(() => materials.filter((item) => item.target === target), [materials, target]);
    const selectedMaterial = targetMaterials.find((item) => item.id === materialId) || targetMaterials[0];

    useEffect(() => {
      fetch(`${apiUrl}/api/templates`).then((r) => r.json()).then((data) => {
        if (Array.isArray(data.templates) && data.templates.length) setTemplates(data.templates);
      }).catch(() => setTemplates(fallbackTemplates));

      fetch(`${apiUrl}/api/materials`).then((r) => r.json()).then((data) => {
        setMaterials(Array.isArray(data.materials) ? data.materials : []);
      }).catch(() => setMaterials([]));

      refreshUsage();
    }, [apiUrl, sessionId]);

    useEffect(() => {
      if (!selectedMaterial && targetMaterials[0]) setMaterialId(targetMaterials[0].id);
    }, [selectedMaterial, targetMaterials]);

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
      setSelectedTemplateId(templateId);
      setMaterialId(nextMaterials[0]?.id || '');
      setResultUrl(null);
      setBudgetSent(false);
      setError('');
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

          <div>
            <div className="ca-viz-label">Material para {labels[target].toLowerCase()}</div>
            <div className="ca-viz-materials">
              {targetMaterials.map((material) => (
                <button key={material.id} className={selectedMaterial?.id === material.id ? 'active' : ''} onClick={() => { setMaterialId(material.id); setResultUrl(null); setBudgetSent(false); }}>
                  <MaterialThumb material={material} />
                  <span>{material.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button className="ca-viz-generate" disabled={status !== 'idle' || !selectedMaterial} onClick={generate}>
            {status === 'generating' ? 'Generando...' : 'Visualizar'}
          </button>
        </div>

        {showLead && <LeadForm apiUrl={apiUrl} clientId={clientId} sessionId={sessionId} setUsage={setUsage} setShowLead={setShowLead} setError={setError} />}

        <div className="ca-viz-preview">
          <figure>
            <img src={selectedTemplate.imageUrl} alt="Escena original" />
            <figcaption>Antes</figcaption>
          </figure>
          <figure>
            {resultUrl ? <img src={resultUrl} alt="Visualización generada" /> : <div className="ca-viz-empty">Resultado IA</div>}
            <figcaption>Después</figcaption>
          </figure>
        </div>

        <div className="ca-viz-footer">
          <span>Escena: {selectedTemplate.label}</span>
          <span>Generaciones: {usage.registered ? 'registrado' : `${usage.count}/${usage.limit}`}</span>
          {error && <strong>{error}</strong>}
        </div>

        {resultUrl && (
          <BudgetForm
            apiUrl={apiUrl}
            clientId={clientId}
            sessionId={sessionId}
            selectedTemplate={selectedTemplate}
            selectedMaterial={selectedMaterial}
            target={target}
            resultUrl={resultUrl}
            setUsage={setUsage}
            setError={setError}
            budgetSent={budgetSent}
            setBudgetSent={setBudgetSent}
          />
        )}
      </div>
    );
  }

  function MaterialThumb({ material }) {
    if (material.photo) {
      return <img className="ca-viz-material-photo" src={material.photo} alt="" loading="lazy" />;
    }
    return <span className="ca-viz-swatch" style={{ background: material.swatch || '#ccc' }}></span>;
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
