# Fermentation Data Platform - Architecture Guide

## Project Overview

The Fermentation Data Platform is a full-stack web application for uploading, storing, and visualizing fermentation run data. It enables Boston Bioprocess users to upload CSV files, parse them with custom parameter mapping, store structured data in a PostgreSQL database via Supabase, and visualize time-series parameters through interactive charts.

**Tech Stack:**
- Frontend: Next.js 16 + React 19 + TailwindCSS
- Backend: Node.js + Express + TypeScript
- Database: Supabase (PostgreSQL)
- File Handling: Multer (backend) + Papaparse (CSV parsing)
- Visualization: Plotly.js

---

## Architecture Overview

### High-Level Data Flow

```
CSV Upload (Frontend)
    ↓
File Validation & Form Processing (Frontend)
    ↓
HTTP POST to /api/upload (Backend)
    ↓
CSV Parsing & Filename Validation (Backend)
    ↓
Database Insert (Supabase - 2 tables)
    ↓
Response with Run ID & Record Count
    ↓
Display Results & Trigger History Refresh (Frontend)
    ↓
User Selects Run from History
    ↓
GET /api/runs/:runId (Backend)
    ↓
Transform Data to Plotly Format
    ↓
Render Interactive Chart (Frontend)
```

---

## 1. Frontend Structure (`.trees/frontend/src`)

### Directory Layout

```
src/
├── app/
│   ├── layout.tsx       # Root layout with metadata
│   └── page.tsx         # Main home page (client component)
├── components/
│   ├── UploadForm.tsx   # File upload & pump selection form
│   ├── DataVisualization.tsx  # Plotly chart component
│   ├── RunHistory.tsx   # List of previous runs
│   └── Toast.tsx        # Toast notification component
├── hooks/
│   └── useToast.ts      # Toast state management hook
├── lib/
│   ├── apiClient.ts     # Axios-based API client
│   └── csvParser.ts     # Client-side CSV utilities
├── styles/
│   └── globals.css      # TailwindCSS styles
└── types/
    └── index.ts         # TypeScript interfaces
```

### Key Files Analysis

#### **src/app/page.tsx** (Main Entry Point)
- **Type:** Client component (`'use client'`)
- **Purpose:** Orchestrates the entire frontend application
- **State Management:**
  - `currentRun`: Currently selected/loaded run with time-series data
  - `refreshTrigger`: Counter to refresh run history list
  - `isLoading`: Loading state during data fetch
- **Key Functions:**
  - `handleUploadSuccess()`: Triggered after successful CSV upload
  - `handleRunSelect()`: Called when user clicks a run in history
  - `loadRun()`: Fetches run data and displays visualization

**Layout Pattern:** 
- 4-column grid: 1 column for sidebar (RunHistory), 3 columns for main content (UploadForm + DataVisualization)
- Uses responsive classes (`lg:col-span-1` / `lg:col-span-3`)

#### **src/app/layout.tsx**
- Root layout with Next.js metadata
- Applies TailwindCSS base styles
- Minimal setup, delegates to page.tsx

#### **src/lib/apiClient.ts** (API Integration)
- **Pattern:** Singleton class with Axios instance
- **Base URL:** Configured via `NEXT_PUBLIC_API_URL` env variable (defaults to `http://localhost:3000`)
- **Methods:**
  - `uploadFile(file, pump1, pump2)`: POST to `/api/upload`
  - `getRunData(runId)`: GET from `/api/runs/:runId`
  - `listRuns(limit, offset)`: GET from `/api/runs`
- **Error Handling:** Catches errors and returns user-friendly messages

#### **src/components/UploadForm.tsx**
- **State:**
  - `file`: Selected File object
  - `pump1` / `pump2`: Selected pump types
  - `isUploading`: Upload progress flag
  - `uploadProgress`: Progress percentage (0-100)
- **Features:**
  - Drag-and-drop file handling
  - File validation (checks MIME type, size, filename format)
  - CSV pre-parsing for validation
  - Progress feedback to user

**Pump Selections:** User can map CSV "Pump1" and "Pump2" to:
- Pump1 → "Glucose" or "Glycerol"
- Pump2 → "Base" or "Acid"

#### **src/components/DataVisualization.tsx**
- **Props:** `runId`, `clientName`, `data` (TimeSeriesData array)
- **Technology:** React-Plotly.js with dual Y-axes
- **Chart Configuration:**
  - X-axis: Time Stamp (seconds)
  - Y-axis (left): pH, Glucose, Glycerol, Base, Acid
  - Y2-axis (right): Temperature
  - Color-coded traces per parameter
  - Interactive hover info and zoom/pan controls

#### **src/components/RunHistory.tsx**
- **Props:** `onRunSelect()` callback, `refreshTrigger` (re-fetch trigger)
- **Features:**
  - Lists all runs with pagination (50 per page)
  - Displays run_id, client_name, created_at
  - Click to load and visualize run data
  - Auto-refreshes when `refreshTrigger` changes

#### **src/hooks/useToast.ts**
- **Purpose:** Manages toast notifications state
- **Features:**
  - Auto-dismiss after 5 seconds (configurable)
  - Methods: `success()`, `error()`, `warning()`, `info()`
  - Returns: `toasts[]`, `removeToast()`, type-specific methods

#### **src/types/index.ts**
```typescript
TimeSeriesData: { time_stamp, parameter, process_value, units }
RunData: { run_id, client_name, created_at }
RunWithData: RunData + { data: TimeSeriesData[] }
UploadResponse: { success, runId, clientName, recordsInserted, ... }
RunsListResponse: { success, runs[], total }
```

### Frontend Patterns & Conventions

1. **Client Components:** All interactive components use `'use client'` directive
2. **API Client:** Singleton pattern with centralized error handling
3. **State Lifting:** Main state in `page.tsx`, props passed down
4. **Responsive Design:** TailwindCSS with mobile-first approach
5. **Type Safety:** Full TypeScript with interfaces for all data structures

---

## 2. Backend Structure (`.trees/backend/src`)

### Directory Layout

```
src/
├── index.ts             # Express app setup & middleware
├── config/
│   └── index.ts         # Environment config validation
├── middleware/
│   └── errorHandler.ts  # Error handling & async wrapper
├── routes/
│   ├── upload.ts        # POST /api/upload endpoint
│   └── runs.ts          # GET /api/runs endpoints
├── services/
│   └── database.ts      # DatabaseService class
├── utils/
│   ├── csv-parser.ts    # CSV parsing utilities
│   ├── db.ts            # Database operations (Supabase client)
│   ├── validation.ts    # Input validation functions
│   ├── validators.ts    # Additional validators
│   ├── errors.ts        # Custom error classes
│   └── logger.ts        # Logging utility
└── types/
    └── index.ts         # TypeScript interfaces
```

### Key Files Analysis

#### **src/index.ts** (Express App Setup)
**Middleware Stack:**
1. CORS configuration (dev-only wildcard, prod-restricted)
2. Body parsing (JSON + URL-encoded, 10MB limit)
3. Request logging middleware (logs method, path, status, duration)
4. Health check endpoint: `GET /health`
5. API routes mounted at `/api/upload` and `/api/runs`
6. Root endpoint provides API documentation
7. 404 handler for unknown routes
8. Error handler (must be last middleware)

**Graceful Shutdown:** Listens for SIGTERM/SIGINT, closes server cleanly

#### **src/config/index.ts**
**Configuration Pattern:** Singleton with validation
```typescript
AppConfig {
  supabaseUrl, supabaseKey, supabaseServiceKey,
  nodeEnv, port, host, maxFileSize, allowedFileTypes, logLevel
}
```
- **Environment Validation:** Throws error if required vars missing
- **Defaults:** PORT=3000, HOST=localhost, MAX_FILE_SIZE=10MB
- **Development Logging:** Logs config on startup (excludes sensitive keys)

#### **src/routes/upload.ts** (POST /api/upload)

**Flow:**
1. **File Validation** → Check MIME type, size
2. **Pump Validation** → Ensure pump1 and pump2 are provided
3. **Filename Parsing** → Extract clientName and runId (regex: `ClientXXX_RXXXXXX_Online_Report_BostonBioprocess.csv`)
4. **CSV Parsing** → Use PapaParse to parse CSV content
5. **CSV Structure Validation** → Check for required columns (Time Stamp, Parameter, Process value, Units)
6. **Data Transformation** → Convert CSV rows to TimeSeriesRecord array, apply pump mappings
7. **Database Insert** → Call `insertRunData()` with records
8. **Response** → Return `{ success, runId, clientName, recordsInserted }`

**Error Codes:**
- `INVALID_FILE`: File validation failed
- `MISSING_PARAMETERS`: Missing pump selections
- `INVALID_FILENAME`: Filename format incorrect
- `INVALID_CSV_FORMAT`: CSV structure invalid
- `DATABASE_ERROR` or `DUPLICATE_RUN_ID`: Insert failed

#### **src/routes/runs.ts** (GET /api/runs endpoints)

**GET /api/runs** (List all runs)
- Query params: `limit` (default 50, max 100), `offset` (default 0)
- Returns: `{ success, runs[], total, limit, offset }`
- Pagination-friendly structure

**GET /api/runs/:runId** (Get specific run)
- Validates runId format (must match `/^R\d{6}$/`)
- Returns run metadata + time-series data
- Includes transformed `chartData` in Plotly format
- Response includes all data needed for visualization

#### **src/utils/csv-parser.ts**

**Key Functions:**
- `parseAndTransformCSV(csvContent, pump1, pump2)` → Transforms CSV rows
  - Looks for header in row 2 (0-indexed)
  - Processes data starting from row 3
  - Maps "Pump1" → `pump1Selection`, "Pump2" → `pump2Selection`
  - Skips invalid rows
  
- `transformToPlotlyFormat(records)` → Prepares data for Plotly
  - Groups records by parameter
  - Creates separate traces per parameter
  - Applies color map: pH=#3B82F6, Temp=#EF4444, Pumps=#F97316, Base/Acid=#10B981
  - Handles dual Y-axes (left for most params, right for Temperature)

- `parseFilename(filename)` → Extracts metadata
  - Pattern: `ClientXXX_RXXXXXX_Online_Report_BostonBioprocess.csv`
  - Returns: `{ clientName, runId }`

- `validateCSVStructure(csvContent)` → Validates CSV format
  - Checks for minimum 4 rows (2 headers + 1+ data)
  - Validates required columns present
  - Type-checks sample data rows

#### **src/utils/db.ts** (Database Operations)

**Core Functions:**
- `insertRunData(runId, clientName, records)` → Transaction-like insert
  1. Check if runId exists (prevent duplicates)
  2. Insert into `run_client` table
  3. Insert into `run_time_series_data` in batches (1000 records/batch)
  4. Rollback on error (delete run if data insert fails)

- `getRunData(runId)` → Fetch run with data
  1. Get run metadata from `run_client`
  2. Get time-series data from `run_time_series_data`
  3. Sort by time_stamp ascending
  4. Return combined data structure

- `listRuns(limit, offset)` → Paginated run list
  1. Get total count
  2. Get paginated results (ordered by created_at DESC)

#### **src/services/database.ts** (DatabaseService Class)

**Alternative implementation:** More structured than `db.ts`, includes:
- `runExists()` → Check for duplicates
- `insertRun()` → Insert with batching
- `getRunWithData()` → Fetch run + data
- `listRuns()` → Paginated listing
- `deleteRun()` → Delete with cascade
- `getRunCount()` → Count total runs

**Pattern:** Singleton instance exported for global use

#### **src/types/index.ts**

**Key Types:**
```typescript
TimeSeriesDataPoint: { time_stamp, parameter, process_value, units }
FermentationRun: { run_id, client_name, created_at? }
FermentationRunWithData: FermentationRun + { data: TimeSeriesDataPoint[] }
ApiSuccessResponse<T>: { success: true, data?: T, message?: string }
ApiErrorResponse: { success: false, error, code, details? }
AppConfig: Configuration object structure
PumpSelection: 'Glucose' | 'Glycerol' | 'Base' | 'Acid'
ErrorCode enum: INVALID_FILE_TYPE, DUPLICATE_RUN_ID, DATABASE_ERROR, etc.
```

#### **src/middleware/errorHandler.ts**

**Error Handling Middleware:**
- Checks if error is custom ApiError (has statusCode & code)
- Falls back to generic 500 for unknown errors
- Logs all errors with context
- Returns consistent error response format

**asyncHandler Wrapper:** Catches Promise rejections in route handlers

#### **src/utils/validation.ts & validators.ts**

**Validation Functions:**
- `validateFile()` → Check MIME type, extension, size
- `validatePumpSelections()` → Ensure valid pump types
- `parseFilename()` → Extract run info or throw
- `validateCSVStructure()` → Full CSV validation

### Backend Patterns & Conventions

1. **TypeScript Strict Mode:** Full type safety across codebase
2. **Async/Await:** All database operations use async patterns
3. **Error Handling:** Structured error responses with codes
4. **Validation Early:** Input validated at route handler entry
5. **Database Batching:** Large inserts split into 1000-record batches
6. **Pagination:** Supports limit/offset for scalability
7. **CORS Flexible:** Dev-only wildcard, prod-restricted via env vars

---

## 3. Database Setup (`.trees/database`)

### Structure

```
database/
├── package.json
├── init-db.js       # Initialization script
└── .env (from root)
```

### Database Schema

**Two Tables:**

1. **run_client** (Run metadata)
   ```sql
   run_id VARCHAR(20) PRIMARY KEY
   client_name VARCHAR(100) NOT NULL
   created_at TIMESTAMP DEFAULT NOW()
   ```

2. **run_time_series_data** (Time-series data)
   ```sql
   id SERIAL PRIMARY KEY
   run_id VARCHAR(20) FK → run_client(run_id) ON DELETE CASCADE
   time_stamp FLOAT NOT NULL
   parameter VARCHAR(50) NOT NULL
   process_value FLOAT NOT NULL
   units VARCHAR(20) NOT NULL
   created_at TIMESTAMP DEFAULT NOW()
   
   CREATE INDEX idx_run_time_series_run_id ON run_time_series_data(run_id)
   CREATE INDEX idx_run_time_series_parameter ON run_time_series_data(parameter)
   ```

### Initialization Process

**init-db.js:**
- Loads environment variables from root `.env`
- Validates SUPABASE_URL and SUPABASE_KEY
- Prints SQL statements for manual execution
- **Why manual?** Supabase client doesn't support raw SQL execution directly
- **How to run?** Execute SQL statements in Supabase SQL Editor dashboard

**Usage:**
```bash
cd .trees/database
npm install
npm run init  # Prints SQL to console
```

---

## 4. Build & Development Commands

### Frontend Commands (`.trees/frontend/package.json`)

```json
"dev": "next dev"              // Start dev server on http://localhost:3000
"build": "next build"          // Production build
"start": "next start"          // Run production build
"lint": "next lint"            // ESLint check
```

### Backend Commands (`.trees/backend/package.json`)

```json
"dev": "NODE_ENV=development tsx watch src/index.ts"
"build": "tsc"                 // Compile TypeScript to JavaScript
"start": "NODE_ENV=production node dist/index.js"
"test": "vitest"               // Run tests with Vitest
"test:coverage": "vitest --coverage"
"lint": "eslint src --ext .ts"
"format": "prettier --write \"src/**/*.ts\""
```

### Database Commands (`.trees/database/package.json`)

```json
"init": "node init-db.js"      // Print SQL initialization statements
```

### Development Workflow

**Local Development (Terminal 1 - Backend):**
```bash
cd .trees/backend
npm install
cp .env.example .env          # Configure SUPABASE vars
npm run dev                   # Starts on :3000
```

**Local Development (Terminal 2 - Frontend):**
```bash
cd .trees/frontend
npm install
npm run dev                   # Starts on :3000 (Next.js auto-proxies)
```

**Testing:**
```bash
cd .trees/backend
npm run test                  # Run test suite
npm run test:coverage         # With coverage report
```

---

## 5. Key Architectural Patterns

### API Communication Flow

1. **Frontend → Backend:**
   - Axios instance with centralized config
   - Base URL from environment variable
   - Automatic error translation
   - FormData for multipart/form-data (file uploads)

2. **Backend → Database:**
   - Supabase client initialized at service level
   - Operations wrapped in try-catch with rollback
   - Batched inserts for performance (1000 records/batch)
   - Pagination support via LIMIT/OFFSET

### Data Validation Pipeline

**CSV Upload Validation Stages:**
1. File existence and type check (MIME type)
2. Filename pattern validation (extract runId/clientName)
3. CSV structure validation (required columns)
4. Data type validation (time_stamp and process_value are numeric)
5. Pump selection validation (allowed values only)

**Each stage has specific error codes** for frontend error handling.

### Error Handling Strategy

**Consistent Response Format:**
```typescript
Success: { success: true, data?, message?, ... }
Error: { success: false, error: string, code: string, details? }
```

**Error Codes** enable granular frontend error handling:
- `DUPLICATE_RUN_ID` → 409 Conflict
- `INVALID_CSV_FORMAT` → 400 Bad Request
- `DATABASE_ERROR` → 500 Internal Server Error

### State Management Architecture

**Frontend State Hierarchy:**
```
Home (page.tsx) - main orchestrator
├── currentRun: RunWithData | null
├── refreshTrigger: number
├── isLoading: boolean
└── toasts: Toast[]
    └── Passed to UploadForm, DataVisualization, RunHistory
```

**Backend State:**
- Stateless Express routes
- Database accessed via Supabase client singleton
- Configuration loaded once at startup

### Performance Considerations

1. **Batch Inserts:** 1000 records per batch to avoid timeout
2. **Pagination:** Limits default to 50, max 100 runs
3. **Indexes:** Created on `run_id` and `parameter` for query speed
4. **File Size:** Limited to 10MB via Multer and config
5. **In-Memory Storage:** Multer uses memory storage (no disk I/O)

---

## 6. Important Implementation Details

### CSV Parsing Specifics

**CSV Format Expected:**
- Row 0-1: Metadata (ignored)
- Row 2: Headers (Time Stamp, Parameter, Process value, Units)
- Row 3+: Data rows

**Parameter Transformation:**
- "Pump1" in CSV → User-selected value (Glucose or Glycerol)
- "Pump2" in CSV → User-selected value (Base or Acid)
- Other parameters (pH, Temperature) → Passed through

### Plotly Visualization Configuration

**Dual Y-Axis Setup:**
- **yaxis (left):** pH, Glucose, Glycerol, Base, Acid
- **yaxis2 (right):** Temperature
- Prevents scale mismatch when Temperature >> pH values

**Interactive Features:**
- Hover info showing parameter name, time, and value
- Zoom/pan tools built-in
- Download chart as PNG
- Legend toggle to show/hide traces

### Filename Parsing Rules

**Required Format:**
```
ClientXXX_RXXXXXX_Online_Report_BostonBioprocess.csv
```

**Regex Pattern:**
```typescript
/^(Client[A-Z]+)_([Rr]\d{6})_Online_Report_BostonBioprocess\.csv$/
```

**Extraction:**
- Capture 1 → `ClientXXX` (client name)
- Capture 2 → `RXXXXXX` (run ID, normalized to uppercase)

---

## 7. Environment Configuration

### Frontend (`.trees/frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Backend (`.trees/backend/.env`)
```
SUPABASE_URL=https://...supabase.co
SUPABASE_KEY=eyJhbGc...
NODE_ENV=development
PORT=3000
HOST=localhost
```

### Database (`.env` at root)
```
SUPABASE_URL=https://...supabase.co
SUPABASE_KEY=eyJhbGc...
```

---

## 8. Deployment Considerations

### Frontend Deployment (Vercel)
- Next.js builds and deploys automatically
- Environment variable `NEXT_PUBLIC_API_URL` must point to backend
- Static files served from Vercel CDN

### Backend Deployment (Options)
- **Vercel:** Deploy as serverless functions
- **Traditional:** Deploy to Node.js server/Docker container
- **Docker:** See `Dockerfile` and `Dockerfile.dev` in `.trees/backend`

### Database (Supabase)
- Managed PostgreSQL instance
- Automatic backups
- Schema managed via SQL Editor or migrations

---

## 9. File Organization Summary

### Frontend File Purposes

| File | Purpose |
|------|---------|
| `page.tsx` | Main app orchestrator, state management |
| `layout.tsx` | Root HTML structure, metadata |
| `UploadForm.tsx` | File input, pump selection, upload logic |
| `DataVisualization.tsx` | Plotly chart rendering |
| `RunHistory.tsx` | List previous runs, selection |
| `Toast.tsx` | Notification UI |
| `useToast.ts` | Toast state hook |
| `apiClient.ts` | HTTP API wrapper |
| `csvParser.ts` | Client-side CSV validation |

### Backend File Purposes

| File | Purpose |
|------|---------|
| `index.ts` | Express setup, middleware, routes mounting |
| `upload.ts` | File upload handler, CSV validation, DB insert |
| `runs.ts` | List runs, fetch specific run |
| `config/index.ts` | Environment validation, config singleton |
| `db.ts` | Supabase operations (insert, get, list) |
| `csv-parser.ts` | CSV transformation, Plotly formatting |
| `validation.ts` | Input validation functions |
| `errorHandler.ts` | Error handling middleware |
| `logger.ts` | Logging utility |
| `types/index.ts` | TypeScript interfaces |

---

## 10. Critical Integration Points

### Frontend-Backend Contract

**Upload Endpoint:**
```
POST /api/upload
Content-Type: multipart/form-data

Body:
- file: CSV file
- pump1: "Glucose" | "Glycerol"
- pump2: "Base" | "Acid"

Response:
{
  success: boolean,
  runId: string,
  clientName: string,
  recordsInserted: number,
  error?: string,
  code?: string
}
```

**List Runs Endpoint:**
```
GET /api/runs?limit=50&offset=0

Response:
{
  success: boolean,
  runs: [{ run_id, client_name, created_at }],
  total: number,
  limit: number,
  offset: number
}
```

**Get Run Endpoint:**
```
GET /api/runs/:runId

Response:
{
  success: boolean,
  runId: string,
  clientName: string,
  createdAt: string,
  data: [{ time_stamp, parameter, process_value, units }],
  chartData: [plotly traces],
  error?: string,
  code?: string
}
```

### Key Dependencies

**Frontend:**
- Next.js 16: Framework and routing
- React 19: UI library
- Axios 1.13: HTTP client
- Plotly.js: Visualization
- TailwindCSS 4: Styling
- Papaparse 5: CSV parsing (validation)

**Backend:**
- Express 4.18: HTTP framework
- Multer 1.4: File upload handling
- Supabase JS 2.38: Database client
- Papaparse 5.4: CSV parsing
- TypeScript 5.3: Language

---

## Quick Reference: How Key Features Work

### Feature: Upload CSV
1. User selects file via drag-drop or file input
2. Frontend validates file (size, name format, MIME type)
3. User selects pump mappings (Pump1 → Glucose/Glycerol, Pump2 → Base/Acid)
4. Form submits via Axios POST to `/api/upload`
5. Backend validates CSV structure
6. Backend parses CSV, transforming column headers per pump selections
7. Backend inserts run metadata + time-series data in batches
8. Frontend receives run ID and record count
9. Toast notification shows success
10. Run history auto-refreshes

### Feature: View Run
1. User clicks run in sidebar history
2. Frontend calls `apiClient.getRunData(runId)`
3. Backend queries `run_client` and `run_time_series_data` tables
4. Backend transforms data to Plotly trace format
5. Frontend receives data and renders interactive chart
6. User can zoom, pan, hover for details

---

## Development Tips

1. **Adding new parameter:** Modify `colorMap` in `csv-parser.ts`, update validation
2. **Changing chart layout:** Edit `transformToPlotlyFormat()` or Plotly config in component
3. **Database schema changes:** Use Supabase SQL Editor, update types
4. **New API endpoint:** Add route file in `/routes`, mount in `index.ts`
5. **Error debugging:** Check error code returned in response, check backend logs

---

## Conclusion

This architecture prioritizes:
- **Simplicity:** Single-page app with clear data flow
- **Type Safety:** Full TypeScript throughout
- **Scalability:** Pagination, batching, indexing
- **User Experience:** Real-time feedback, interactive charts, intuitive UI
- **Maintainability:** Separated concerns, documented patterns, consistent error handling
