# Database Setup Instructions

The CSV parsing bug has been fixed (`skipEmptyLines: false` in `backend/src/utils/csv-parser.ts`), but the database tables need to be created in your Supabase project.

## Option 1: Create Tables via Supabase Dashboard (Recommended)

### Step 1: Open Supabase SQL Editor
1. Go to https://app.supabase.com/
2. Select your project: **epcrmbmvyzofdcqqtmau**
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**

### Step 2: Copy and Run SQL Statements

Paste the following SQL statements into the editor and click **Run**:

```sql
-- Create run_client table
CREATE TABLE IF NOT EXISTS public.run_client (
  run_id VARCHAR(20) PRIMARY KEY,
  client_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create run_time_series_data table
CREATE TABLE IF NOT EXISTS public.run_time_series_data (
  id SERIAL PRIMARY KEY,
  run_id VARCHAR(20) REFERENCES public.run_client(run_id) ON DELETE CASCADE,
  time_stamp FLOAT NOT NULL,
  parameter VARCHAR(50) NOT NULL,
  process_value FLOAT NOT NULL,
  units VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_run_time_series_run_id ON public.run_time_series_data(run_id);
CREATE INDEX IF NOT EXISTS idx_run_time_series_parameter ON public.run_time_series_data(parameter);
```

### Step 3: Verify Tables Created
1. Go to **Table Editor** (left sidebar)
2. You should see both tables:
   - `run_client`
   - `run_time_series_data`

## Option 2: Use Supabase CLI (If Installed)

If you have the Supabase CLI installed:

```bash
# From the project root
supabase db push

# Or if creating a new migration:
supabase migration new init_schema
# Then edit the migration file with the SQL above
supabase db push
```

## Option 3: Use the init-db.js Script with Service Key

If you have your SUPABASE_SERVICE_KEY available:

1. Add it to your `.env` file:
   ```
   SUPABASE_SERVICE_KEY=your_service_key_here
   ```

2. Run the init script:
   ```bash
   cd database
   npm run init
   ```

## Verify Setup Works

After creating the tables, test the CSV upload:

```bash
curl -F "file=@ClientABC_R000002_Online_Report_BostonBioprocess.csv" \
  -F "pump1=Glucose" \
  -F "pump2=Base" \
  http://localhost:3000/api/upload | jq .
```

Expected response:
```json
{
  "success": true,
  "runId": "R000002",
  "clientName": "ClientABC",
  "recordsInserted": 8
}
```

## Table Schemas

### run_client
| Column | Type | Notes |
|--------|------|-------|
| run_id | VARCHAR(20) | Primary key, format: RXXXXXX |
| client_name | VARCHAR(100) | Client name extracted from filename |
| created_at | TIMESTAMP | Auto-set to current time |

### run_time_series_data
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL | Auto-incrementing primary key |
| run_id | VARCHAR(20) | Foreign key to run_client |
| time_stamp | FLOAT | Time in seconds |
| parameter | VARCHAR(50) | Parameter name (pH, Temperature, Glucose, etc.) |
| process_value | FLOAT | Measured value |
| units | VARCHAR(20) | Unit of measurement |
| created_at | TIMESTAMP | Auto-set to current time |

## Troubleshooting

If you encounter errors:

1. **"Table already exists"**: This is fine with `IF NOT EXISTS` - the script is idempotent
2. **"Permission denied"**: Ensure you're using a role with table creation permissions
3. **"Invalid SQL"**: Copy the exact statements above - no modifications needed

For more help, check your Supabase project dashboard or logs.
