/**
 * Run database migrations to create all required tables
 * 
 * Usage: node run-migrations.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'paysignal',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  connectionTimeoutMillis: 5000,
};

const pool = new Pool(dbConfig);

async function runMigrations() {
  let client;
  try {
    console.log('\n🚀 Running database migrations...\n');
    console.log(`Database: ${dbConfig.database}`);
    console.log(`Host: ${dbConfig.host}:${dbConfig.port}\n`);
    
    client = await pool.connect();
    
    // Read migration files in order
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = [
      '001_initial_schema.sql',
      '002_auth_schema.sql'
    ];
    
    console.log('📝 Migration files to run:\n');
    migrationFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });
    console.log('');
    
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Run each migration
    for (const migrationFile of migrationFiles) {
      const migrationPath = path.join(migrationsDir, migrationFile);
      
      if (!fs.existsSync(migrationPath)) {
        console.log(`⚠️  Migration file not found: ${migrationFile}`);
        continue;
      }
      
      // Check if already applied
      const checkResult = await client.query(
        'SELECT version FROM schema_migrations WHERE version = $1',
        [migrationFile]
      );
      
      if (checkResult.rows.length > 0) {
        console.log(`⏭️  Skipping ${migrationFile} (already applied)`);
        continue;
      }
      
      console.log(`⏳ Running ${migrationFile}...`);
      
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      // Execute migration
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [migrationFile]
        );
        await client.query('COMMIT');
        console.log(`✅ ${migrationFile} completed successfully\n`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
    
    // Verify tables were created
    console.log('🔍 Verifying tables...\n');
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log(`✅ Created ${tablesResult.rows.length} table(s):\n`);
      tablesResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.table_name}`);
      });
    } else {
      console.log('⚠️  No tables found after migration');
    }
    
    console.log('\n✅ Migrations completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:\n');
    console.error(`  ${error.message}\n`);
    if (error.code) {
      console.error(`  Error code: ${error.code}\n`);
    }
    if (error.position) {
      console.error(`  Position: ${error.position}\n`);
    }
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

runMigrations();

