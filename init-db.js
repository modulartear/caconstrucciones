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
    // Drop old tables if they exist
    await pool.query('DROP TABLE IF EXISTS materials CASCADE');
    await pool.query('DROP TABLE IF EXISTS projects CASCADE');
    await pool.query('DROP TABLE IF EXISTS budgets CASCADE');
    await pool.query('DROP TABLE IF EXISTS clients CASCADE');
    await pool.query('DROP TABLE IF EXISTS testimonials CASCADE');
    await pool.query('DROP TABLE IF EXISTS brands CASCADE');
    console.log('✅ Tablas antiguas eliminadas');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS materials (
        id TEXT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        texture VARCHAR(50),
        color VARCHAR(7),
        accent VARCHAR(7),
        price DECIMAL(10,2),
        unit VARCHAR(20),
        photo TEXT,
        description TEXT,
        stock INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Tabla materials');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        status VARCHAR(20),
        surface INT,
        year INT,
        description TEXT,
        cover TEXT,
        gallery TEXT[],
        progress INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Tabla projects');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        client VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        type VARCHAR(100),
        surface INT,
        message TEXT,
        status VARCHAR(20) DEFAULT 'nuevo',
        date VARCHAR(10),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Tabla budgets');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        project VARCHAR(255),
        since VARCHAR(10),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Tabla clients');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id TEXT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255),
        stars INT DEFAULT 5,
        text TEXT,
        avatar VARCHAR(10),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Tabla testimonials');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id TEXT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Tabla brands');

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
