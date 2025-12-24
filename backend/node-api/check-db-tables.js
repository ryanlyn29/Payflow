/**
 * Check what tables exist in the database
 * 
 * Usage: node check-db-tables.js
 */

const { Pool } = require('pg');
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

async function checkTables() {
  let client;
  try {
    console.log('\n🔍 Checking database tables...\n');
    
    client = await pool.connect();
    
    // Get all tables
    const tablesResult = await client.query(`
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('⚠️  No tables found in the database.\n');
      console.log('Expected tables from migrations:');
      console.log('  - transactions');
      console.log('  - alerts');
      console.log('  - audit_logs');
      console.log('  - batch_jobs');
      console.log('  - users');
      console.log('  - refresh_tokens');
      console.log('  - oauth_accounts');
      console.log('  - sessions\n');
      return;
    }
    
    console.log(`✅ Found ${tablesResult.rows.length} table(s):\n`);
    
    // List all tables
    tablesResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.table_name} (${row.table_type})`);
    });
    
    // Check for expected tables
    console.log('\n📋 Checking for expected tables:\n');
    
    const expectedTables = [
      'transactions',
      'alerts',
      'audit_logs',
      'batch_jobs',
      'users',
      'refresh_tokens',
      'oauth_accounts',
      'sessions'
    ];
    
    const existingTableNames = tablesResult.rows.map(r => r.table_name);
    
    expectedTables.forEach(tableName => {
      if (existingTableNames.includes(tableName)) {
        console.log(`  ✅ ${tableName}`);
      } else {
        console.log(`  ❌ ${tableName} (missing)`);
      }
    });
    
    // Get column information for each table
    console.log('\n📊 Table Details:\n');
    
    for (const row of tablesResult.rows) {
      const columnsResult = await client.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = $1
        ORDER BY ordinal_position
      `, [row.table_name]);
      
      console.log(`📌 ${row.table_name}:`);
      if (columnsResult.rows.length > 0) {
        columnsResult.rows.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          console.log(`   - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
        });
      }
      console.log('');
    }
    
    // Check row counts
    console.log('📈 Row Counts:\n');
    for (const row of tablesResult.rows) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${row.table_name}`);
        console.log(`  ${row.table_name}: ${countResult.rows[0].count} row(s)`);
      } catch (err) {
        console.log(`  ${row.table_name}: (unable to count)`);
      }
    }
    
    console.log('\n✅ Database check complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error checking tables:\n');
    console.error(`  ${error.message}\n`);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

checkTables();

