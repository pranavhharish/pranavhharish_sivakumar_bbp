#!/usr/bin/env node

/**
 * Database Initialization Script
 * Initializes the Supabase database with required tables and indexes
 *
 * Usage: node init-db.js
 *
 * Environment Variables:
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_KEY: Supabase anon key
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...\n');

    // SQL statements to execute
    const sqlStatements = [
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

    // Note: Supabase client doesn't directly support executing raw SQL
    // In production, use Supabase SQL Editor in dashboard or PostgreSQL client
    console.log('⚠️  Note: Raw SQL execution requires PostgreSQL client');
    console.log('\n📋 SQL statements to execute in Supabase SQL Editor:');
    console.log('────────────────────────────────────────────────\n');

    sqlStatements.forEach((sql, index) => {
      console.log(`-- Statement ${index + 1}`);
      console.log(sql + ';\n');
    });

    console.log('────────────────────────────────────────────────');
    console.log('\n✅ Instructions:');
    console.log('1. Go to Supabase Dashboard: https://app.supabase.com');
    console.log('2. Select your project');
    console.log('3. Navigate to SQL Editor');
    console.log('4. Create a new query and paste the SQL statements above');
    console.log('5. Click Run');

  } catch (error) {
    console.error('❌ Error during initialization:', error.message);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();
