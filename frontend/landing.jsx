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
    ['#tester', 'Visualizador'],
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
                Probar visualizador
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
            <div className="kicker">Visualizador CA</div>
            <h2 style={{ marginTop: 18 }}>Probá los materiales en tu obra antes de elegirlos.</h2>
          </Reveal>
          <Reveal className="reveal-up"><p>Dentro de esta sección se abre el nuevo visualizador interactivo, en el mismo lugar donde estaba el anterior.</p></Reveal>
        </div>
        <Reveal>
          <div className="tester-embed-shell">
            <iframe
              className="tester-embed-frame"
              src="visualizador-materiales-v2.html"
              title="Visualizador de materiales"
              loading="lazy"
            />
          </div>
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
              <div key={b.id} className="brand-cell">
                {b.logo ? <img className="brand-cell-logo" src={b.logo} alt={b.name} title={b.name} /> : b.name}
              </div>
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

  const submit = async (e) => {
    e.preventDefault();
    if (!form.client.trim() || !form.email.trim()) return;
    setSubmitting(true);
    try {
      const today = new Date();
      const newB = {
        id: window.CAStore.uid('pres'),
        client: form.client || '',
        email: form.email || '',
        phone: form.phone || '',
        type: form.type || 'Obra nueva',
        surface: parseInt(form.surface) || 0,
        message: form.message || '',
        locality: form.locality || '',
        status: 'nuevo',
        date: today.toISOString().slice(0, 10),
        source: 'landing-contacto',
        clientId: null,
        sessionId: null,
        visualizerImage: null,
        visualizerOriginalImage: null,
        visualizerScene: null,
        visualizerTarget: null,
        visualizerMaterialId: null,
        visualizerMaterialName: null,
        visualizerMaterialPhoto: null,
      };
      await window.CAStore.saveItem('budgets', newB);
      setForm({ client: '', email: '', phone: '', type: 'Obra nueva', surface: '', message: '' });
      onSubmitToast('Recibimos tu solicitud. Te contactamos en menos de 24 hs.');
    } catch (err) {
      console.error('Error enviando presupuesto:', err);
      onSubmitToast('Ocurrió un error al enviar. Por favor reintentalo en unos segundos.');
    } finally {
      setSubmitting(false);
    }
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
  const fullLogo = site.logo_full || site.logoFull || null;
  const logoSrc = fullLogo || site.logo || 'assets/ca-logo.png';
  return (
    <footer>
      <div className="container footer-inner">
        <div>
          <a href="#top" className="footer-brand" aria-label="CA Construcciones · inicio">
            <img
              className="footer-logo"
              src={logoSrc}
              alt="CA construcciones · soluciones integrales"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'assets/logo.jpg';
              }}
            />
          </a>
          <div className="footer-credits" style={{ marginTop: 14 }}>
            © {new Date().getFullYear()} CA Construcciones · Todos los derechos reservados
          </div>
          <div className="footer-madeby" style={{ marginTop: 10 }}>
            Hecho con orgullo en Venado Tuerto por{' '}
            <a
              href="http://disearte.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="madeby-link"
              title="DiseArte · Diseño y tecnología"
            >DiseArte</a>
          </div>
        </div>
        <div className="footer-links">
          <a href="#obras">Obras</a>
          <a href="#materiales">Materiales</a>
          <a href="#tester">Visualizador</a>
          <a href="#contacto">Contacto</a>
        </div>
      </div>
    </footer>
  );
}

function WhatsAppButton({ site }) {
  const digits = String(site?.contact?.whatsapp || site?.contact?.phone || '').replace(/\D/g, '');
  if (!digits) return null;

  const message = encodeURIComponent('Hola! Quiero consultar sobre un proyecto con CA Construcciones.');
  return (
    <a
      className="whatsapp-fab"
      href={`https://wa.me/${digits}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      title="Escribinos por WhatsApp"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.47 14.38c-.29-.15-1.7-.84-1.97-.93-.26-.1-.46-.15-.65.15-.2.29-.75.93-.92 1.12-.17.2-.34.22-.63.08-.29-.15-1.22-.45-2.32-1.43-.86-.76-1.44-1.71-1.61-2-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.48.1-.2.05-.36-.02-.51-.08-.15-.65-1.58-.9-2.16-.24-.58-.48-.5-.65-.5-.17 0-.36-.02-.56-.02s-.51.08-.78.36c-.26.29-1.02 1-1.02 2.43 0 1.43 1.04 2.82 1.19 3.01.15.2 2.05 3.13 4.97 4.39.69.3 1.24.48 1.66.61.7.22 1.34.19 1.84.12.56-.08 1.7-.7 1.94-1.37.24-.68.24-1.26.17-1.38-.07-.12-.26-.2-.55-.34z" />
        <path d="M12.02 2C6.5 2 2.02 6.48 2.02 12c0 1.86.51 3.6 1.4 5.1L2 22l5.05-1.33A9.94 9.94 0 0 0 12.02 22c5.52 0 10-4.48 10-10s-4.48-10-10-10zm0 18.13c-1.68 0-3.24-.47-4.57-1.28l-.33-.2-3 .79.8-2.92-.21-.34a8.1 8.1 0 0 1-1.24-4.31c0-4.49 3.65-8.13 8.13-8.13 4.49 0 8.13 3.65 8.13 8.13.02 4.49-3.63 8.26-8.71 8.26z" />
      </svg>
    </a>
  );
}

// ───────────────────────── Lumi · Chatbot CA ─────────────────────────
function buildLumiContext({ site, materials, brands, projects, testimonials }) {
  const parts = [];
  parts.push('== EMPRESA CA CONSTRUCCIONES ==');
  parts.push(`Nombre: CA Construcciones · Soluciones Integrales.`);
  parts.push(`Ubicación: Venado Tuerto, Santa Fe, Argentina.`);
  if (site?.contact?.phone) parts.push(`Teléfono: ${site.contact.phone}.`);
  if (site?.contact?.whatsapp) parts.push(`WhatsApp: ${site.contact.whatsapp}.`);
  if (site?.contact?.email) parts.push(`Email: ${site.contact.email}.`);
  if (site?.contact?.address) parts.push(`Dirección: ${site.contact.address}.`);
  if (site?.hero_title) parts.push(`Propuesta principal: ${site.hero_title}${site.hero_sub ? ' — ' + site.hero_sub : ''}.`);
  if (site?.stats?.length) parts.push(`Stats principales: ${site.stats.map(s => `${s.label}=${s.value}`).join(', ')}.`);
  parts.push('Horarios de atención habitual: Lunes a Viernes de 8 a 18 hs, Sábados de 9 a 13 hs.');
  parts.push('Pedidos de presupuesto: se toman por formulario de Contacto en la pagina y por WhatsApp.');
  parts.push('Visualizador de materiales: disponible en la seccion Visualizador / Probador para probar texturas en paredes y pisos.');

  parts.push('\n== SERVICIOS PRINCIPALES ==');
  parts.push('Construccion integral, remodelaciones, obras nuevas, revestimientos, pisos, sanitarios, griferias, pintura, iluminacion, asesoramiento de diseño, presupuesto a medida.');

  if (Array.isArray(brands) && brands.length) {
    parts.push('\n== MARCAS TRABAJADAS ==');
    parts.push(brands.slice(0, 40).map(b => `• ${b.name || b.id}`).join(', '));
  }

  if (Array.isArray(materials) && materials.length) {
    parts.push('\n== MATERIALES EN CATALOGO ==');
    parts.push(`Total: ${materials.length} materiales.`);
    const cats = [...new Set(materials.map(m => m.category).filter(Boolean))];
    if (cats.length) parts.push(`Categorias: ${cats.join(', ')}.`);
    parts.push('Listado (resumido):');
    materials.slice(0, 80).forEach(m => {
      const brand = m.brand
        ? (brands?.find(b => b.id === m.brand)?.name || '')
        : '';
      parts.push(`- ${m.name}${m.category ? ' [' + m.category + ']' : ''}${brand ? ' (' + brand + ')' : ''}${m.price ? ' $' + m.price + '/' + (m.unit || 'u') : ''}${m.stock != null ? ' stock=' + m.stock : ''}`);
    });
  }

  if (Array.isArray(projects) && projects.length) {
    parts.push('\n== OBRAS / PROYECTOS DESTACADOS ==');
    projects.slice(0, 30).forEach(p => {
      parts.push(`• ${p.title || p.name}${p.category ? ' [' + p.category + ']' : ''}${p.location || p.locality ? ' en ' + (p.location || p.locality) : ''}${p.description ? ' - ' + String(p.description).slice(0, 120) : ''}`);
    });
  }

  if (Array.isArray(testimonials) && testimonials.length) {
    parts.push('\n== TESTIMONIOS DE CLIENTES ==');
    testimonials.slice(0, 12).forEach(t => {
      parts.push(`- ${t.name || t.author || 'Cliente'}: ${String(t.quote || t.message || t.text || '').slice(0, 160)}`);
    });
  }

  parts.push('\n== PREGUNTAS FRECUENTES ==');
  parts.push('¿Hacen envios? Si, a Venado Tuerto y zona. Coordinar por WhatsApp.');
  parts.push('¿Aceptan tarjeta / transferencia? Consultar condiciones al contacto oficial.');
  parts.push('¿Tienen local? Si, la direccion figura en la seccion Contacto.');

  return parts.join('\n');
}

function fallbackLumiAnswer(question, { site, materials, brands, projects }) {
  const q = String(question || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (/^(hola|buen|hey|hi|que tal|holis|buenos dias|buenas tardes|buenas noches)/.test(q)) {
    return '¡Hola! Soy Lumi, la asistente de CA Construcciones. ¿En qué te puedo ayudar hoy? Podés consultarme por materiales, obras, presupuestos, horarios o el visualizador, o pasarte directamente al WhatsApp oficial 😊.';
  }
  if (/(quien eres|que eres|quien sos|que hace|tu nombre|presentate)/.test(q)) {
    return 'Soy **Lumi**, la asistente virtual de CA Construcciones (Venado Tuerto, Santa Fe). Manejo la información del sitio: catálogo de materiales, obras realizadas, marcas, contacto y pedidos de presupuesto.';
  }
  if (/(horario|atencion|cuando|abierto|abren|atencios|que horas)/.test(q)) {
    return 'Atendemos de **Lunes a Viernes de 8 a 18 hs** y los **Sábados de 9 a 13 hs**. Coordiná tu visita o consulta por WhatsApp para evitar esperas 🙌.';
  }
  if (/(ubicacion|donde|direccion|local|venado|sucursal|lugar|esta ubicad)/.test(q)) {
    const address = site?.contact?.address;
    return address
      ? `Estamos en **${address}**, Venado Tuerto (Santa Fe). ¡Te esperamos!`
      : 'Somos de **Venado Tuerto, Santa Fe, Argentina**. Pasá por la sección Contacto para ver la dirección exacta, o escribinos por WhatsApp y te la pasamos al toque.';
  }
  if (/(whatsapp|wsp|telefono|llamar|llamada|tel|contacto|hablar|comunic|chatear|numero)/.test(q)) {
    const c = site?.contact || {};
    const wa = c.whatsapp || c.phone;
    if (!wa) return 'Encontranos en la sección **#contacto** de la página, ahí tenemos el teléfono, WhatsApp, email y dirección.';
    return `Podés escribirnos por WhatsApp al **${wa}** (es el canal más rápido) o llamar al ${c.phone || wa}. También dejamos tu mensaje en el formulario de Contacto y te respondemos al toque.`;
  }
  if (/(email|mail|correo|e-mail)/.test(q)) {
    const email = site?.contact?.email;
    return email
      ? `Nuestro email de contacto es **${email}**. Para presupuestos, igual te recomendamos el formulario o WhatsApp.`
      : 'Para consultas por email usá el formulario de **Contacto** de la página, y el equipo te responde directamente por el correo que registraste.';
  }
  if (/(material|categoria|que venden|catálogo|catalogo|producto|maderera|revest|piso|pintura|sanitario|griferia|cielo)/.test(q)) {
    const cats = [...new Set((materials || []).map(m => m.category).filter(Boolean))];
    const total = (materials || []).length;
    let msg = `Tenemos **${total || 'varios'} materiales** en catálogo. `;
    if (cats.length) msg += `Categorías actuales: **${cats.join(' · ')}**. `;
    msg += 'Si querés sugerencias de materiales para un ambiente en particular decime cual (ej: "revestimiento de pared living") y te ayudo a elegir.';
    return msg;
  }
  if (/(obra|proyecto|trabajo|hacen|realizan|remodel|constru|construccion)/.test(q)) {
    const total = (projects || []).length;
    return `Hacemos **construcción integral, obras nuevas y remodelaciones** completas (baños, cocina, ambientes). ${total ? `Ya contamos con ${total} obras documentadas en el portfolio (sección Obras). ` : ''}Pedinos presupuesto por el formulario de Contacto y pasamos a medir sin costo en Venado Tuerto y zona.`;
  }
  if (/(presupuesto|precio|cuanto sale|cuanto cuesta|valor|presupuest|cotiz|costo)/.test(q)) {
    return 'Los presupuestos son **personalizados según metros, materiales y complejidad**. Pedilos de 3 maneras: 1) Formulario **Contacto** de la página 2) WhatsApp oficial 3) Acercándote al local. Siempre pedimos fotos o visita para ser precisos ✅.';
  }
  if (/(visualizador|probador|tester|como se ve|aplicar|material en la pared|pared|muestra|ver material)/.test(q)) {
    return 'Tenés el **Visualizador de materiales** integrado en la página (sección Probador / Visualizador). Elegí la escena que más se parezca a tu ambiente y cambiá pisos, paredes, pinturas y texturas en tiempo real. Podés pedir presupuesto directo desde el formulario con los materiales que probaste.';
  }
  if (/(marca|trabajan con|proveedor|quienes|alianza)/.test(q)) {
    const total = (brands || []).length;
    const names = (brands || []).slice(0, 14).map(b => b.name).filter(Boolean).join(', ');
    if (!total) return 'Trabajamos con marcas líderes del rubro. La lista se actualiza en la sección **Marcas** del sitio.';
    return `Trabajamos con **${total} marcas** oficiales. Algunas: **${names}**. La lista completa y sus logos la tenés en la sección Marcas del sitio.`;
  }
  if (/(gracias|genial|perfecto|ok|chau|chao|bye|nos vemos|nada mas|no mas|no necesito)/.test(q)) {
    return '¡De nada! Cualquier otra consulta acá estoy, o escribinos directo por WhatsApp — el equipo responde en el día. ¡Éxitos con tu proyecto! 👋';
  }
  return null;
}

async function askLumiAPI(question, context) {
  try {
    const res = await fetch('/api/lumi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, context }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.status === 501 || json.fallback) {
      return { fallback: true, response: null };
    }
    if (!res.ok) {
      return { fallback: true, error: json.error || `Error ${res.status}` };
    }
    return { fallback: false, response: json.response || null };
  } catch (e) {
    return { fallback: true, error: e.message };
  }
}

function LumiChat({ site }) {
  const materials = useStore('materials');
  const projects = useStore('projects');
  const brands = useStore('brands');
  const testimonials = useStore('testimonials');

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState(() => {
    const hello = [
      {
        id: 'm0',
        role: 'bot',
        html: `¡Hola! Soy <b>Lumi</b> ✨, la asistente de <b>CA Construcciones</b>. Consultame por materiales, obras, presupuestos, horarios o usá el visualizador. ¡También te paso el WhatsApp de inmediato!`,
      },
    ];
    try {
      const raw = localStorage.getItem('lumi-msgs-v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return hello;
  });

  const scrollRef = useRef(null);
  useEffect(() => {
    try { localStorage.setItem('lumi-msgs-v1', JSON.stringify(messages.slice(-80))); } catch (_) {}
  }, [messages]);
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing, open]);

  const addMsg = (role, text, opts = {}) => {
    setMessages((m) => [...m, { id: 'm' + Math.random().toString(36).slice(2, 9), role, text, html: opts.html ?? null, ...(opts.meta ? { meta: opts.meta } : {}) }]);
  };

  const send = async (rawText) => {
    const text = String(rawText || input || '').trim();
    if (!text) return;
    setInput('');
    addMsg('user', text);
    setTyping(true);

    const context = buildLumiContext({ site, materials, brands, projects, testimonials });

    let final = null;
    let meta = null;

    const local = fallbackLumiAnswer(text, { site, materials, brands, projects });
    if (local) {
      final = local;
      meta = { engine: 'local' };
    } else {
      const { response, fallback, error } = await askLumiAPI(text, context);
      if (fallback || !response) {
        final = error && !/^(hola|buen)/.test(text.toLowerCase())
          ? 'Mmm, no tengo esa información exacta en el sitio. Pasate por **#contacto** o escribinos por WhatsApp y el equipo te responde al toque con todo detalle.'
          : 'Consultame sobre materiales, obras, presupuestos, horarios, marcas o contactos, que tengo toda la info de CA Construcciones lista para ayudarte.';
        meta = { engine: 'local-fallback' };
      } else {
        final = response;
        meta = { engine: 'ai' };
      }
    }

    setTyping(false);
    if (final) addMsg('bot', final, { meta });
  };

  const quick = [
    { label: '¿Qué materiales tienen?', text: 'Que materiales tienen y en que categorias' },
    { label: 'Horarios', text: 'Cuales son los horarios de atencion' },
    { label: 'Ubicación', text: 'Donde estan ubicados' },
    { label: 'Presupuesto', text: 'Como pido un presupuesto para mi obra' },
  ];

  return (
    <>
      <button
        type="button"
        className={`lumi-fab ${open ? 'is-open' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-label="Abrir Lumi asistente CA"
        title="Lumi · Asistente CA Construcciones"
      >
        {open ? (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a4 4 0 0 1 4 4v1a6 6 0 0 1 4 5.92V14a1 1 0 0 1-1 1h-1a3 3 0 0 1-6 0H7a1 1 0 0 1-1-1v-1.08A6 6 0 0 1 9 7V6a4 4 0 0 1 3-3.87"/>
            <circle cx="10" cy="8" r="1.1" fill="currentColor" stroke="none"/>
            <circle cx="14" cy="8" r="1.1" fill="currentColor" stroke="none"/>
            <path d="M9.5 11c.8 1 1.6 1.4 2.5 1.4S13.7 12 14.5 11" fill="none"/>
            <path d="M7 21h10M9 17v4M15 17v4"/>
          </svg>
        )}
        {!open && <span className="lumi-fab-pulse" aria-hidden="true" />}
      </button>

      <div className={`lumi-modal ${open ? 'is-open' : ''}`} role="dialog" aria-label="Lumi · Asistente virtual">
        <div className="lumi-head">
          <div className="lumi-head-brand">
            <div className="lumi-avatar" aria-hidden="true">
              <span>L</span>
            </div>
            <div>
              <div className="lumi-title">Lumi · Asistente CA</div>
              <div className="lumi-sub">Resp. en el día · Info de la página</div>
            </div>
          </div>
          <button type="button" className="lumi-close" onClick={() => setOpen(false)} aria-label="Cerrar chat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="lumi-msgs" ref={scrollRef}>
          {messages.map((m) => (
            <div key={m.id} className={`lumi-msg lumi-${m.role}`}>
              <div className="lumi-bubble" dangerouslySetInnerHTML={{ __html: m.html ?? escapeHtml(m.text || '') }} />
              {m.meta?.engine === 'ai' && <div className="lumi-meta">· IA con contexto del sitio</div>}
              {m.meta?.engine?.startsWith('local') && <div className="lumi-meta">· Respuesta rápida</div>}
            </div>
          ))}
          {typing && (
            <div className="lumi-msg lumi-bot">
              <div className="lumi-bubble lumi-typing">
                <span/><span/><span/>
              </div>
            </div>
          )}
        </div>

        <div className="lumi-quick">
          {quick.map((q) => (
            <button
              key={q.label}
              type="button"
              className="lumi-chip"
              onClick={() => send(q.text)}
            >{q.label}</button>
          ))}
        </div>

        <form
          className="lumi-input"
          onSubmit={(e) => { e.preventDefault(); send(); }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Preguntá a Lumi sobre materiales, obras, presupuestos…"
            aria-label="Pregunta para Lumi"
            disabled={typing}
          />
          <button type="submit" className="lumi-send" aria-label="Enviar pregunta" disabled={typing || !input.trim()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
      </div>
    </>
  );
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
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
      <WhatsAppButton site={site} />
      <LumiChat site={site} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
