# Fermentation Data Platform - Database

Database schema and migrations for the Fermentation Data Platform.

## Schema Overview

### Tables

#### `run_client`
Stores metadata about fermentation runs.

| Column | Type | Description |
|--------|------|-------------|
| run_id | VARCHAR(20) | Primary key - unique run identifier (e.g., "R001001") |
| client_name | VARCHAR(100) | Client name (e.g., "ClientABC") |
| created_at | TIMESTAMP | Record creation timestamp (defaults to NOW()) |

#### `run_time_series_data`
Stores time-series data points for each run.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Auto-increment primary key |
| run_id | VARCHAR(20) | Foreign key to run_client.run_id (CASCADE delete) |
| time_stamp | FLOAT | Time value from the CSV |
| parameter | VARCHAR(50) | Parameter name (pH, Temperature, Glucose, Base, Acid, Glycerol) |
| process_value | FLOAT | Measured value |
| units | VARCHAR(20) | Unit of measurement (pH, DegC, %) |
| created_at | TIMESTAMP | Record creation timestamp (defaults to NOW()) |

### Indexes
- `idx_run_time_series_run_id` on `run_time_series_data(run_id)` - For fast lookups by run ID
- `idx_run_time_series_parameter` on `run_time_series_data(parameter)` - For fast lookups by parameter

## Setup Instructions

### Option 1: Using Supabase Dashboard (Recommended for first-time setup)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor** → **New Query**
4. Copy contents of `001_init_schema.sql` and execute
5. Verify tables are created

### Option 2: Using Node.js Script

```bash
npm install
npm run init
```

This script will display the SQL statements needed. Copy them into the Supabase SQL Editor and execute.

## Environment Variables

Required in `.env` file (at project root):
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your_anon_key
```

## Verification

Verify the setup by checking tables in Supabase:

```sql
-- Check tables exist
\dt

-- Check run_client structure
\d run_client

-- Check run_time_series_data structure
\d run_time_series_data

-- Check indexes
\di
```

## Files

- `001_init_schema.sql` - SQL migration file with complete schema definition
- `init-db.js` - Node.js script for database initialization
- `package.json` - Dependencies
