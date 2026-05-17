// CA Construcciones — Página de detalle de obra
// Depende de: store.js

const { useState, useEffect, useRef } = React;

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

function BrandMark({ size = 38, site }) {
  return (
    <a href="index.html" className="brand">
      <div className="brand-mark" style={{ width: size, height: size }}>
        <img src={site.logo || "assets/logo.jpg"} alt="CA Construcciones" />
      </div>
      <div className="brand-text">
        <span className="top">CA Construcciones</span>
        <span className="sub">Soluciones integrales</span>
      </div>
    </a>
  );
}

function Nav({ site }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const links = [
    ['index.html#nosotros', 'Nosotros'],
    ['index.html#obras', 'Obras'],
    ['index.html#tester', 'Probador IA'],
    ['index.html#materiales', 'Materiales'],
    ['index.html#testimonios', 'Clientes'],
    ['index.html#contacto', 'Contacto'],
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
            <a className="btn btn-sm btn-ghost" href="admin.html">Admin</a>
            <a className="btn btn-sm btn-primary" href="index.html#contacto">Pedir presupuesto</a>
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
        <a href="index.html#contacto" className="btn btn-primary" style={{ marginTop: 24, justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>Pedir presupuesto</a>
      </div>
    </>
  );
}

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
          <a href="index.html#obras">Obras</a>
          <a href="index.html#materiales">Materiales</a>
          <a href="index.html#tester">Probador IA</a>
          <a href="index.html#contacto">Contacto</a>
        </div>
      </div>
    </footer>
  );
}

function ObraDetail() {
  const site = useStore('site');
  const projects = useStore('projects');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const params = new URLSearchParams(window.location.search);
  const projectId = params.get('id');
  const project = projects.find(p => p.id === projectId);

  if (!project) {
    return (
      <>
        <Nav site={site} />
        <section style={{ padding: '200px 0', textAlign: 'center' }}>
          <div className="container">
            <h2 style={{ marginBottom: 16 }}>Obra no encontrada</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 32 }}>La obra que buscas no existe o ha sido eliminada.</p>
            <a href="index.html#obras" className="btn btn-primary">← Volver a obras</a>
          </div>
        </section>
        <Footer site={site} />
      </>
    );
  }

  const allPhotos = [project.cover, ...(project.gallery || [])].filter(Boolean);

  return (
    <>
      <Nav site={site} />

      <section style={{ paddingTop: 140, paddingBottom: 80 }}>
        <div className="container">
          <Reveal>
            <a href="index.html#obras" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--muted)', marginBottom: 24, fontSize: 14 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Volver a obras
            </a>
          </Reveal>

          <Reveal>
            <span className={`obra-status ${project.status === 'en-proceso' ? 'proceso' : 'finalizada'}`} style={{ position: 'static', marginBottom: 16, display: 'inline-flex' }}>
              {project.status === 'en-proceso' ? 'En proceso' : 'Finalizada'}
            </span>
            <h1 style={{ fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 1, marginBottom: 16 }}>{project.title}</h1>
            <p className="sub" style={{ marginBottom: 32, fontSize: 18 }}>{project.location} · {project.surface} m² · {project.year}</p>
          </Reveal>

          <Reveal className="reveal-up obra-detail-cover" style={{ marginBottom: 32 }}>
            <img src={project.cover} alt={project.title} style={{ width: '100%', height: 480, objectFit: 'cover', borderRadius: 20 }} />
          </Reveal>

          {allPhotos.length > 1 && (
            <Reveal className="obra-detail-gallery" style={{ marginBottom: 48 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {allPhotos.slice(1).map((photo, i) => (
                  <img
                    key={i}
                    src={photo}
                    alt={`Foto ${i + 2}`}
                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 14, cursor: 'pointer' }}
                    onClick={() => setSelectedPhoto(photo)}
                  />
                ))}
              </div>
            </Reveal>
          )}

          <Reveal className="obra-detail-content">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 60, alignItems: 'start' }}>
              <style dangerouslySetInnerHTML={{__html: `
                @media (max-width: 980px) {
                  .obra-detail-content > div {
                    grid-template-columns: 1fr !important;
                  }
                }
              `}} />

              <div>
                <h3 style={{ marginBottom: 16 }}>Descripción</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.8, fontSize: 16 }}>{project.description}</p>
              </div>
              <div>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                  <h4 style={{ marginBottom: 16 }}>Datos de la obra</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted)' }}>Ubicación</span>
                      <span>{project.location}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted)' }}>Superficie</span>
                      <span>{project.surface} m²</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted)' }}>Año</span>
                      <span>{project.year}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted)' }}>Estado</span>
                      <span>{project.status === 'en-proceso' ? 'En proceso' : 'Finalizada'}</span>
                    </div>
                    {project.status === 'en-proceso' && typeof project.progress === 'number' && (
                      <div style={{ marginTop: 12 }}>
                        <div className="label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
                          <span>Avance de obra</span><span>{project.progress}%</span>
                        </div>
                        <div className="obra-progress-bar" style={{ height: 6, background: 'var(--bg)', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ width: project.progress + '%', height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent-2))', borderRadius: 999 }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <a href="index.html#contacto" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 24 }}>
                    Solicitar presupuesto
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {selectedPhoto && (
        <div className="modal-backdrop" onClick={() => setSelectedPhoto(null)}>
          <div className="modal lg" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 1000, padding: 12, background: 'transparent', border: 'none', boxShadow: 'none' }}>
            <button className="modal-close" onClick={() => setSelectedPhoto(null)} style={{ position: 'absolute', top: -40, right: 0, color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <img src={selectedPhoto} alt="Ampliación" style={{ width: '100%', borderRadius: 16, display: 'block' }} />
          </div>
        </div>
      )}

      <Footer site={site} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ObraDetail />);
