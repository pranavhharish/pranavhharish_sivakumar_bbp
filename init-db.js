#!/usr/bin/env node

/**
 * Database Initialization Script
 * Initializes the Supabase database with required tables and indexes
 *
 * Usage: node init-db.js [--print-only]
 *
 * Options:
 * - --print-only: Print SQL statements without executing them
 *
 * Environment Variables (from root .env file):
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_KEY: Supabase anon/public key (for schema inspection)
 * - SUPABASE_SERVICE_KEY: Supabase service role key (for SQL execution - required to actually run)
 */

const { createClient } = require('@supabase/supabase-js');
const { createPool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from root .env
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PRINT_ONLY = process.argv.includes('--print-only');

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file');
  process.exit(1);
}

// SQL statements to execute
const SQL_STATEMENTS = [
  // Create run_client table
  `CREATE TABLE IF NOT EXISTS run_client (
    run_id VARCHAR(20) PRIMARY KEY,
    client_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  // Create run_time_series_data table
  `CREATE TABLE IF NOT EXISTS run_time_series_data (
    id SERIAL PRIMARY KEY,
    run_id VARCHAR(20) REFERENCES run_client(run_id) ON DELETE CASCADE,
    time_stamp FLOAT NOT NULL,
    parameter VARCHAR(50) NOT NULL,
    process_value FLOAT NOT NULL,
    units VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  // Create indexes
  'CREATE INDEX IF NOT EXISTS idx_run_time_series_run_id ON run_time_series_data(run_id)',
  'CREATE INDEX IF NOT EXISTS idx_run_time_series_parameter ON run_time_series_data(parameter)',
];

/**
 * Print SQL statements to console
 */
function printSqlStatements() {
  console.log('📋 SQL statements to execute in Supabase SQL Editor:');
  console.log('─'.repeat(60) + '\n');

  SQL_STATEMENTS.forEach((sql, index) => {
    console.log(`-- Statement ${index + 1}`);
    console.log(sql + ';\n');
  });

  console.log('─'.repeat(60));
  console.log('\n✅ How to execute:');
  console.log('1. Go to: https://app.supabase.com/project/[project-id]/sql/new');
  console.log('2. Copy and paste the SQL statements above');
  console.log('3. Click "Run"');
  console.log('\nOR use the Supabase CLI:');
  console.log('  supabase db pull  # Pull schema from remote');
}

/**
 * Extract database connection string from Supabase URL
 * Format: https://[project-ref].supabase.co → postgresql://postgres:password@[project-ref].db.supabase.co:5432/postgres
 */
function buildConnectionString() {
  // Extract project reference from Supabase URL
  const projectRef = SUPABASE_URL.match(/https:\/\/([\w-]+)\.supabase\.co/)?.[1];

  if (!projectRef) {
    throw new Error('Could not extract project reference from SUPABASE_URL');
  }

  // For Supabase, use the service role key as password
  // Connection string format: postgresql://postgres:password@host:5432/postgres
  const host = `${projectRef}.db.supabase.co`;
  const password = SUPABASE_SERVICE_KEY;
  const user = 'postgres';
  const dbname = 'postgres';
  const port = 5432;

  return `postgresql://${user}:${password}@${host}:${port}/${dbname}`;
}

/**
 * Execute SQL statements using PostgreSQL connection
 */
async function executeSqlWithPostgres() {
  let client;

  try {
    const connectionString = buildConnectionString();

    // Create pool to execute SQL
    const pool = createPool({
      connectionString,
      ssl: { rejectUnauthorized: false }, // Supabase requires SSL
      statement_timeout: 30000, // 30 second timeout
    });

    client = await pool.connect();

    console.log('✅ Connected to Supabase database\n');
    console.log('🚀 Executing SQL statements...\n');

    for (let i = 0; i < SQL_STATEMENTS.length; i++) {
      const sql = SQL_STATEMENTS[i];
      try {
        await client.query(sql);
        console.log(`✅ Statement ${i + 1}/${SQL_STATEMENTS.length} executed successfully`);
      } catch (error) {
        if (error.code === '42P07' || error.code === '42P01') {
          // 42P07 = duplicate table, 42P01 = undefined table (both acceptable with IF NOT EXISTS)
          console.log(`✅ Statement ${i + 1}/${SQL_STATEMENTS.length} executed (already exists)`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ Database initialization completed successfully!');
    console.log('\n📊 Tables created:');
    console.log('  - run_client');
    console.log('  - run_time_series_data');
    console.log('\n🔍 Indexes created:');
    console.log('  - idx_run_time_series_run_id');
    console.log('  - idx_run_time_series_parameter');

    await client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Error executing SQL:', error.message);
    if (client) await client.release();
    throw error;
  }
}

/**
 * Main initialization function
 */
async function initializeDatabase() {
  try {
    console.log('🚀 Fermentation Data Platform - Database Initialization\n');

    // Check if we should print-only or actually execute
    if (PRINT_ONLY) {
      console.log('📖 Mode: Print SQL statements only (no execution)\n');
      printSqlStatements();
      return;
    }

    // Check if service key is available
    if (!SUPABASE_SERVICE_KEY) {
      console.log('⚠️  Mode: Print SQL statements (service key not configured)\n');
      console.log('To automatically execute SQL, set SUPABASE_SERVICE_KEY in .env\n');
      printSqlStatements();
      console.log('\n💡 Tip: Use --print-only flag to skip this warning');
      return;
    }

    // Execute SQL with PostgreSQL connection
    await executeSqlWithPostgres();
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();
