import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const data = {
  materials: [
    { id: 'm1', name: 'Porcelanato Calacatta', category: 'Pisos', color: '#e8e4dd', accent: '#9aa0a8', price: 28900, unit: 'm²', description: 'Porcelanato rectificado símil mármol Calacatta, acabado pulido brillante. Resistente a manchas y al desgaste.', stock: 480, photo: null, texture: 'marble' },
    { id: 'm2', name: 'Microcemento Urban Grey', category: 'Revestimientos', color: '#7e7d78', accent: '#4a4a47', price: 18500, unit: 'm²', description: 'Microcemento decorativo de alta resistencia, ideal para pisos y paredes. Acabado mate aterciopelado.', stock: 240, photo: null, texture: 'cement' },
    { id: 'm3', name: 'Roble Natural Premium', category: 'Maderas', color: '#a87a4d', accent: '#5a3f24', price: 34200, unit: 'm²', description: 'Lamas de roble europeo con tratamiento UV. Vetas naturales, premium para living y dormitorios.', stock: 160, photo: null, texture: 'wood' },
    { id: 'm4', name: 'Ladrillo Visto Patagónico', category: 'Revestimientos', color: '#9c4a3a', accent: '#5a221a', price: 12400, unit: 'm²', description: 'Ladrillo artesanal cocido a 1100°C. Textura rústica con variaciones de color naturales.', stock: 800, photo: null, texture: 'brick' },
    { id: 'm5', name: 'Pintura Blanco Lino', category: 'Pinturas', color: '#f3ede1', accent: '#d8cfba', price: 9800, unit: 'L', description: 'Látex premium acabado mate. Lavable, alta cubrición, libre de COV.', stock: 95, photo: null, texture: 'paint' },
    { id: 'm6', name: 'Pintura Verde Salvia', category: 'Pinturas', color: '#7d8b6e', accent: '#4d5a40', price: 9800, unit: 'L', description: 'Verde profundo con base mineral. Tendencia 2026, ideal para espacios cálidos.', stock: 60, photo: null, texture: 'paint' },
    { id: 'm7', name: 'Travertino Romano', category: 'Pisos', color: '#cbb89a', accent: '#8e7958', price: 41200, unit: 'm²', description: 'Piedra natural travertino, acabado pulido. Tonos crema con vetas orgánicas.', stock: 120, photo: null, texture: 'stone' },
    { id: 'm8', name: 'Pintura Terracota', category: 'Pinturas', color: '#b8674a', accent: '#7a3f29', price: 10400, unit: 'L', description: 'Tono cálido inspirado en el barro mediterráneo. Acabado satinado.', stock: 48, photo: null, texture: 'paint' },
  ],
  projects: [
    { id: 'p1', title: 'Casa Las Lomas', location: 'Pilar, Buenos Aires', status: 'finalizada', surface: 380, year: 2025, description: 'Vivienda unifamiliar de 380 m² con pileta y quincho. Diseño contemporáneo con paleta neutra y maderas naturales.', cover: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80', gallery: ['https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80'], progress: 0 },
    { id: 'p2', title: 'Edificio Mirador', location: 'Núñez, CABA', status: 'en-proceso', surface: 2400, year: 2026, description: 'Edificio de 12 pisos con 36 unidades. Estructura sismorresistente y certificación energética A.', progress: 62, cover: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=80', gallery: [] },
    { id: 'p3', title: 'Loft Industrial Palermo', location: 'Palermo, CABA', status: 'finalizada', surface: 145, year: 2025, description: 'Reciclaje integral de loft industrial. Ladrillo visto, hierro y maderas recuperadas.', cover: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80', gallery: [], progress: 0 },
    { id: 'p4', title: 'Showroom Tienda M', location: 'Recoleta, CABA', status: 'en-proceso', surface: 220, year: 2026, description: 'Showroom comercial con microcemento, iluminación arquitectónica y mobiliario a medida.', progress: 38, cover: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&q=80', gallery: [] },
    { id: 'p5', title: 'Quinta El Retiro', location: 'Cardales, Buenos Aires', status: 'finalizada', surface: 540, year: 2024, description: 'Casa de campo con piedra, madera y grandes ventanales. Integración con el paisaje.', cover: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80', gallery: [], progress: 0 },
    { id: 'p6', title: 'Refacción Casa Belgrano', location: 'Belgrano, CABA', status: 'en-proceso', surface: 280, year: 2026, description: 'Ampliación y refacción integral. Nueva planta alta y reorganización funcional.', progress: 18, cover: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80', gallery: [] },
  ],
  budgets: [
    { id: 'pres1', client: 'Carlos Ibáñez', email: 'cibanez@mail.com', phone: '11-5432-1099', type: 'Refacción integral', surface: 120, message: 'Necesito refaccionar cocina y dos baños. Tengo planos hechos.', status: 'nuevo', date: '2026-05-12' },
    { id: 'pres2', client: 'Andrea Soler', email: 'a.soler@mail.com', phone: '11-6677-1234', type: 'Obra nueva', surface: 240, message: 'Vivienda unifamiliar en lote de 600 m². Estilo contemporáneo.', status: 'contactado', date: '2026-05-09' },
    { id: 'pres3', client: 'Estudio Lince', email: 'contacto@lince.ar', phone: '11-2233-9988', type: 'Local comercial', surface: 90, message: 'Reforma de local sobre Av. Santa Fe. Plazo ajustado.', status: 'cotizado', date: '2026-05-04' },
  ],
  clients: [
    { id: 'c1', name: 'María Fernández', email: 'mfernandez@mail.com', phone: '11-4455-2211', project: 'Casa Las Lomas', since: '2024-03-12' },
    { id: 'c2', name: 'Estudio Rossi+Asoc.', email: 'jrossi@rossi.ar', phone: '11-5566-7788', project: 'Múltiples obras', since: '2023-08-01' },
    { id: 'c3', name: 'Lucía Méndez', email: 'lmendez@mail.com', phone: '11-9988-3322', project: 'Loft Palermo', since: '2024-11-04' },
    { id: 'c4', name: 'Grupo Inversor Aurea', email: 'gi@aurea.com.ar', phone: '11-7766-1100', project: 'Edificio Mirador', since: '2024-01-22' },
  ],
  testimonials: [
    { id: 't1', name: 'María Fernández', role: 'Propietaria — Casa Las Lomas', stars: 5, text: 'Trabajamos casi un año con el equipo de CA Construcciones y la experiencia superó todas las expectativas. Profesionales, puntuales y con un nivel de detalle excepcional.', avatar: 'MF' },
    { id: 't2', name: 'Arq. Javier Rossi', role: 'Estudio Rossi+Asoc.', stars: 5, text: 'Mi estudio derivó tres obras a CA en los últimos dos años. Cumplen plazos, presupuesto y la terminación es de primera línea. Mi constructora de confianza.', avatar: 'JR' },
    { id: 't3', name: 'Lucía Méndez', role: 'Loft Palermo', stars: 5, text: 'Reciclaron un galpón industrial y lo transformaron en mi casa soñada. Cada decisión fue consensuada y la calidad del trabajo es impecable.', avatar: 'LM' },
    { id: 't4', name: 'Grupo Inversor Aurea', role: 'Edificio Mirador', stars: 5, text: 'Como desarrolladores valoramos la transparencia financiera y técnica de CA. Reportes semanales, plazos cumplidos y cero sobrecostos imprevistos.', avatar: 'GA' },
  ],
  brands: [
    { id: 'b1', name: 'Loma Negra' },
    { id: 'b2', name: 'Acindar' },
    { id: 'b3', name: 'Alba' },
    { id: 'b4', name: 'Cerro Negro' },
    { id: 'b5', name: 'FV Grifería' },
    { id: 'b6', name: 'Roca' },
    { id: 'b7', name: 'Weber' },
    { id: 'b8', name: 'Sika' },
  ],
};

async function migrate() {
  console.log('🔄 Migrando datos a BD...\n');

  try {
    // Clear existing data
    await pool.query('DELETE FROM materials');
    await pool.query('DELETE FROM projects');
    await pool.query('DELETE FROM budgets');
    await pool.query('DELETE FROM clients');
    await pool.query('DELETE FROM testimonials');
    await pool.query('DELETE FROM brands');
    console.log('✅ Tablas limpiadas');

    // Migrate materials
    for (const m of data.materials) {
      await pool.query(
        `INSERT INTO materials (id, name, category, texture, color, accent, price, unit, description, stock, photo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [m.id, m.name, m.category, m.texture, m.color, m.accent, m.price, m.unit, m.description, m.stock, m.photo]
      );
    }
    console.log(`✅ ${data.materials.length} materiales migrados`);

    // Migrate projects
    for (const p of data.projects) {
      await pool.query(
        `INSERT INTO projects (id, title, location, status, surface, year, description, cover, gallery, progress)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [p.id, p.title, p.location, p.status, p.surface, p.year, p.description, p.cover, p.gallery || [], p.progress || 0]
      );
    }
    console.log(`✅ ${data.projects.length} proyectos migrados`);

    // Migrate budgets
    for (const b of data.budgets) {
      await pool.query(
        `INSERT INTO budgets (id, client, email, phone, type, surface, message, status, date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [b.id, b.client, b.email, b.phone, b.type, b.surface, b.message, b.status, b.date]
      );
    }
    console.log(`✅ ${data.budgets.length} presupuestos migrados`);

    // Migrate clients
    for (const c of data.clients) {
      await pool.query(
        `INSERT INTO clients (id, name, email, phone, project, since)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [c.id, c.name, c.email, c.phone, c.project, c.since]
      );
    }
    console.log(`✅ ${data.clients.length} clientes migrados`);

    // Migrate testimonials
    for (const t of data.testimonials) {
      await pool.query(
        `INSERT INTO testimonials (id, name, role, stars, text, avatar)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [t.id, t.name, t.role, t.stars, t.text, t.avatar]
      );
    }
    console.log(`✅ ${data.testimonials.length} testimonios migrados`);

    // Migrate brands
    for (const b of data.brands) {
      await pool.query(
        `INSERT INTO brands (id, name)
         VALUES ($1, $2)`,
        [b.id, b.name]
      );
    }
    console.log(`✅ ${data.brands.length} marcas migradas`);

    console.log('\n🎉 Migración completada!\n');
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
