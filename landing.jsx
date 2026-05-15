// CA Construcciones — Landing principal
// Depende de: store.js, material-tester.jsx (MaterialTester, ProceduralSwatch)

const { useState, useEffect, useRef, useMemo } = React;

// ───────────────────────── Helpers ─────────────────────────
function useStore(name) {
  const [v, setV] = useState(() => window.CAStore.get(name));
  useEffect(() => window.CAStore.on(name, setV), [name]);
  return v;
}

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return ref;
}
function Reveal({ children, className = '', ...rest }) {
  const ref = useReveal();
  return <div ref={ref} className={`reveal ${className}`} {...rest}>{children}</div>;
}

function Toast({ message, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="toast success">
      <span className="check">✓</span>
      {message}
    </div>
  );
}

// ───────────────────────── Brand ─────────────────────────
function BrandMark({ size = 38 }) {
  return (
    <a href="#top" className="brand">
      <div className="brand-mark" style={{ width: size, height: size }}>
        <img src="assets/logo.jpg" alt="CA Construcciones" />
      </div>
      <div className="brand-text">
        <span className="top">CA Construcciones</span>
        <span className="sub">Soluciones integrales</span>
      </div>
    </a>
  );
}

// ───────────────────────── Nav ─────────────────────────
function Nav({ onOpenLogin }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const links = [
    ['#nosotros', 'Nosotros'],
    ['#obras', 'Obras'],
    ['#tester', 'Probador IA'],
    ['#materiales', 'Materiales'],
    ['#testimonios', 'Clientes'],
    ['#contacto', 'Contacto'],
  ];
  return (
    <>
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-inner">
          <BrandMark />
          <div className="nav-links">
            {links.map(([h, l]) => <a key={h} href={h}>{l}</a>)}
          </div>
          <div className="nav-cta">
            <button className="btn btn-sm btn-ghost" onClick={onOpenLogin}>Admin</button>
            <a className="btn btn-sm btn-primary" href="#contacto">Pedir presupuesto</a>
            <button className="menu-btn" onClick={() => setMenuOpen(true)} aria-label="Menú">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </div>
      </nav>
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <button className="close" onClick={() => setMenuOpen(false)} aria-label="Cerrar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        {links.map(([h, l]) => <a key={h} href={h} onClick={() => setMenuOpen(false)}>{l}</a>)}
        <a href="#contacto" className="btn btn-primary" style={{ marginTop: 24, justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>Pedir presupuesto</a>
      </div>
    </>
  );
}

// ───────────────────────── Hero ─────────────────────────
function Hero() {
  const site = useStore('site');
  const projects = useStore('projects');
  const featured = projects.find((p) => p.cover) || projects[0];
  return (
    <section id="top" className="hero">
      <div className="hero-bg"></div>
      <div className="container hero-inner">
        <div>
          <Reveal>
            <div className="kicker">{site.hero_kicker}</div>
            <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: site.hero_title.replace(/(que importan\.?|que duran\.?|que inspiran\.?)/i, '<em>$1</em>') }} />
            <p className="hero-sub">{site.hero_sub}</p>
            <div className="hero-ctas">
              <a className="btn btn-primary" href="#tester">
                Probar materiales con IA
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </a>
              <a className="btn btn-ghost" href="#obras">Ver obras</a>
            </div>
          </Reveal>
        </div>
        <Reveal className="reveal-up">
          <div className="hero-visual">
            <img src={featured?.cover || 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1400&q=80'} alt="Obra destacada" />
            <div className="hero-visual-badges">
              <div className="badge"><span className="dot"></span>Obra en curso · {featured?.title}</div>
              <div className="badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {featured?.location}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
      <div className="container">
        <Reveal className="stagger" >
          <div className="hero-stats">
            {site.stats.map((s, i) => (
              <div className="stat" key={i}>
                <div className="v">{s.value}</div>
                <div className="l">{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ───────────────────────── Servicios ─────────────────────────
const SERVICES = [
  { title: 'Obra nueva', desc: 'Diseño, ingeniería y ejecución llave en mano de viviendas, edificios y locales comerciales.', tags: ['Casas', 'Edificios', 'Locales'], icon: 'M3 21h18M5 21V8l7-5 7 5v13M9 21v-7h6v7' },
  { title: 'Refacción integral', desc: 'Reciclajes profundos, ampliaciones y puestas en valor con dirección técnica completa.', tags: ['Reciclajes', 'Ampliaciones'], icon: 'M3 12l9-9 9 9M5 10v10h14V10M9 20v-6h6v6' },
  { title: 'Dirección de obra', desc: 'Acompañamos tu proyecto con dirección, certificaciones y reportes semanales transparentes.', tags: ['Certificaciones', 'Reportes'], icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' },
];

function Servicios() {
  return (
    <section id="nosotros">
      <div className="container">
        <div className="section-header">
          <Reveal>
            <div className="kicker">Lo que hacemos</div>
            <h2 style={{ marginTop: 18 }}>Un solo equipo del primer boceto a la entrega de llaves.</h2>
          </Reveal>
          <Reveal className="reveal-up">
            <p>Integramos diseño, ingeniería y obra para que tu proyecto fluya sin intermediarios ni sorpresas.</p>
          </Reveal>
        </div>
        <Reveal className="stagger">
          <div className="services-grid">
            {SERVICES.map((s, i) => (
              <div
                key={i}
                className="service"
                onMouseMove={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty('--mx', e.clientX - r.left + 'px');
                  e.currentTarget.style.setProperty('--my', e.clientY - r.top + 'px');
                }}
              >
                <div className="service-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d={s.icon}/></svg>
                </div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                <div className="service-tags">
                  {s.tags.map((t) => <span key={t} className="chip">{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ───────────────────────── Obras ─────────────────────────
function Obras() {
  const projects = useStore('projects');
  const [filter, setFilter] = useState('todas');
  const [open, setOpen] = useState(null);
  const filtered = filter === 'todas' ? projects : projects.filter((p) => p.status === filter);

  return (
    <section id="obras" style={{ background: 'linear-gradient(180deg, transparent, var(--bg-2))' }}>
      <div className="container">
        <div className="section-header">
          <Reveal>
            <div className="kicker">Nuestras obras</div>
            <h2 style={{ marginTop: 18 }}>Proyectos que hablan por sí solos.</h2>
          </Reveal>
          <Reveal className="reveal-up"><p>Obras residenciales, comerciales y refacciones premium ejecutadas por nuestro equipo.</p></Reveal>
        </div>
        <Reveal>
          <div className="obras-filter">
            {[['todas', 'Todas'], ['en-proceso', 'En proceso'], ['finalizada', 'Finalizadas']].map(([v, l]) => (
              <button key={v} className={`filter-btn ${filter === v ? 'active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
            ))}
            <div style={{ flex: 1 }}></div>
            <span className="chip">{filtered.length} {filtered.length === 1 ? 'obra' : 'obras'}</span>
          </div>
        </Reveal>
        <Reveal className="stagger">
          <div className="obras-grid">
            {filtered.map((p) => (
              <div className="obra-card" key={p.id} onClick={() => setOpen(p)}>
                <div className="obra-img">
                  <span className={`obra-status ${p.status === 'en-proceso' ? 'proceso' : 'finalizada'}`}>
                    {p.status === 'en-proceso' ? 'En proceso' : 'Finalizada'}
                  </span>
                  <img src={p.cover} alt={p.title} loading="lazy" />
                </div>
                <div className="obra-info">
                  <h3>{p.title}</h3>
                  <div className="meta">
                    <span>{p.location}</span>
                    <span>·</span>
                    <span>{p.surface} m²</span>
                  </div>
                  {p.status === 'en-proceso' && typeof p.progress === 'number' && (
                    <div className="obra-progress">
                      <div className="label"><span>Avance</span><span>{p.progress}%</span></div>
                      <div className="obra-progress-bar"><div style={{ width: p.progress + '%' }}></div></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(null)}>
          <div className="modal lg" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setOpen(null)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <img src={open.cover} alt={open.title} style={{ width: '100%', height: 320, objectFit: 'cover', borderRadius: 14, marginBottom: 24 }} />
            <span className={`obra-status ${open.status === 'en-proceso' ? 'proceso' : 'finalizada'}`} style={{ position: 'static', marginBottom: 10, display: 'inline-block' }}>
              {open.status === 'en-proceso' ? 'En proceso' : 'Finalizada'}
            </span>
            <h3>{open.title}</h3>
            <p className="sub" style={{ marginBottom: 12 }}>{open.location} · {open.surface} m² · {open.year}</p>
            <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>{open.description}</p>
            {open.status === 'en-proceso' && typeof open.progress === 'number' && (
              <div className="obra-progress" style={{ marginTop: 20 }}>
                <div className="label"><span>Avance de obra</span><span>{open.progress}%</span></div>
                <div className="obra-progress-bar"><div style={{ width: open.progress + '%' }}></div></div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// ───────────────────────── Materiales catálogo ─────────────────────────
function Materiales() {
  const materials = useStore('materials');
  const [cat, setCat] = useState('Todos');
  const cats = useMemo(() => ['Todos', ...new Set(materials.map((m) => m.category))], [materials]);
  const filtered = cat === 'Todos' ? materials : materials.filter((m) => m.category === cat);

  return (
    <section id="materiales">
      <div className="container">
        <div className="section-header">
          <Reveal>
            <div className="kicker">Catálogo</div>
            <h2 style={{ marginTop: 18 }}>Materiales seleccionados por nuestro equipo.</h2>
          </Reveal>
          <Reveal className="reveal-up"><p>Trabajamos solo con marcas y proveedores que respaldan la calidad final de cada obra.</p></Reveal>
        </div>
        <Reveal>
          <div className="obras-filter">
            {cats.map((c) => (
              <button key={c} className={`filter-btn ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
        </Reveal>
        <Reveal className="stagger">
          <div className="mat-grid">
            {filtered.map((m) => (
              <div key={m.id} className="mat-card" onClick={() => document.getElementById('tester').scrollIntoView({ behavior: 'smooth' })}>
                <div className="mat-swatch">
                  {m.photo ? <img src={m.photo} alt={m.name} /> : <ProceduralSwatch material={m} size={300} />}
                </div>
                <div className="mat-info">
                  <div className="cat">{m.category}</div>
                  <div className="name">{m.name}</div>
                  <div className="price"><b>${m.price.toLocaleString('es-AR')}</b> / {m.unit}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ───────────────────────── Tester section ─────────────────────────
function TesterSection() {
  return (
    <section id="tester" style={{ background: 'var(--bg-2)' }}>
      <div className="container">
        <div className="section-header">
          <Reveal>
            <div className="kicker">Tecnología CA</div>
            <h2 style={{ marginTop: 18 }}>Probá los materiales en tu obra antes de elegirlos.</h2>
          </Reveal>
          <Reveal className="reveal-up"><p>Subí una foto, pintá la zona y nuestra IA te sugiere los acabados que mejor encajan.</p></Reveal>
        </div>
        <Reveal>
          <window.MaterialTester />
        </Reveal>
      </div>
    </section>
  );
}

// ───────────────────────── Testimonios ─────────────────────────
function Testimonios() {
  const items = useStore('testimonials');
  return (
    <section id="testimonios">
      <div className="container">
        <div className="section-header">
          <Reveal>
            <div className="kicker">Clientes</div>
            <h2 style={{ marginTop: 18 }}>Lo que dicen quienes ya construyeron con nosotros.</h2>
          </Reveal>
          <Reveal className="reveal-up"><p>El 98% de nuestros clientes recomendarían CA Construcciones a un familiar o amigo.</p></Reveal>
        </div>
        <Reveal className="stagger">
          <div className="test-grid">
            {items.map((t) => (
              <div key={t.id} className="test-card">
                <div className="quote-ico">"</div>
                <div className="test-stars">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  ))}
                </div>
                <p className="test-text">{t.text}</p>
                <div className="test-author">
                  <div className="test-avatar">{t.avatar}</div>
                  <div>
                    <div className="who">{t.name}</div>
                    <div className="role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ───────────────────────── Marcas ─────────────────────────
function Marcas() {
  const brands = useStore('brands');
  return (
    <section id="marcas" style={{ paddingTop: 60 }}>
      <div className="container">
        <Reveal>
          <div className="kicker" style={{ marginBottom: 28 }}>Marcas con las que trabajamos</div>
        </Reveal>
        <Reveal>
          <div className="brands-strip">
            {brands.map((b) => (
              <div key={b.id} className="brand-cell">{b.name}</div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ───────────────────────── Contacto ─────────────────────────
function Contacto({ onSubmitToast }) {
  const site = useStore('site');
  const [form, setForm] = useState({ client: '', email: '', phone: '', type: 'Obra nueva', surface: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!form.client.trim() || !form.email.trim()) return;
    setSubmitting(true);
    const budgets = window.CAStore.get('budgets');
    const newB = {
      id: window.CAStore.uid('pres'),
      ...form,
      surface: parseInt(form.surface) || 0,
      status: 'nuevo',
      date: new Date().toISOString().slice(0, 10),
    };
    window.CAStore.set('budgets', [newB, ...budgets]);
    setTimeout(() => {
      setSubmitting(false);
      setForm({ client: '', email: '', phone: '', type: 'Obra nueva', surface: '', message: '' });
      onSubmitToast('Recibimos tu solicitud. Te contactamos en menos de 24 hs.');
    }, 600);
  };

  return (
    <section id="contacto" style={{ background: 'linear-gradient(180deg, var(--bg-2), transparent)' }}>
      <div className="container">
        <div className="contact-grid">
          <Reveal>
            <div className="kicker">Empezá tu obra</div>
            <h2 style={{ marginTop: 18, fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1, fontWeight: 700, letterSpacing: '-0.03em' }}>Contanos qué necesitás. Te respondemos en 24 hs.</h2>
            <div className="contact-info-list">
              <div className="row">
                <div className="ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
                <div><div className="lbl">Teléfono</div><div className="val">{site.contact.phone}</div></div>
              </div>
              <div className="row">
                <div className="ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
                <div><div className="lbl">Email</div><div className="val">{site.contact.email}</div></div>
              </div>
              <div className="row">
                <div className="ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
                <div><div className="lbl">Oficinas</div><div className="val">{site.contact.address}</div></div>
              </div>
            </div>
          </Reveal>
          <Reveal className="reveal-up">
            <form className="card" style={{ padding: 28 }} onSubmit={submit}>
              <div className="contact-form">
                <div className="full">
                  <label>Nombre completo *</label>
                  <input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} required placeholder="Cómo te llamás" />
                </div>
                <div>
                  <label>Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="vos@email.com" />
                </div>
                <div>
                  <label>Teléfono</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="11-5555-5555" />
                </div>
                <div>
                  <label>Tipo de proyecto</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option>Obra nueva</option>
                    <option>Refacción integral</option>
                    <option>Ampliación</option>
                    <option>Local comercial</option>
                    <option>Dirección de obra</option>
                    <option>Consulta</option>
                  </select>
                </div>
                <div>
                  <label>Superficie (m²)</label>
                  <input type="number" value={form.surface} onChange={(e) => setForm({ ...form, surface: e.target.value })} placeholder="120" />
                </div>
                <div className="full">
                  <label>Contanos más</label>
                  <textarea rows="4" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="¿Tenés planos? ¿Plazos? Lo que quieras contar."></textarea>
                </div>
                <div className="full">
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '16px' }} disabled={submitting}>
                    {submitting ? 'Enviando…' : 'Solicitar presupuesto'}
                  </button>
                </div>
              </div>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── Footer ─────────────────────────
function Footer() {
  return (
    <footer>
      <div className="container footer-inner">
        <div>
          <BrandMark />
          <div className="footer-credits" style={{ marginTop: 14 }}>
            © {new Date().getFullYear()} CA Construcciones · Todos los derechos reservados
          </div>
        </div>
        <div className="footer-links">
          <a href="#obras">Obras</a>
          <a href="#materiales">Materiales</a>
          <a href="#tester">Probador IA</a>
          <a href="#contacto">Contacto</a>
        </div>
      </div>
    </footer>
  );
}

// ───────────────────────── Login Modal ─────────────────────────
function LoginModal({ onClose, onSuccess }) {
  const [user, setUser] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (user === 'Admin' && pwd === '1234') {
      sessionStorage.setItem('ca_admin', '1');
      onSuccess();
    } else {
      setErr('Usuario o contraseña incorrectos.');
    }
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <button type="button" className="modal-close" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', color: 'var(--accent)', marginBottom: 18 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h3>Acceso administrador</h3>
        <div className="sub">Ingresá con tus credenciales para administrar materiales, obras y presupuestos.</div>
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <label>Usuario</label>
            <input autoFocus value={user} onChange={(e) => { setUser(e.target.value); setErr(''); }} placeholder="Admin" />
          </div>
          <div>
            <label>Contraseña</label>
            <input type="password" value={pwd} onChange={(e) => { setPwd(e.target.value); setErr(''); }} placeholder="••••" />
          </div>
          {err && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{err}</div>}
          <button className="btn btn-primary" type="submit" style={{ justifyContent: 'center', padding: '14px' }}>Ingresar al panel</button>
          <div style={{ fontSize: 12, color: 'var(--muted-2)', textAlign: 'center' }}>Demo: <code style={{ color: 'var(--muted)' }}>Admin / 1234</code></div>
        </div>
      </form>
    </div>
  );
}

// ───────────────────────── App ─────────────────────────
function App() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [toast, setToast] = useState(null);

  return (
    <>
      <Nav onOpenLogin={() => setLoginOpen(true)} />
      <Hero />
      <Servicios />
      <Obras />
      <TesterSection />
      <Materiales />
      <Testimonios />
      <Marcas />
      <Contacto onSubmitToast={setToast} />
      <Footer />
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} onSuccess={() => { window.location.href = 'admin.html'; }} />}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
