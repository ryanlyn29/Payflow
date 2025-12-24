/**
 * Find all tables in the database (all schemas)
 * 
 * Usage: node find-db-tables.js
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

async function findTables() {
  let client;
  try {
    console.log('\n🔍 Searching for tables in database...\n');
    console.log(`Database: ${dbConfig.database}`);
    console.log(`Host: ${dbConfig.host}:${dbConfig.port}\n`);
    
    client = await pool.connect();
    
    // Get all schemas
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `);
    
    console.log(`📁 Found ${schemasResult.rows.length} schema(s):\n`);
    schemasResult.rows.forEach(row => {
      console.log(`  - ${row.schema_name}`);
    });
    console.log('');
    
    // Get all tables from all schemas
    const allTablesResult = await client.query(`
      SELECT 
        table_schema,
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY table_schema, table_name
    `);
    
    if (allTablesResult.rows.length === 0) {
      console.log('⚠️  No tables found in any schema.\n');
      console.log('💡 If you created tables in pgAdmin, make sure:');
      console.log('   1. You created them in the "paysignal" database');
      console.log('   2. The tables are in the "public" schema (default)');
      console.log('   3. You\'re connected to the correct database\n');
      return;
    }
    
    console.log(`✅ Found ${allTablesResult.rows.length} table(s) across all schemas:\n`);
    
    // Group by schema
    const tablesBySchema = {};
    allTablesResult.rows.forEach(row => {
      if (!tablesBySchema[row.table_schema]) {
        tablesBySchema[row.table_schema] = [];
      }
      tablesBySchema[row.table_schema].push(row);
    });
    
    // Display tables by schema
    for (const [schema, tables] of Object.entries(tablesBySchema)) {
      console.log(`📂 Schema: ${schema} (${tables.length} table(s))`);
      tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.table_name} (${table.table_type})`);
      });
      console.log('');
    }
    
    // Check public schema specifically
    const publicTables = allTablesResult.rows.filter(r => r.table_schema === 'public');
    if (publicTables.length > 0) {
      console.log('✅ Tables in "public" schema (this is what the code expects):\n');
      publicTables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.table_name}`);
      });
      console.log('');
    } else {
      console.log('⚠️  No tables found in "public" schema.\n');
      console.log('💡 The backend code expects tables in the "public" schema.');
      console.log('   If your tables are in a different schema, you may need to:');
      console.log('   1. Move them to the public schema, or');
      console.log('   2. Update the code to use the correct schema\n');
    }
    
    // Show details of tables in public schema
    if (publicTables.length > 0) {
      console.log('📊 Details of tables in public schema:\n');
      for (const table of publicTables) {
        try {
          const columnsResult = await client.query(`
            SELECT 
              column_name,
              data_type,
              is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' 
              AND table_name = $1
            ORDER BY ordinal_position
            LIMIT 10
          `, [table.table_name]);
          
          console.log(`📌 ${table.table_name}:`);
          if (columnsResult.rows.length > 0) {
            columnsResult.rows.forEach(col => {
              console.log(`   - ${col.column_name} (${col.data_type})`);
            });
            if (columnsResult.rows.length === 10) {
              console.log(`   ... (showing first 10 columns)`);
            }
          }
          console.log('');
        } catch (err) {
          console.log(`   (unable to get column info: ${err.message})\n`);
        }
      }
    }
    
    // Expected tables from migrations
    console.log('📋 Expected tables (from migration files):\n');
    const expectedTables = [
      'users',
      'payment_transactions',
      'audit_logs',
      'alerts',
      'rules',
      'system_metrics',
      'refresh_tokens',
      'oauth_accounts',
      'email_verification_tokens',
      'password_reset_tokens',
      'user_sessions'
    ];
    
    const existingTableNames = publicTables.map(t => t.table_name.toLowerCase());
    
    expectedTables.forEach(tableName => {
      const found = existingTableNames.includes(tableName.toLowerCase());
      if (found) {
        console.log(`  ✅ ${tableName}`);
      } else {
        console.log(`  ❌ ${tableName} (missing)`);
      }
    });
    
    console.log('\n✅ Database scan complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error scanning database:\n');
    console.error(`  ${error.message}\n`);
    if (error.code) {
      console.error(`  Error code: ${error.code}\n`);
    }
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

findTables();

