/**
 * Verify database schema has all necessary columns
 */

const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'paysignal',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
};

const pool = new Pool(dbConfig);

async function verifySchema() {
  let client;
  try {
    console.log('\n🔍 Verifying database schema...\n');
    client = await pool.connect();
    
    // Check users table columns
    const usersCols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('Users table columns:');
    usersCols.rows.forEach(col => {
      console.log(`  ✅ ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    // Required columns for users
    const requiredUserCols = ['id', 'email', 'name', 'role', 'password_hash', 'preferences', 'created_at', 'updated_at', 'email_verified'];
    const existingUserCols = usersCols.rows.map(r => r.column_name);
    const missingUserCols = requiredUserCols.filter(col => !existingUserCols.includes(col));
    
    if (missingUserCols.length > 0) {
      console.log(`\n⚠️  Missing columns in users table: ${missingUserCols.join(', ')}`);
    } else {
      console.log('\n✅ All required user columns exist');
    }
    
    // Check all tables exist
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`\n📊 Total tables: ${tables.rows.length}`);
    tables.rows.forEach(t => console.log(`  - ${t.table_name}`));
    
    console.log('\n✅ Schema verification complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

verifySchema();

