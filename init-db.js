import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function init() {
  console.log('🔄 Inicializando BD...\n');

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS materials (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        texture VARCHAR(50),
        color VARCHAR(7),
        accent VARCHAR(7),
        price DECIMAL(10,2),
        unit VARCHAR(20),
        photo TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Tabla materials');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Tabla contacts');

    const materials = [
      { name: 'Mármol Blanco Carrara', category: 'Revestimientos', texture: 'marble', color: '#FFFFFF', accent: '#CCCCCC', price: 850, unit: 'm²' },
      { name: 'Ladrillo Visto', category: 'Revestimientos', texture: 'brick', color: '#C41E3A', accent: '#8B0000', price: 180, unit: 'm²' },
      { name: 'Cemento Alisado', category: 'Pisos', texture: 'cement', color: '#8B8680', accent: '#696969', price: 350, unit: 'm²' },
      { name: 'Travertino Crema', category: 'Revestimientos', texture: 'stone', color: '#D2B48C', accent: '#A0826D', price: 620, unit: 'm²' },
      { name: 'Pintura Acrílica Blanca', category: 'Pintura', texture: 'paint', color: '#F8F8F8', accent: '#E8E8E8', price: 45, unit: 'L' }
    ];

    for (const mat of materials) {
      await pool.query(
        `INSERT INTO materials (name, category, texture, color, accent, price, unit)
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
        [mat.name, mat.category, mat.texture, mat.color, mat.accent, mat.price, mat.unit]
      );
    }
    console.log('✅ 5 materiales agregados');
    console.log('\n🎉 BD lista!\n');
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

init();
