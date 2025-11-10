#!/usr/bin/env node

/**
 * Sample Data Generator for Fermentation Data Platform
 * Generates realistic fermentation run data for testing and demonstration
 *
 * Usage: node seed-sample-data.js [--count=N] [--clean]
 *
 * Options:
 * - --count=N: Number of sample runs to generate (default: 3)
 * - --clean: Delete all existing data before seeding
 *
 * Environment Variables:
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_KEY: Supabase anon key
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables from root .env
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Parse command line arguments
const args = process.argv.slice(2);
let COUNT = 3;
let CLEAN = false;

for (const arg of args) {
  if (arg.startsWith('--count=')) {
    COUNT = parseInt(arg.split('=')[1]);
  }
  if (arg === '--clean') {
    CLEAN = true;
  }
}

/**
 * Generate realistic fermentation data
 * Simulates a 24-hour fermentation run with multiple parameters
 */
function generateFermentationData(runId, startTime = 0, duration = 86400) {
  const data = [];
  const interval = 30; // 30-second intervals
  const numPoints = Math.floor(duration / interval);

  // Parameter functions that simulate realistic fermentation
  const getTemperature = (t) => 25 + 2 * Math.sin((t / 3600) * 0.1) + Math.random() * 0.5;
  const getpH = (t) => 6.5 + 0.3 * Math.sin((t / 7200) * 0.05) + Math.random() * 0.1;
  const getGlucose = (t) => Math.max(0, 100 - (t / 3600) * 2 + Math.random() * 5);
  const getGlycerol = (t) => Math.max(0, 50 - (t / 3600) * 0.5 + Math.random() * 3);
  const getBase = (t) => (t / 3600) * 1.5 + Math.random() * 2;
  const getAcid = (t) => (t / 3600) * 0.8 + Math.random() * 1;

  // Generate data points
  for (let i = 0; i < numPoints; i++) {
    const timeStamp = startTime + i * interval;

    data.push(
      { run_id: runId, time_stamp: timeStamp, parameter: 'Temperature', process_value: getTemperature(timeStamp), units: 'DegC' },
      { run_id: runId, time_stamp: timeStamp, parameter: 'pH', process_value: getpH(timeStamp), units: 'pH' },
      { run_id: runId, time_stamp: timeStamp, parameter: 'Glucose', process_value: getGlucose(timeStamp), units: '%' },
      { run_id: runId, time_stamp: timeStamp, parameter: 'Glycerol', process_value: getGlycerol(timeStamp), units: '%' },
      { run_id: runId, time_stamp: timeStamp, parameter: 'Base', process_value: getBase(timeStamp), units: '%' },
      { run_id: runId, time_stamp: timeStamp, parameter: 'Acid', process_value: getAcid(timeStamp), units: '%' },
    );
  }

  return data;
}

/**
 * Clean all existing data
 */
async function cleanDatabase() {
  try {
    console.log('🧹 Cleaning existing data...\n');

    // Delete all time-series data first (foreign key dependency)
    const { error: tsError } = await supabase
      .from('run_time_series_data')
      .delete()
      .gte('id', 0);

    if (tsError && tsError.code !== 'PGRST116') {
      throw tsError;
    }

    console.log('✅ Deleted time-series data');

    // Delete all runs
    const { error: runError } = await supabase
      .from('run_client')
      .delete()
      .gte('run_id', '');

    if (runError && runError.code !== 'PGRST116') {
      throw runError;
    }

    console.log('✅ Deleted run metadata\n');
  } catch (error) {
    console.error('❌ Error cleaning database:', error.message);
    throw error;
  }
}

/**
 * Seed sample data
 */
async function seedData(count) {
  try {
    console.log(`🌱 Seeding ${count} sample fermentation runs...\n`);

    // Sample clients and fermentation profiles
    const clients = ['ClientABC', 'ClientDEF', 'ClientGHI', 'ClientJKL'];
    const allTimeSeriesData = [];

    // Create run metadata and time-series data
    for (let i = 0; i < count; i++) {
      const runNum = String(i + 1).padStart(6, '0');
      const runId = `R${runNum}`;
      const clientName = clients[i % clients.length];

      // Generate time-series data
      const timeSeriesData = generateFermentationData(runId);
      allTimeSeriesData.push(...timeSeriesData);

      // Insert run metadata
      const { error: runError } = await supabase
        .from('run_client')
        .insert([{ run_id: runId, client_name: clientName }]);

      if (runError) {
        throw new Error(`Failed to insert run ${runId}: ${runError.message}`);
      }

      console.log(`✅ Run ${i + 1}/${count}: ${runId} (${clientName})`);
    }

    // Insert time-series data in batches
    const BATCH_SIZE = 1000;
    for (let i = 0; i < allTimeSeriesData.length; i += BATCH_SIZE) {
      const batch = allTimeSeriesData.slice(i, i + BATCH_SIZE);
      const { error: tsError } = await supabase
        .from('run_time_series_data')
        .insert(batch);

      if (tsError) {
        throw new Error(`Failed to insert time-series data batch: ${tsError.message}`);
      }

      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(allTimeSeriesData.length / BATCH_SIZE);
      console.log(`  📊 Time-series data batch ${batchNum}/${totalBatches} inserted`);
    }

    console.log(`\n✅ Successfully seeded ${count} runs with ${allTimeSeriesData.length} time-series data points\n`);

    // Print summary
    console.log('📋 Data Summary:');
    console.log(`  - Total runs: ${count}`);
    console.log(`  - Total time-series records: ${allTimeSeriesData.length}`);
    console.log(`  - Parameters per timestamp: 6 (Temperature, pH, Glucose, Glycerol, Base, Acid)`);
    console.log(`  - Typical duration: 24 hours (86400 seconds)`);
    console.log(`  - Sample interval: 30 seconds`);
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Fermentation Data Platform - Sample Data Generator\n');

    if (CLEAN) {
      await cleanDatabase();
    }

    await seedData(COUNT);

    console.log('✨ Sample data generation complete!');
    console.log('\n💡 Next steps:');
    console.log('1. Start the frontend: cd .trees/frontend && npm run dev');
    console.log('2. Start the backend: cd .trees/backend && npm run dev');
    console.log('3. Visit http://localhost:3000 in your browser');
    console.log('4. Try uploading a CSV file or viewing the seeded runs in the history');
  } catch (error) {
    console.error('\n❌ Sample data generation failed:', error.message);
    process.exit(1);
  }
}

// Run main function
main();
