// CA Construcciones — Landing principal
// Depende de: store.js, visualizador-landing.jsx (ProceduralSwatch)

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
function BrandMark({ size = 38, site }) {
  const fullLogo = site.logo_full || site.logoFull || null;
  const logoSrc = fullLogo || site.logo || 'assets/ca-logo.png';
  return (
    <a href="#top" className="brand">
      <img
        className="brand-logo"
        src={logoSrc}
        alt="CA construcciones · soluciones integrales"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = 'assets/logo.jpg';
        }}
      />
    </a>
  );
}

// ───────────────────────── Nav ─────────────────────────
function Nav({ onOpenLogin, site }) {
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
          <BrandMark site={site} />
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
  const heroCards = useMemo(() => {
    const fromProjects = (projects || [])
      .filter((p) => p && p.cover)
      .slice(0, 6)
      .map((p) => ({
        id: p.id,
        cover: p.cover,
        title: p.title,
        location: p.location,
        status: p.status || 'finalizada',
      }));

    const fallback = [
      { cover: 'https://images.unsplash.com/photo-1501183638710-841dd1904471?w=1600&q=80', title: 'Casa Las Lomas', location: 'Pilar, Buenos Aires', status: 'finalizada' },
      { cover: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&q=80', title: 'Quinta El Retiro', location: 'Cardales, Buenos Aires', status: 'finalizada' },
      { cover: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1600&q=80', title: 'Loft Industrial', location: 'Palermo, CABA', status: 'finalizada' },
      { cover: 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1600&q=80', title: 'Quinta El Retiro', location: 'Cardales, Buenos Aires', status: 'finalizada' },
      { cover: 'https://images.unsplash.com/photo-1505873242700-f289a29e1e0f?w=1600&q=80', title: 'Casa del Lago', location: 'San Isidro, Buenos Aires', status: 'finalizada' },
      { cover: 'https://images.unsplash.com/photo-1494526585095-c41746248156?w=1600&q=80', title: '3 obras entregadas', location: '', status: 'finalizada', compact: true },
    ];
    const merged = [...fromProjects];
    for (let i = merged.length; i < 6; i++) merged.push(fallback[i]);
    return merged.slice(0, 6);
  }, [projects]);
  const leftCards = heroCards.slice(0, 3);
  const rightCards = heroCards.slice(3, 6);
  return (
    <section id="top" className="hero hero-ref">
      <div className="hero-bg"></div>
      <div className="container hero-inner">
        <div className="hero-copy">
          <Reveal>
            <div className="kicker">SOLUCIONES INTEGRALES EN CONSTRUCCIÓN</div>
            <h1 className="hero-title">
              <span className="hero-title-strong">Construimos</span>
              <br />
              <span className="hero-title-strong">lugares</span>
              <br />
              <span className="hero-title-soft">que</span>
              <br />
              <span className="hero-title-soft">importan.</span>
            </h1>
            <p className="hero-sub">
              Más de 15 años desarrollando obras residenciales, comerciales y refacciones premium en Argentina. Diseño,
              ingeniería y ejecución bajo un mismo equipo.
            </p>
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
          <div className="hero-media">
            <div className="moving-showcase" aria-hidden="true">
              <div className="ms-col up">
                <div className="ms-track">
                  {[...leftCards, ...leftCards, ...leftCards].map((p, i) => (
                    <figure className="ms-card" key={(p.id || p.cover || p.title || 'l') + '-' + i}>
                      <img src={p.cover || p.photo} alt="" />
                      <figcaption>
                        <span className={`ms-tag ${p.status === 'en-proceso' ? 'proceso' : 'finalizada'}`}>{p.status === 'en-proceso' ? 'EN PROCESO' : 'FINALIZADA'}</span>
                        <div className="ms-title">{p.title}</div>
                        <div className="ms-loc">{p.location}</div>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
              <div className="ms-col down">
                <div className="ms-track">
                  {[...rightCards, ...rightCards, ...rightCards].map((p, i) => (
                    <figure className={`ms-card ${p.compact ? 'compact' : ''}`} key={(p.id || p.cover || p.title || 'r') + '-' + i}>
                      {p.compact ? null : <img src={p.cover || p.photo} alt="" />}
                      {p.compact ? (
                        <figcaption>
                          <span className="ms-count-pill">{p.title}</span>
                        </figcaption>
                      ) : (
                        <figcaption>
                          <span className={`ms-tag ${p.status === 'en-proceso' ? 'proceso' : 'finalizada'}`}>{p.status === 'en-proceso' ? 'FINALIZANDO' : 'FINALIZADA'}</span>
                          <div className="ms-title">{p.title}</div>
                          {p.location ? <div className="ms-loc">{p.location}</div> : null}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </div>
              <div className="ms-fade top"></div>
              <div className="ms-fade bottom"></div>
              <div className="ms-overlay">
                <div className="ms-now">
                  <span className="ms-pulse"></span>
                  Obra terminada · <b>{leftCards[0]?.title || 'Casa Las Lomas'}</b>
                </div>
                <div className="ms-count">{Math.max(3, (projects || []).length)} obras entregadas</div>
              </div>
            </div>
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
  const filtered = filter === 'todas' ? projects : projects.filter((p) => p.status === filter);

  const handleObraClick = (project) => {
    window.location.href = `obra.html?id=${project.id}`;
  };

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
              <div className="obra-card" key={p.id} onClick={() => handleObraClick(p)}>
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
    <section id="materiales" className="section-dark">
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
    <section id="tester" className="section-dark">
      <div className="container">
        <div className="section-header">
          <Reveal>
            <div className="kicker">Tecnología CA</div>
            <h2 style={{ marginTop: 18 }}>Probá los materiales en tu obra antes de elegirlos.</h2>
          </Reveal>
          <Reveal className="reveal-up"><p>Elegí una escena, seleccioná un material y visualizá el resultado con IA sobre paredes, pisos o fachada.</p></Reveal>
        </div>
        <Reveal>
          <window.VisualizadorIAWidget apiUrl="" clientId="ca-landing" />
        </Reveal>
      </div>
    </section>
  );
}

// ───────────────────────── Testimonios ─────────────────────────
function Testimonios() {
  const items = useStore('testimonials');
  return (
    <section id="testimonios" className="section-light">
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
    <section id="contacto" className="section-dark">
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
function Footer({ site }) {
  return (
    <footer>
      <div className="container footer-inner">
        <div>
          <BrandMark site={site} />
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

function LoginModal({ onClose, onSuccess }) {
  const [user, setUser] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    
    const result = await loginWithAPI(user, pwd);
    if (result.success) {
      onSuccess();
    } else {
      setErr(result.error || 'Usuario o contraseña incorrectos.');
      setLoading(false);
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
            <input autoFocus value={user} onChange={(e) => { setUser(e.target.value); setErr(''); }} placeholder="Usuario o email" disabled={loading} />
          </div>
          <div>
            <label>Contraseña</label>
            <input type="password" value={pwd} onChange={(e) => { setPwd(e.target.value); setErr(''); }} placeholder="••••" disabled={loading} />
          </div>
          {err && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{err}</div>}
          <button className="btn btn-primary" type="submit" style={{ justifyContent: 'center', padding: '14px' }} disabled={loading}>
            {loading ? 'Verificando…' : 'Ingresar al panel'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ───────────────────────── App ─────────────────────────
function App() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const site = useStore('site');

  useEffect(() => {
    document.body.classList.add('landing-ref');
    return () => document.body.classList.remove('landing-ref');
  }, []);

  return (
    <>
      <Nav onOpenLogin={() => setLoginOpen(true)} site={site} />
      <Hero />
      <Servicios />
      <Obras />
      <TesterSection />
      <Materiales />
      <Testimonios />
      <Marcas />
      <Contacto onSubmitToast={setToast} />
      <Footer site={site} />
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} onSuccess={() => { window.location.href = 'admin.html'; }} />}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
