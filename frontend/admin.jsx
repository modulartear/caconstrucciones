// CA Construcciones — Dashboard administrativo
// Depende de: store.js, material-tester.jsx (ProceduralSwatch, generateTexture)

const { useState, useEffect, useMemo, useRef } = React;

// ───────────────────────── Auth ─────────────────────────
function useAuth() {
  const [ok, setOk] = useState(() => localStorage.getItem('ca_admin_token') !== null);
  return [ok, setOk];
}
function logout() {
  localStorage.removeItem('ca_admin_token');
  window.location.href = 'index.html';
}
async function loginWithAPI(username, password) {
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username, password })
    });
    const data = await response.json();
    if (response.ok && data.token) {
      localStorage.setItem('ca_admin_token', data.token);
      return { success: true };
    }
    return { success: false, error: data.error || 'Login failed' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ───────────────────────── Helpers ─────────────────────────
function useStoreVal(name) {
  const [v, setV] = useState(() => window.CAStore.get(name));
  useEffect(() => window.CAStore.on(name, setV), [name]);
  return v;
}
function setStore(name, data) { window.CAStore.set(name, data); }

function Toast({ msg, kind = 'success', onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  return <div className={`toast ${kind}`}><span className="check">✓</span>{msg}</div>;
}

function Modal({ title, sub, onClose, children, size }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${size === 'lg' ? 'lg' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <h3>{title}</h3>
        {sub && <div className="sub">{sub}</div>}
        {children}
      </div>
    </div>
  );
}

function ConfirmDel({ name, onClose, onConfirm }) {
  return (
    <Modal title="¿Eliminar?" sub={`Se eliminará "${name}". Esta acción no se puede deshacer.`} onClose={onClose}>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn" style={{ background: 'var(--danger)', color: '#fff', borderColor: 'var(--danger)' }} onClick={onConfirm}>Eliminar</button>
      </div>
    </Modal>
  );
}

function PhotoInput({ value, onChange, hint = 'Subí una foto' }) {
  const onFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target.result);
    reader.readAsDataURL(file);
  };
  return (
    <div className={`photo-upload ${value ? 'has-image' : ''}`}>
      {value ? (
        <>
          <img src={value} alt="" />
          <button type="button" className="remove" onClick={(e) => { e.preventDefault(); onChange(null); }}>Quitar</button>
        </>
      ) : (
        <>
          <div style={{ fontSize: 13 }}>{hint}</div>
          <div style={{ fontSize: 11, marginTop: 4, color: 'var(--muted-2)' }}>JPG / PNG / WebP</div>
          <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
        </>
      )}
    </div>
  );
}

// ───────────────────────── Login ─────────────────────────
function Login({ onSuccess }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    const result = await loginWithAPI(u, p);
    if (result.success) {
      onSuccess();
    } else {
      setErr(result.error || 'Credenciales incorrectas.');
    }
    setLoading(false);
  };
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <form className="card" style={{ padding: 36, maxWidth: 420, width: '100%' }} onSubmit={submit}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div className="brand-mark"><img src="assets/logo.jpg" alt="" /></div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700 }}>CA Construcciones</div>
            <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Panel administrativo</div>
          </div>
        </div>
        <h3 style={{ fontSize: 22, marginBottom: 6 }}>Ingresá a tu cuenta</h3>
        <div className="sub" style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 22 }}>Acceso restringido al equipo CA.</div>
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <label>Usuario</label>
            <input autoFocus value={u} onChange={(e) => { setU(e.target.value); setErr(''); }} disabled={loading} />
          </div>
          <div>
            <label>Contraseña</label>
            <input type="password" value={p} onChange={(e) => { setP(e.target.value); setErr(''); }} disabled={loading} />
          </div>
          {err && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{err}</div>}
          <button className="btn btn-primary" style={{ justifyContent: 'center', padding: 14 }} type="submit" disabled={loading}>
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>
          <div style={{ fontSize: 12, color: 'var(--muted-2)', textAlign: 'center' }}>Usa tus credenciales de administrador</div>
        </div>
        <div style={{ marginTop: 18, fontSize: 12, textAlign: 'center' }}>
          <a href="index.html" style={{ color: 'var(--muted)' }}>← Volver al sitio</a>
        </div>
      </form>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD OVERVIEW
// ═══════════════════════════════════════════════════════════
function DashboardPage({ go }) {
  const materials = useStoreVal('materials');
  const projects = useStoreVal('projects');
  const budgets = useStoreVal('budgets');
  const clients = useStoreVal('clients');
  const newBudgets = budgets.filter((b) => b.status === 'nuevo');

  const stats = [
    { l: 'Materiales', v: materials.length, ic: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { l: 'Obras', v: projects.length, ic: 'M3 21h18M5 21V8l7-5 7 5v13' },
    { l: 'Presupuestos nuevos', v: newBudgets.length, ic: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6' },
    { l: 'Clientes', v: clients.length, ic: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75' },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Resumen</h1>
          <p>Vista general de tu operación · {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="actions">
          <a className="btn btn-ghost btn-sm" href="index.html" target="_blank">Ver sitio ↗</a>
          <button className="btn btn-sm" onClick={() => go('materiales')}>+ Material</button>
        </div>
      </div>

      <div className="stats-row">
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div>
              <div className="l">{s.l}</div>
              <div className="v">{s.v}</div>
            </div>
            <div className="ic">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {s.ic.split(' M').map((p, idx) => <path key={idx} d={(idx ? 'M' : '') + p} />)}
              </svg>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18, alignItems: 'start' }}>
        <div className="panel">
          <div className="panel-head">
            <h3>Presupuestos recientes</h3>
            <button className="btn btn-sm btn-ghost" onClick={() => go('presupuestos')}>Ver todos →</button>
          </div>
          {budgets.length === 0 ? (
            <div className="empty-state">Sin presupuestos por ahora.</div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Cliente</th><th>Tipo</th><th>m²</th><th>Estado</th></tr></thead>
              <tbody>
                {budgets.slice(0, 5).map((b) => (
                  <tr key={b.id}>
                    <td><b>{b.client}</b><div style={{ color: 'var(--muted)', fontSize: 12 }}>{b.date}</div></td>
                    <td>{b.type}</td>
                    <td>{b.surface || '—'}</td>
                    <td><span className={`status-pill status-${b.status}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="panel">
          <div className="panel-head"><h3>Obras en proceso</h3></div>
          <div className="panel-body padded" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {projects.filter((p) => p.status === 'en-proceso').map((p) => (
              <div key={p.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <b>{p.title}</b>
                  <span style={{ color: 'var(--muted)' }}>{p.progress ?? 0}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: (p.progress ?? 0) + '%', height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }}></div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{p.location}</div>
              </div>
            ))}
            {projects.filter((p) => p.status === 'en-proceso').length === 0 && (
              <div className="empty-state" style={{ padding: 30 }}>Sin obras en curso.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// MATERIALES
// ═══════════════════════════════════════════════════════════
const MAT_TEXTURES = [
  { k: 'marble', l: 'Mármol / Porcelanato' },
  { k: 'wood', l: 'Madera' },
  { k: 'brick', l: 'Ladrillo' },
  { k: 'cement', l: 'Microcemento' },
  { k: 'stone', l: 'Piedra' },
  { k: 'paint', l: 'Pintura' },
];
const MAT_CATEGORIES = ['Pisos', 'Revestimientos', 'Maderas', 'Pinturas', 'Sanitarios', 'Griferías', 'Iluminación', 'Otros'];

function MaterialesPage({ toast }) {
  const materials = useStoreVal('materials');
  const [editing, setEditing] = useState(null);
  const [delTarget, setDelTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('Todos');

  const filtered = materials.filter((m) =>
    (catFilter === 'Todos' || m.category === catFilter) &&
    (m.name.toLowerCase().includes(search.toLowerCase()) || m.category.toLowerCase().includes(search.toLowerCase()))
  );

  const save = (mat) => {
    let next;
    if (mat.id) {
      next = materials.map((m) => (m.id === mat.id ? mat : m));
      toast('Material actualizado');
    } else {
      mat.id = window.CAStore.uid('m');
      next = [mat, ...materials];
      toast('Material agregado al catálogo');
    }
    setStore('materials', next);
    setEditing(null);
  };
  const remove = (id) => {
    setStore('materials', materials.filter((m) => m.id !== id));
    toast('Material eliminado');
    setDelTarget(null);
  };

  return (
    <>
      <div className="page-head">
        <div><h1>Materiales</h1><p>Catálogo público disponible en la landing y en el probador IA.</p></div>
        <div className="actions">
          <button className="btn btn-primary btn-sm" onClick={() => setEditing({})}>+ Nuevo material</button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div className="search-row">
            <input placeholder="Buscar material…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} style={{ width: 180 }}>
              <option>Todos</option>
              {MAT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <span className="chip">{filtered.length} ítems</span>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state">No hay materiales con esos filtros.</div>
        ) : (
          <table className="tbl">
            <thead><tr><th>Material</th><th>Categoría</th><th>Precio</th><th>Stock</th><th></th></tr></thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="material-mini">
                      {m.photo ? <img src={m.photo} alt="" /> : <ProceduralSwatch material={m} size={88} />}
                      <div>
                        <b>{m.name}</b>
                        <div style={{ color: 'var(--muted)', fontSize: 12 }}>{m.description?.slice(0, 60)}{m.description?.length > 60 ? '…' : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="chip">{m.category}</span></td>
                  <td><b>${m.price?.toLocaleString('es-AR')}</b> <span style={{ color: 'var(--muted)' }}>/{m.unit}</span></td>
                  <td>{m.stock}</td>
                  <td className="actions">
                    <button className="icon-btn" onClick={() => setEditing(m)} title="Editar">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className="icon-btn danger" onClick={() => setDelTarget(m)} title="Eliminar">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && <MaterialForm initial={editing} onClose={() => setEditing(null)} onSave={save} />}
      {delTarget && <ConfirmDel name={delTarget.name} onClose={() => setDelTarget(null)} onConfirm={() => remove(delTarget.id)} />}
    </>
  );
}

function MaterialForm({ initial, onClose, onSave }) {
  const [m, setM] = useState({
    name: '', category: 'Pisos', color: '#e8e4dd', accent: '#9aa0a8',
    price: 0, unit: 'm²', description: '', stock: 0, photo: null, texture: 'marble',
    ...initial,
  });
  const previewRef = useRef(null);
  useEffect(() => {
    if (!previewRef.current) return;
    previewRef.current.width = 220;
    previewRef.current.height = 140;
    if (m.photo) {
      const img = new Image();
      img.onload = () => previewRef.current && previewRef.current.getContext('2d').drawImage(img, 0, 0, 220, 140);
      img.src = m.photo;
    } else {
      generateTexture(previewRef.current, m.texture, m.color, m.accent);
    }
  }, [m.color, m.accent, m.texture, m.photo]);

  const submit = (e) => { e.preventDefault(); if (!m.name.trim()) return; onSave({ ...m, price: +m.price || 0, stock: +m.stock || 0 }); };

  return (
    <Modal title={m.id ? 'Editar material' : 'Nuevo material'} size="lg" onClose={onClose}>
      <form onSubmit={submit} className="form-grid" style={{ marginTop: 8 }}>
        <div className="full">
          <label>Nombre</label>
          <input value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} placeholder="Porcelanato Calacatta" required />
        </div>
        <div>
          <label>Categoría</label>
          <select value={m.category} onChange={(e) => setM({ ...m, category: e.target.value })}>
            {MAT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label>Tipo de textura (para preview procedural)</label>
          <select value={m.texture} onChange={(e) => setM({ ...m, texture: e.target.value })}>
            {MAT_TEXTURES.map((t) => <option key={t.k} value={t.k}>{t.l}</option>)}
          </select>
        </div>
        <div>
          <label>Precio</label>
          <input type="number" value={m.price} onChange={(e) => setM({ ...m, price: e.target.value })} />
        </div>
        <div>
          <label>Unidad</label>
          <select value={m.unit} onChange={(e) => setM({ ...m, unit: e.target.value })}>
            <option>m²</option><option>m</option><option>L</option><option>kg</option><option>u</option>
          </select>
        </div>
        <div>
          <label>Stock</label>
          <input type="number" value={m.stock} onChange={(e) => setM({ ...m, stock: e.target.value })} />
        </div>
        <div>
          <label>Color base</label>
          <div className="color-row">
            <div className="color-swatch" style={{ background: m.color }}>
              <input type="color" value={m.color} onChange={(e) => setM({ ...m, color: e.target.value })} />
            </div>
            <input value={m.color} onChange={(e) => setM({ ...m, color: e.target.value })} style={{ flex: 1 }} />
          </div>
        </div>
        <div>
          <label>Color acento (vetas / detalles)</label>
          <div className="color-row">
            <div className="color-swatch" style={{ background: m.accent }}>
              <input type="color" value={m.accent} onChange={(e) => setM({ ...m, accent: e.target.value })} />
            </div>
            <input value={m.accent} onChange={(e) => setM({ ...m, accent: e.target.value })} style={{ flex: 1 }} />
          </div>
        </div>
        <div className="full">
          <label>Descripción</label>
          <textarea rows="3" value={m.description} onChange={(e) => setM({ ...m, description: e.target.value })} placeholder="Detalles técnicos, acabado, terminación…"></textarea>
        </div>
        <div className="full">
          <label>Foto real (opcional) — anula la textura procedural</label>
          <PhotoInput value={m.photo} onChange={(v) => setM({ ...m, photo: v })} hint="Arrastrá una foto del material o hacé click" />
        </div>
        <div className="full">
          <label>Preview</label>
          <canvas ref={previewRef} style={{ width: '100%', maxWidth: 240, borderRadius: 12, border: '1px solid var(--border)', display: 'block' }} />
        </div>
        <div className="full" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary">{m.id ? 'Guardar cambios' : 'Crear material'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// OBRAS
// ═══════════════════════════════════════════════════════════
function ObrasPage({ toast }) {
  const projects = useStoreVal('projects');
  const [editing, setEditing] = useState(null);
  const [delTarget, setDelTarget] = useState(null);

  const save = (p) => {
    let next;
    if (p.id) { next = projects.map((x) => (x.id === p.id ? p : x)); toast('Obra actualizada'); }
    else { p.id = window.CAStore.uid('p'); next = [p, ...projects]; toast('Obra agregada'); }
    setStore('projects', next); setEditing(null);
  };
  const remove = (id) => { setStore('projects', projects.filter((x) => x.id !== id)); toast('Obra eliminada'); setDelTarget(null); };

  return (
    <>
      <div className="page-head">
        <div><h1>Obras</h1><p>Proyectos visibles en el sitio público.</p></div>
        <div className="actions"><button className="btn btn-primary btn-sm" onClick={() => setEditing({})}>+ Nueva obra</button></div>
      </div>

      <div className="panel">
        {projects.length === 0 ? <div className="empty-state">Sin obras cargadas.</div> : (
          <table className="tbl">
            <thead><tr><th>Obra</th><th>Estado</th><th>Superficie</th><th>Año</th><th></th></tr></thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="material-mini">
                      <img src={p.cover} alt="" style={{ objectFit: 'cover' }} />
                      <div>
                        <b>{p.title}</b>
                        <div style={{ color: 'var(--muted)', fontSize: 12 }}>{p.location}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${p.status === 'en-proceso' ? 'proceso' : 'finalizada'}`}>
                      {p.status === 'en-proceso' ? `En proceso · ${p.progress ?? 0}%` : 'Finalizada'}
                    </span>
                  </td>
                  <td>{p.surface} m²</td>
                  <td>{p.year}</td>
                  <td className="actions">
                    <button className="icon-btn" onClick={() => setEditing(p)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className="icon-btn danger" onClick={() => setDelTarget(p)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && <ObraForm initial={editing} onClose={() => setEditing(null)} onSave={save} />}
      {delTarget && <ConfirmDel name={delTarget.title} onClose={() => setDelTarget(null)} onConfirm={() => remove(delTarget.id)} />}
    </>
  );
}

function ObraForm({ initial, onClose, onSave }) {
  const [p, setP] = useState({
    title: '', location: '', status: 'en-proceso', surface: 0, year: new Date().getFullYear(),
    description: '', progress: 20, cover: '', gallery: [], ...initial,
  });
  const submit = (e) => { e.preventDefault(); if (!p.title.trim()) return; onSave({ ...p, surface: +p.surface || 0, year: +p.year, progress: +p.progress || 0 }); };
  return (
    <Modal title={p.id ? 'Editar obra' : 'Nueva obra'} size="lg" onClose={onClose}>
      <form onSubmit={submit} className="form-grid" style={{ marginTop: 8 }}>
        <div className="full"><label>Título</label><input value={p.title} onChange={(e) => setP({ ...p, title: e.target.value })} required /></div>
        <div><label>Ubicación</label><input value={p.location} onChange={(e) => setP({ ...p, location: e.target.value })} placeholder="Barrio, Ciudad" /></div>
        <div><label>Año</label><input type="number" value={p.year} onChange={(e) => setP({ ...p, year: e.target.value })} /></div>
        <div>
          <label>Estado</label>
          <select value={p.status} onChange={(e) => setP({ ...p, status: e.target.value })}>
            <option value="en-proceso">En proceso</option>
            <option value="finalizada">Finalizada</option>
          </select>
        </div>
        <div><label>Superficie (m²)</label><input type="number" value={p.surface} onChange={(e) => setP({ ...p, surface: e.target.value })} /></div>
        {p.status === 'en-proceso' && (
          <div className="full">
            <label>Avance: {p.progress}%</label>
            <input type="range" min="0" max="100" value={p.progress} onChange={(e) => setP({ ...p, progress: e.target.value })} />
          </div>
        )}
        <div className="full"><label>Descripción</label><textarea rows="3" value={p.description} onChange={(e) => setP({ ...p, description: e.target.value })}></textarea></div>
        <div className="full"><label>Foto de portada</label><PhotoInput value={p.cover} onChange={(v) => setP({ ...p, cover: v })} hint="Subí la foto principal" /></div>
        <div className="full" style={{ fontSize: 12, color: 'var(--muted)' }}>O pegá una URL: <input value={typeof p.cover === 'string' && p.cover.startsWith('http') ? p.cover : ''} onChange={(e) => setP({ ...p, cover: e.target.value })} placeholder="https://…" style={{ marginTop: 6 }} /></div>
        <div className="full" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary">{p.id ? 'Guardar cambios' : 'Crear obra'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// PRESUPUESTOS
// ═══════════════════════════════════════════════════════════
function PresupuestosPage({ toast }) {
  const budgets = useStoreVal('budgets');
  const [open, setOpen] = useState(null);
  const [delTarget, setDelTarget] = useState(null);
  const [filter, setFilter] = useState('todos');

  const filtered = filter === 'todos' ? budgets : budgets.filter((b) => b.status === filter);

  const updateStatus = (id, status) => {
    setStore('budgets', budgets.map((b) => (b.id === id ? { ...b, status } : b)));
    toast('Estado actualizado');
    if (open && open.id === id) setOpen({ ...open, status });
  };
  const remove = (id) => { setStore('budgets', budgets.filter((b) => b.id !== id)); toast('Presupuesto eliminado'); setDelTarget(null); if (open?.id === id) setOpen(null); };

  return (
    <>
      <div className="page-head">
        <div><h1>Presupuestos</h1><p>Solicitudes recibidas desde el formulario público.</p></div>
      </div>
      <div className="panel">
        <div className="panel-head">
          <div className="obras-filter" style={{ margin: 0 }}>
            {[['todos', 'Todos'], ['nuevo', 'Nuevos'], ['contactado', 'Contactados'], ['cotizado', 'Cotizados'], ['cerrado', 'Cerrados']].map(([v, l]) => (
              <button key={v} className={`filter-btn ${filter === v ? 'active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
          <span className="chip">{filtered.length}</span>
        </div>
        {filtered.length === 0 ? <div className="empty-state">No hay solicitudes con ese filtro.</div> : (
          <table className="tbl">
            <thead><tr><th>Cliente</th><th>Tipo</th><th>Contacto</th><th>Estado</th><th>Fecha</th><th></th></tr></thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} style={{ cursor: 'pointer' }} onClick={() => setOpen(b)}>
                  <td><b>{b.client}</b><div style={{ color: 'var(--muted)', fontSize: 12 }}>{b.surface ? b.surface + ' m²' : '—'}</div></td>
                  <td>{b.type}</td>
                  <td><div style={{ fontSize: 13 }}>{b.email}</div><div style={{ color: 'var(--muted)', fontSize: 12 }}>{b.phone}</div></td>
                  <td><span className={`status-pill status-${b.status}`}>{b.status}</span></td>
                  <td style={{ color: 'var(--muted)', fontSize: 13 }}>{b.date}</td>
                  <td className="actions" onClick={(e) => e.stopPropagation()}>
                    <button className="icon-btn danger" onClick={() => setDelTarget(b)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <Modal title={open.client} sub={`${open.type} · ${open.date}`} onClose={() => setOpen(null)}>
          <div style={{ display: 'grid', gap: 12, marginTop: 4 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label>Email</label><div>{open.email}</div></div>
              <div><label>Teléfono</label><div>{open.phone || '—'}</div></div>
              <div><label>Superficie</label><div>{open.surface ? open.surface + ' m²' : '—'}</div></div>
              <div><label>Tipo</label><div>{open.type}</div></div>
            </div>
            <div><label>Mensaje</label><div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, fontSize: 14, lineHeight: 1.55 }}>{open.message || '— Sin mensaje —'}</div></div>
            <div>
              <label>Cambiar estado</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['nuevo', 'contactado', 'cotizado', 'cerrado'].map((s) => (
                  <button key={s} className={`tool-btn ${open.status === s ? 'active' : ''}`} onClick={() => updateStatus(open.id, s)}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
      {delTarget && <ConfirmDel name={delTarget.client} onClose={() => setDelTarget(null)} onConfirm={() => remove(delTarget.id)} />}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// CLIENTES, MARCAS, TESTIMONIOS — genéricos
// ═══════════════════════════════════════════════════════════
function SimpleCRUD({ title, sub, storeKey, fields, displayCols, toast }) {
  const items = useStoreVal(storeKey);
  const [editing, setEditing] = useState(null);
  const [delTarget, setDelTarget] = useState(null);

  const save = (it) => {
    let next;
    if (it.id) { next = items.map((x) => (x.id === it.id ? it : x)); toast('Actualizado'); }
    else { it.id = window.CAStore.uid(storeKey[0]); next = [it, ...items]; toast('Agregado'); }
    setStore(storeKey, next); setEditing(null);
  };
  const remove = (id) => { setStore(storeKey, items.filter((x) => x.id !== id)); toast('Eliminado'); setDelTarget(null); };

  return (
    <>
      <div className="page-head">
        <div><h1>{title}</h1><p>{sub}</p></div>
        <div className="actions"><button className="btn btn-primary btn-sm" onClick={() => setEditing({})}>+ Nuevo</button></div>
      </div>
      <div className="panel">
        {items.length === 0 ? <div className="empty-state">Sin registros.</div> : (
          <table className="tbl">
            <thead><tr>{displayCols.map((c) => <th key={c.key}>{c.label}</th>)}<th></th></tr></thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  {displayCols.map((c) => <td key={c.key}>{c.render ? c.render(it) : it[c.key]}</td>)}
                  <td className="actions">
                    <button className="icon-btn" onClick={() => setEditing(it)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className="icon-btn danger" onClick={() => setDelTarget(it)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {editing && <SimpleCRUDForm title={title} initial={editing} fields={fields} onClose={() => setEditing(null)} onSave={save} />}
      {delTarget && <ConfirmDel name={delTarget.name || delTarget.title || 'este registro'} onClose={() => setDelTarget(null)} onConfirm={() => remove(delTarget.id)} />}
    </>
  );
}

function SimpleCRUDForm({ title, initial, fields, onClose, onSave }) {
  const [it, setIt] = useState(() => {
    const base = {};
    fields.forEach((f) => { base[f.key] = f.default ?? ''; });
    return { ...base, ...initial };
  });
  const submit = (e) => { e.preventDefault(); onSave(it); };
  return (
    <Modal title={it.id ? `Editar ${title}` : `Nuevo en ${title}`} onClose={onClose}>
      <form onSubmit={submit} className="form-grid" style={{ marginTop: 8 }}>
        {fields.map((f) => (
          <div key={f.key} className={f.full ? 'full' : ''}>
            <label>{f.label}</label>
            {f.type === 'textarea' ? (
              <textarea rows="3" value={it[f.key] || ''} onChange={(e) => setIt({ ...it, [f.key]: e.target.value })} placeholder={f.placeholder} />
            ) : f.type === 'select' ? (
              <select value={it[f.key]} onChange={(e) => setIt({ ...it, [f.key]: e.target.value })}>
                {f.options.map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : f.type === 'number' ? (
              <input type="number" min={f.min ?? undefined} max={f.max ?? undefined} value={it[f.key] || ''} onChange={(e) => setIt({ ...it, [f.key]: +e.target.value })} />
            ) : (
              <input type={f.type || 'text'} value={it[f.key] || ''} onChange={(e) => setIt({ ...it, [f.key]: e.target.value })} placeholder={f.placeholder} />
            )}
          </div>
        ))}
        <div className="full" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary">Guardar</button>
        </div>
      </form>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// CONFIGURACIÓN del sitio
// ═══════════════════════════════════════════════════════════
function ConfigPage({ toast }) {
  const site = useStoreVal('site');
  const [s, setS] = useState(site);
  useEffect(() => setS(site), [site]);
  const save = () => { setStore('site', s); toast('Configuración guardada'); };
  const resetAll = () => { if (confirm('Restablecer todos los datos a los valores iniciales? Se perderán materiales, obras, presupuestos y clientes personalizados.')) { window.CAStore.reset(); toast('Datos restablecidos'); } };

  return (
    <>
      <div className="page-head">
        <div><h1>Configuración</h1><p>Contenido editorial de la landing pública.</p></div>
        <div className="actions"><button className="btn btn-primary btn-sm" onClick={save}>Guardar cambios</button></div>
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-head"><h3>Hero</h3></div>
        <div className="panel-body padded" style={{ display: 'grid', gap: 14 }}>
          <div><label>Kicker</label><input value={s.hero_kicker} onChange={(e) => setS({ ...s, hero_kicker: e.target.value })} /></div>
          <div><label>Título (\n para salto de línea)</label><textarea rows="2" value={s.hero_title} onChange={(e) => setS({ ...s, hero_title: e.target.value })} /></div>
          <div><label>Subtítulo</label><textarea rows="2" value={s.hero_sub} onChange={(e) => setS({ ...s, hero_sub: e.target.value })} /></div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-head"><h3>Estadísticas</h3></div>
        <div className="panel-body padded" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {s.stats.map((st, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10, alignItems: 'center' }}>
              <input value={st.value} onChange={(e) => { const copy = [...s.stats]; copy[i] = { ...st, value: e.target.value }; setS({ ...s, stats: copy }); }} />
              <input value={st.label} onChange={(e) => { const copy = [...s.stats]; copy[i] = { ...st, label: e.target.value }; setS({ ...s, stats: copy }); }} />
            </div>
          ))}
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-head"><h3>Contacto</h3></div>
        <div className="panel-body padded" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <div><label>Teléfono</label><input value={s.contact.phone} onChange={(e) => setS({ ...s, contact: { ...s.contact, phone: e.target.value } })} /></div>
          <div><label>Email</label><input value={s.contact.email} onChange={(e) => setS({ ...s, contact: { ...s.contact, email: e.target.value } })} /></div>
          <div><label>Dirección</label><input value={s.contact.address} onChange={(e) => setS({ ...s, contact: { ...s.contact, address: e.target.value } })} /></div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Zona peligrosa</h3></div>
        <div className="panel-body padded">
          <p style={{ color: 'var(--muted)', margin: '0 0 14px', fontSize: 14 }}>Restablece todos los datos del sitio a los valores iniciales de demostración.</p>
          <button className="btn" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={resetAll}>Restablecer datos</button>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// SHELL
// ═══════════════════════════════════════════════════════════
const PAGES = [
  { id: 'dashboard', label: 'Resumen', icon: 'M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z' },
  { id: 'materiales', label: 'Materiales', icon: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' },
  { id: 'obras', label: 'Obras', icon: 'M3 21h18M5 21V8l7-5 7 5v13M9 21v-7h6v7' },
  { id: 'presupuestos', label: 'Presupuestos', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' },
  { id: 'clientes', label: 'Clientes', icon: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75 M8.5 7.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0' },
  { id: 'testimonios', label: 'Testimonios', icon: 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z' },
  { id: 'marcas', label: 'Marcas', icon: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01' },
  { id: 'config', label: 'Configuración', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z' },
];

function App() {
  const [authed, setAuthed] = useAuth();
  const [page, setPage] = useState(() => location.hash?.replace('#', '') || 'dashboard');
  const [toast, setToast] = useState(null);
  const budgets = useStoreVal('budgets');
  const newBudgetCount = budgets.filter((b) => b.status === 'nuevo').length;

  useEffect(() => {
    const onHash = () => setPage(location.hash?.replace('#', '') || 'dashboard');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;

  const showToast = (msg) => setToast({ msg, id: Date.now() });
  const go = (id) => { location.hash = id; setPage(id); };

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="brand-mark" style={{ width: 36, height: 36 }}><img src="assets/logo.jpg" alt="" /></div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700 }}>CA Construcciones</div>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>Panel admin</div>
          </div>
        </div>
        {PAGES.map((p) => (
          <button key={p.id} className={`side-link ${page === p.id ? 'active' : ''}`} onClick={() => go(p.id)}>
            <span className="ico">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {p.icon.split(' M').map((d, i) => <path key={i} d={(i ? 'M' : '') + d} />)}
              </svg>
            </span>
            {p.label}
            {p.id === 'presupuestos' && newBudgetCount > 0 && <span className="badge">{newBudgetCount}</span>}
          </button>
        ))}
        <div className="side-foot">
          <a className="side-link" href="index.html" target="_blank">
            <span className="ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></span>
            Ver sitio
          </a>
          <button className="side-link" onClick={logout}>
            <span className="ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {page === 'dashboard' && <DashboardPage go={go} />}
        {page === 'materiales' && <MaterialesPage toast={showToast} />}
        {page === 'obras' && <ObrasPage toast={showToast} />}
        {page === 'presupuestos' && <PresupuestosPage toast={showToast} />}
        {page === 'clientes' && (
          <SimpleCRUD
            title="Clientes"
            sub="Cuentas registradas de clientes y socios."
            storeKey="clients"
            toast={showToast}
            fields={[
              { key: 'name', label: 'Nombre', full: true },
              { key: 'email', label: 'Email', type: 'email' },
              { key: 'phone', label: 'Teléfono' },
              { key: 'project', label: 'Proyecto asociado', full: true },
              { key: 'since', label: 'Cliente desde', type: 'date' },
            ]}
            displayCols={[
              { key: 'name', label: 'Nombre', render: (c) => <><b>{c.name}</b><div style={{ color: 'var(--muted)', fontSize: 12 }}>{c.email}</div></> },
              { key: 'phone', label: 'Teléfono' },
              { key: 'project', label: 'Proyecto' },
              { key: 'since', label: 'Desde', render: (c) => <span style={{ color: 'var(--muted)', fontSize: 13 }}>{c.since}</span> },
            ]}
          />
        )}
        {page === 'testimonios' && (
          <SimpleCRUD
            title="Testimonios"
            sub="Valoraciones de clientes para mostrar en la landing."
            storeKey="testimonials"
            toast={showToast}
            fields={[
              { key: 'name', label: 'Cliente' },
              { key: 'avatar', label: 'Iniciales (avatar)', placeholder: 'MF' },
              { key: 'role', label: 'Rol / Obra', full: true },
              { key: 'stars', label: 'Estrellas', type: 'number', min: 1, max: 5, default: 5 },
              { key: 'text', label: 'Testimonio', type: 'textarea', full: true },
            ]}
            displayCols={[
              { key: 'name', label: 'Cliente', render: (t) => <><b>{t.name}</b><div style={{ color: 'var(--muted)', fontSize: 12 }}>{t.role}</div></> },
              { key: 'stars', label: 'Stars', render: (t) => '★'.repeat(t.stars) },
              { key: 'text', label: 'Texto', render: (t) => <span style={{ color: 'var(--muted)', fontSize: 12 }}>{t.text?.slice(0, 80)}…</span> },
            ]}
          />
        )}
        {page === 'marcas' && (
          <SimpleCRUD
            title="Marcas"
            sub="Marcas con las que trabajamos, visibles en la landing."
            storeKey="brands"
            toast={showToast}
            fields={[{ key: 'name', label: 'Nombre de la marca', full: true }]}
            displayCols={[{ key: 'name', label: 'Marca', render: (b) => <b style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>{b.name}</b> }]}
          />
        )}
        {page === 'config' && <ConfigPage toast={showToast} />}
      </main>

      {toast && <Toast msg={toast.msg} onDone={() => setToast(null)} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
