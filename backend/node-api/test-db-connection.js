/**
 * Simple database connection test script
 * Tests connection to PostgreSQL database "paysignal" on localhost:5432
 * 
 * Usage: node test-db-connection.js
 */

const { Pool } = require('pg');
require('dotenv').config();

// Database configuration matching your setup
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'paysignal',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  connectionTimeoutMillis: 5000,
};

console.log('\n🔍 Testing PostgreSQL Database Connection...\n');
console.log('Configuration:');
console.log(`  Host: ${dbConfig.host}`);
console.log(`  Port: ${dbConfig.port}`);
console.log(`  Database: ${dbConfig.database}`);
console.log(`  User: ${dbConfig.user}`);
console.log(`  Password: ${dbConfig.password ? '***' : '(not set)'}\n`);

const pool = new Pool(dbConfig);

async function testConnection() {
  let client;
  try {
    console.log('⏳ Attempting to connect...\n');
    
    // Test basic connection
    client = await pool.connect();
    console.log('✅ Connection established successfully!\n');
    
    // Test query
    console.log('⏳ Testing query execution...');
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version, current_database() as database_name');
    
    console.log('✅ Query executed successfully!\n');
    console.log('📊 Database Information:');
    console.log(`  Current Time: ${result.rows[0].current_time}`);
    console.log(`  PostgreSQL Version: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}`);
    console.log(`  Database Name: ${result.rows[0].database_name}\n`);
    
    // Test table existence (check for common tables)
    console.log('⏳ Checking for database tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log(`✅ Found ${tablesResult.rows.length} table(s):`);
      tablesResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.table_name}`);
      });
    } else {
      console.log('⚠️  No tables found in the database (this is okay if migrations haven\'t been run yet)');
    }
    
    console.log('\n✅ All tests passed! Database connection is working correctly.\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Connection test failed!\n');
    console.error('Error Details:');
    console.error(`  Code: ${error.code || 'N/A'}`);
    console.error(`  Message: ${error.message}\n`);
    
    // Provide helpful error messages
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Troubleshooting:');
      console.error('  - PostgreSQL server may not be running');
      console.error('  - Check if PostgreSQL is started in pgAdmin or as a service');
      console.error('  - Verify the port (5432) is correct\n');
    } else if (error.code === '28P01') {
      console.error('💡 Troubleshooting:');
      console.error('  - Authentication failed - check username and password');
      console.error('  - Verify credentials in pgAdmin\n');
    } else if (error.code === '3D000') {
      console.error('💡 Troubleshooting:');
      console.error(`  - Database "${dbConfig.database}" does not exist`);
      console.error('  - Create the database in pgAdmin or run: CREATE DATABASE paysignal;\n');
    } else if (error.code === 'ENOTFOUND') {
      console.error('💡 Troubleshooting:');
      console.error(`  - Host "${dbConfig.host}" not found`);
      console.error('  - Check if PostgreSQL is running on the correct host\n');
    } else {
      console.error('💡 Troubleshooting:');
      console.error('  - Check PostgreSQL server logs');
      console.error('  - Verify database exists in pgAdmin');
      console.error('  - Check firewall settings\n');
    }
    
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run the test
testConnection().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

