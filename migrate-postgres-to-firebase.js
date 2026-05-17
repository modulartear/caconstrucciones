import admin from 'firebase-admin';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const { Pool } = pg;

// Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

// PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('🔄 Migrando datos de PostgreSQL → Firestore...\n');

  try {
    // Migrate materials
    console.log('📦 Materiales...');
    const materialsResult = await pool.query('SELECT * FROM materials');
    for (const mat of materialsResult.rows) {
      await db.collection('materials').doc(mat.id).set({
        id: mat.id,
        name: mat.name,
        category: mat.category,
        texture: mat.texture,
        color: mat.color,
        accent: mat.accent,
        price: parseFloat(mat.price),
        unit: mat.unit,
        photo: mat.photo,
        description: mat.description,
        stock: mat.stock || 0,
        created_at: new Date()
      });
    }
    console.log(`   ✅ ${materialsResult.rows.length} materiales migrados`);

    // Migrate projects
    console.log('🏗️ Proyectos...');
    const projectsResult = await pool.query('SELECT * FROM projects');
    for (const proj of projectsResult.rows) {
      await db.collection('projects').doc(proj.id).set({
        id: proj.id,
        title: proj.title,
        location: proj.location,
        status: proj.status,
        surface: proj.surface,
        year: proj.year,
        description: proj.description,
        cover: proj.cover,
        gallery: proj.gallery || [],
        progress: proj.progress || 0,
        created_at: new Date()
      });
    }
    console.log(`   ✅ ${projectsResult.rows.length} proyectos migrados`);

    // Migrate budgets
    console.log('💰 Presupuestos...');
    const budgetsResult = await pool.query('SELECT * FROM budgets');
    for (const bud of budgetsResult.rows) {
      await db.collection('budgets').doc(bud.id).set({
        id: bud.id,
        client: bud.client,
        email: bud.email,
        phone: bud.phone,
        type: bud.type,
        surface: bud.surface,
        message: bud.message,
        status: bud.status || 'nuevo',
        date: bud.date,
        created_at: new Date()
      });
    }
    console.log(`   ✅ ${budgetsResult.rows.length} presupuestos migrados`);

    // Migrate clients
    console.log('👥 Clientes...');
    const clientsResult = await pool.query('SELECT * FROM clients');
    for (const client of clientsResult.rows) {
      await db.collection('clients').doc(client.id).set({
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        project: client.project,
        since: client.since,
        created_at: new Date()
      });
    }
    console.log(`   ✅ ${clientsResult.rows.length} clientes migrados`);

    // Migrate testimonials
    console.log('⭐ Testimonios...');
    const testimonialsResult = await pool.query('SELECT * FROM testimonials');
    for (const test of testimonialsResult.rows) {
      await db.collection('testimonials').doc(test.id).set({
        id: test.id,
        name: test.name,
        role: test.role,
        stars: test.stars,
        text: test.text,
        avatar: test.avatar,
        created_at: new Date()
      });
    }
    console.log(`   ✅ ${testimonialsResult.rows.length} testimonios migrados`);

    // Migrate brands
    console.log('🏢 Marcas...');
    const brandsResult = await pool.query('SELECT * FROM brands');
    for (const brand of brandsResult.rows) {
      await db.collection('brands').doc(brand.id).set({
        id: brand.id,
        name: brand.name,
        created_at: new Date()
      });
    }
    console.log(`   ✅ ${brandsResult.rows.length} marcas migradas`);

    // Migrate site config (single document)
    console.log('⚙️  Configuración del sitio...');
    await db.collection('site').doc('config').set({
      hero_kicker: 'Soluciones integrales en construcción',
      hero_title: 'Construimos lugares\nque importan.',
      hero_sub: 'Más de 15 años desarrollando obras residenciales, comerciales y refacciones premium en Argentina. Diseño, ingeniería y ejecución bajo un mismo equipo.',
      stats: [
        { value: '180+', label: 'Obras entregadas' },
        { value: '15', label: 'Años de trayectoria' },
        { value: '42k', label: 'm² construidos' },
        { value: '98%', label: 'Clientes recomiendan' },
      ],
      contact: {
        phone: '+54 11 5555-0142',
        email: 'hola@caconstrucciones.ar',
        address: 'Av. del Libertador 5402, CABA'
      },
      created_at: new Date()
    });
    console.log('   ✅ Configuración migrada');

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
