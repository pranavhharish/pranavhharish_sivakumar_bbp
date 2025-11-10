# Database Setup Guide

## Overview

This guide explains how to initialize the Fermentation Data Platform database schema in Supabase.

## Prerequisites

- Supabase account (free tier is sufficient)
- Node.js 18+ (if using automated setup)
- Supabase project created

## Database Schema

The platform uses two tables to store fermentation run data:

### Table: `run_client`
Stores metadata about fermentation runs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `run_id` | VARCHAR(20) | PRIMARY KEY | Unique run identifier (e.g., "R001001") |
| `client_name` | VARCHAR(100) | NOT NULL | Client name (e.g., "ClientABC") |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

### Table: `run_time_series_data`
Stores time-series measurement data for each run.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-increment unique identifier |
| `run_id` | VARCHAR(20) | FK → run_client(run_id) ON DELETE CASCADE | Reference to parent run |
| `time_stamp` | FLOAT | NOT NULL | Time value from measurement (e.g., 0.009 seconds) |
| `parameter` | VARCHAR(50) | NOT NULL | Parameter name (pH, Temperature, Glucose, Base, Acid, etc.) |
| `process_value` | FLOAT | NOT NULL | Measured value |
| `units` | VARCHAR(20) | NOT NULL | Unit of measurement (pH, DegC, %) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

### Indexes

Two indexes are created for query performance:

```sql
CREATE INDEX idx_run_time_series_run_id ON run_time_series_data(run_id);
CREATE INDEX idx_run_time_series_parameter ON run_time_series_data(parameter);
```

## Setup Methods

### Method 1: Automated Setup (Recommended)

This method uses Node.js to automatically initialize the database.

#### Prerequisites
- SUPABASE_SERVICE_KEY environment variable configured

#### Steps

1. **Install dependencies:**
   ```bash
   cd .trees/database
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   # Copy .env.example to .env in project root
   cp ../../.env.example ../../.env

   # Edit .env and add your Supabase credentials:
   # - SUPABASE_URL
   # - SUPABASE_KEY
   # - SUPABASE_SERVICE_KEY (required for automated setup)
   ```

3. **Run initialization:**
   ```bash
   npm run init
   ```

   The script will:
   - Connect to your Supabase database
   - Create both tables
   - Create the indexes
   - Display a success message

#### Troubleshooting

- **Missing SUPABASE_SERVICE_KEY:** The script will fall back to printing SQL statements
- **Connection timeout:** Check your firewall and Supabase IP whitelist
- **Authentication failed:** Verify your service key is correct

### Method 2: Manual Setup via Supabase Dashboard

This method uses the Supabase web interface (no service key needed).

#### Steps

1. **Get the SQL statements:**
   ```bash
   cd .trees/database
   npm install
   npm run init -- --print-only
   ```

2. **Copy the SQL:**
   The script will print all SQL statements to console

3. **Execute in Supabase:**
   - Go to https://app.supabase.com/
   - Select your project
   - Navigate to **SQL Editor**
   - Click **New Query**
   - Paste the SQL statements
   - Click **Run**

### Method 3: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Pull current schema from remote
supabase db pull

# Push changes to remote
supabase db push
```

## Verification

After initialization, verify the schema was created correctly:

### Check Tables Exist

In Supabase SQL Editor, run:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema='public';
```

Should return:
- `run_client`
- `run_time_series_data`

### Check Columns

```sql
-- Check run_client columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name='run_client'
ORDER BY ordinal_position;

-- Check run_time_series_data columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name='run_time_series_data'
ORDER BY ordinal_position;
```

### Check Indexes

```sql
SELECT indexname
FROM pg_indexes
WHERE tablename='run_time_series_data';
```

Should return:
- `idx_run_time_series_run_id`
- `idx_run_time_series_parameter`

## Environment Configuration

### Required Environment Variables

```bash
# Supabase project URL
SUPABASE_URL=https://your-project.supabase.co

# Supabase anon/public key (safe to expose)
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase service role key (KEEP SECRET - server-side only)
# Only needed for automated database setup
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Where to Find Credentials

1. Go to https://app.supabase.com/
2. Select your project
3. Navigate to **Settings** → **API**
4. Find:
   - **Project URL** → `SUPABASE_URL`
   - **Anon public key** → `SUPABASE_KEY`
   - **Service role key** → `SUPABASE_SERVICE_KEY` (in the Secrets section)

## Database Operations

### Insert a New Run

```javascript
// Using Supabase JS client
const { data, error } = await supabase
  .from('run_client')
  .insert([
    { run_id: 'R001001', client_name: 'ClientABC' }
  ]);

// Then insert time-series data
const { data: tsData, error: tsError } = await supabase
  .from('run_time_series_data')
  .insert([
    { run_id: 'R001001', time_stamp: 0.009, parameter: 'pH', process_value: 5.99, units: 'pH' },
    { run_id: 'R001001', time_stamp: 0.009, parameter: 'Temperature', process_value: 28.01, units: 'DegC' },
    // ... more data
  ]);
```

### Query Run Data

```javascript
// Get run metadata
const { data: run, error } = await supabase
  .from('run_client')
  .select('*')
  .eq('run_id', 'R001001')
  .single();

// Get all time-series data for a run
const { data: timeSeriesData, error: tsError } = await supabase
  .from('run_time_series_data')
  .select('*')
  .eq('run_id', 'R001001')
  .order('time_stamp', { ascending: true });
```

### List All Runs

```javascript
const { data: runs, error, count } = await supabase
  .from('run_client')
  .select('*', { count: 'exact' })
  .order('created_at', { ascending: false })
  .range(0, 49); // Pagination: 50 runs per page
```

## Performance Optimization

### Indexes

The schema includes two indexes for optimal query performance:

- **idx_run_time_series_run_id**: Speeds up queries filtering by `run_id`
- **idx_run_time_series_parameter**: Speeds up queries filtering by `parameter`

### Query Optimization Tips

```sql
-- Good: Uses index
SELECT * FROM run_time_series_data
WHERE run_id = 'R001001'
ORDER BY time_stamp ASC;

-- Good: Uses index
SELECT DISTINCT parameter FROM run_time_series_data
WHERE parameter IN ('pH', 'Temperature');

-- Avoid: Full table scan
SELECT * FROM run_time_series_data
WHERE CAST(process_value AS TEXT) LIKE '%5%';
```

## Backup and Recovery

### Automatic Backups

Supabase automatically backs up your database:
- Free tier: Daily backups, 7-day retention
- Pro tier: Continuous backups, 30-day retention

### Manual Backup

In Supabase SQL Editor:

```sql
-- Export table data
\COPY run_client TO 'run_client.csv' WITH CSV HEADER;
\COPY run_time_series_data TO 'run_time_series_data.csv' WITH CSV HEADER;
```

### Restore from Backup

In Supabase Dashboard:
- Navigate to **Settings** → **Backups**
- Select a backup point
- Click **Restore**

## Troubleshooting

### Issue: "Table already exists"
This is normal if you run the initialization script multiple times. The `CREATE TABLE IF NOT EXISTS` clause prevents errors.

### Issue: "Foreign key constraint violated"
Ensure you insert into `run_client` before inserting into `run_time_series_data`.

### Issue: "Permission denied"
Make sure you're using the service role key (not the anon key) for write operations.

### Issue: "Connection timeout"
- Check your internet connection
- Verify Supabase credentials
- Check if Supabase services are running (https://status.supabase.com/)

## Testing Database Setup

You can test the database with sample data:

```sql
-- Insert test run
INSERT INTO run_client (run_id, client_name)
VALUES ('R000001', 'TestClient');

-- Insert test time-series data
INSERT INTO run_time_series_data (run_id, time_stamp, parameter, process_value, units)
VALUES
  ('R000001', 0.0, 'pH', 6.5, 'pH'),
  ('R000001', 0.0, 'Temperature', 25.0, 'DegC'),
  ('R000001', 0.0, 'Glucose', 100.0, '%'),
  ('R000001', 0.0, 'Base', 0.0, '%');

-- Query the data back
SELECT * FROM run_client WHERE run_id = 'R000001';
SELECT * FROM run_time_series_data WHERE run_id = 'R000001' ORDER BY time_stamp;

-- Clean up test data
DELETE FROM run_client WHERE run_id = 'R000001';
```

## Next Steps

After successfully initializing the database:

1. **Set up frontend**: Navigate to `.trees/frontend` and follow setup instructions
2. **Set up backend**: Navigate to `.trees/backend` and follow setup instructions
3. **Test the full flow**: Upload a CSV file and verify data is stored correctly

## Support

For issues or questions:
- Supabase documentation: https://supabase.com/docs
- PostgreSQL documentation: https://www.postgresql.org/docs/
- Project README: See `../../README.md`

## Schema Version

- **Version**: 1.0
- **Last Updated**: 2025-11-09
- **Status**: Stable

SQL files in this directory:
- `init-db.js`: Database initialization script
- `DATABASE-SETUP.md`: This file
