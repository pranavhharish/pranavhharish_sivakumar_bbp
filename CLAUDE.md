# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Fermentation Data Platform** - A full-stack web application for uploading, storing, and visualizing fermentation run data. Users upload CSV files with fermentation parameters, which are parsed, stored in PostgreSQL via Supabase, and visualized with interactive Plotly charts.

**Tech Stack:**
- Frontend: Next.js 16 + React 19 + TailwindCSS 4
- Backend: Node.js + Express + TypeScript
- Database: Supabase (PostgreSQL)
- File Handling: Multer (backend) + PapaParse (CSV parsing)
- Visualization: Plotly.js

---

## Common Development Commands

### Root Level

```bash
npm run install-all      # Install dependencies in all packages
npm run dev:backend      # Start backend dev server on port 3000
npm run dev:frontend     # Start frontend dev server on port 3000
npm run build:all        # Production build for backend and frontend
npm run test:backend     # Run backend tests
npm run lint:all         # Lint all packages
```

### Frontend (`frontend/`)

```bash
npm run dev              # Development server with hot reload
npm run build            # Production build
npm run start            # Run production build
npm run lint             # ESLint check
```

### Backend (`backend/`)

```bash
npm run dev              # Development server with auto-restart (tsx watch)
npm run build            # TypeScript compilation to dist/
npm run start            # Run compiled code
npm run test             # Run tests (Vitest)
npm run test:coverage    # Test coverage report
npm run lint             # ESLint check
npm run format           # Prettier formatting
```

### Database (`database/`)

```bash
npm run init             # Print SQL initialization statements to console
```

### Quick Development Setup

**Terminal 1 - Backend:**
```bash
cd backend
npm install
cp .env.example .env     # Fill in SUPABASE_URL and SUPABASE_KEY
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev              # Proxies API calls to backend on port 3000
```

---

## High-Level Architecture

### Project Structure

```
.
├── frontend/             # Next.js frontend application
├── backend/              # Express API server (TypeScript)
├── database/             # Schema initialization scripts
├── docs/                 # Documentation (includes detailed CLAUDE.md)
├── package.json          # Root monorepo scripts
├── CLAUDE.md             # This file
└── .env                  # Environment variables (not committed)
```

### Data Flow

```
CSV Upload (Frontend)
    ↓
File & Filename Validation (Frontend)
    ↓
HTTP POST /api/upload with FormData
    ↓
CSV Parsing, Pump Mapping, Validation (Backend)
    ↓
Database Insert: run_client + run_time_series_data (Batched)
    ↓
Response with Run ID & Record Count
    ↓
Display Results & Refresh Run History (Frontend)
    ↓
User Clicks Run in History
    ↓
GET /api/runs/:runId
    ↓
Transform Time-Series Data to Plotly Traces
    ↓
Render Interactive Dual-Axis Chart (Frontend)
```

### Frontend Architecture (`frontend/src`)

**Main State Container:** `app/page.tsx` (client component)
- Manages `currentRun`, `refreshTrigger`, `isLoading`, and toasts
- Orchestrates file upload, run selection, and data visualization
- 4-column responsive grid: 1 column sidebar + 3 columns content

**Key Components:**
- `UploadForm.tsx` - File input, pump selection (Glucose|Glycerol, Base|Acid), upload progress
- `DataVisualization.tsx` - Plotly.js dual Y-axis chart rendering
- `RunHistory.tsx` - Paginated run history (50 per page, auto-refresh)
- `Toast.tsx` - Notification UI
- `useToast.ts` - Toast state management hook

**API Client:**
- `lib/apiClient.ts` - Singleton Axios instance with error handling
- Methods: `uploadFile()`, `getRunData()`, `listRuns()`
- Base URL: `NEXT_PUBLIC_API_URL` env variable (default: `http://localhost:3000`)

### Backend Architecture (`backend/src`)

**Express Middleware Stack:**
1. CORS (dev: wildcard, prod: restricted)
2. JSON body parsing (10MB limit)
3. Request logging
4. Routes mounting (see below)
5. 404 handler
6. Error handler (must be last)

**API Endpoints:**
- `POST /api/upload` - File upload with pump mapping
- `GET /api/runs?limit=50&offset=0` - List runs with pagination
- `GET /api/runs/:runId` - Get specific run with time-series data and Plotly traces

**Upload Validation Pipeline:** (`src/routes/upload.ts`)
1. File type & size validation
2. Pump selection validation (Glucose|Glycerol, Base|Acid)
3. Filename pattern validation: `ClientXXX_RXXXXXX_Online_Report_BostonBioprocess.csv`
4. CSV structure validation (required columns: Time Stamp, Parameter, Process value, Units)
5. Data type validation (numeric fields)
6. Database insert with batching (1000 records per batch)

**Error Handling:**
- Structured responses: `{ success, error, code }`
- Error codes: `INVALID_FILE`, `MISSING_PARAMETERS`, `INVALID_FILENAME`, `INVALID_CSV_FORMAT`, `DATABASE_ERROR`, `DUPLICATE_RUN_ID`
- `middleware/errorHandler.ts` with `asyncHandler` wrapper for Promise rejection handling

**Database Layer:** (`src/utils/db.ts`)
- Supabase operations: insert with duplicate check, getRunData, listRuns with pagination
- Rollback on error (deletes run metadata if data insert fails)
- Batched inserts (1000 records per batch to avoid timeouts)

### Database Schema

**Table: `run_client`** (Run metadata)
```sql
run_id VARCHAR(20) PRIMARY KEY
client_name VARCHAR(100) NOT NULL
created_at TIMESTAMP DEFAULT NOW()
```

**Table: `run_time_series_data`** (Time-series measurements)
```sql
id SERIAL PRIMARY KEY
run_id VARCHAR(20) FK → run_client(run_id) ON DELETE CASCADE
time_stamp FLOAT NOT NULL
parameter VARCHAR(50) NOT NULL         -- pH, Temperature, Glucose, etc.
process_value FLOAT NOT NULL
units VARCHAR(20) NOT NULL
created_at TIMESTAMP DEFAULT NOW()

CREATE INDEX idx_run_time_series_run_id ON run_time_series_data(run_id)
CREATE INDEX idx_run_time_series_parameter ON run_time_series_data(parameter)
```

**Initialization:** Run `npm run init` in `database/` to generate SQL statements, then execute manually in Supabase SQL Editor (Supabase JS client doesn't support raw SQL).

---

## Key Implementation Details

### CSV Format & Processing

**Expected Filename Format:**
```
ClientXXX_RXXXXXX_Online_Report_BostonBioprocess.csv
```
Regex: `/^(Client[A-Z]+)_([Rr]\d{6})_Online_Report_BostonBioprocess\.csv$/`

**Expected CSV Structure:**
```
Row 1: Metadata (ignored)
Row 2: Empty or ignored
Row 3: Headers (Time Stamp,Parameter,Process value,Units)
Row 4+: Data rows
```

**Parameter Mapping:** (`src/utils/csv-parser.ts`)
- "Pump1" → User-selected value (`Glucose` or `Glycerol`)
- "Pump2" → User-selected value (`Base` or `Acid`)
- Other parameters (pH, Temperature) → Passed through unchanged

**Plotly Chart Configuration:**
- Left Y-axis: pH, Glucose, Glycerol, Base, Acid
- Right Y-axis: Temperature (prevents scale mismatch)
- Color map: pH=#3B82F6, Temp=#EF4444, Pumps=#F97316, Base/Acid=#10B981
- Interactive: hover, zoom, pan, download as PNG, legend toggle

### Environment Configuration

**Single Root `.env` file** (for local development):

All environment variables are configured in a single `.env` file at the root level:

```bash
# Supabase Database Configuration
SUPABASE_URL=https://epcrmbmvyzofdcqqtmau.supabase.co
SUPABASE_KEY=eyJhbGc...

# Node Environment
NODE_ENV=development

# Backend Server Configuration
PORT=3000
HOST=localhost

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000

# Frontend URL (for CORS in development)
FRONTEND_URL=*

# Logging Configuration
LOG_LEVEL=info

# File Upload Settings
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=text/csv
```

**Local Development Setup:**
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

**Git Handling:**
- `.env` file is git-ignored (secrets are safe)
- Only `.env.example` is committed (template for configuration)
- Vercel dashboard provides environment variables in production (no `.env` file needed)

### API Contracts

**POST /api/upload**
```
Request: multipart/form-data
  file (CSV), pump1 ("Glucose"|"Glycerol"), pump2 ("Base"|"Acid")

Response:
  { success: boolean, runId: string, clientName: string, recordsInserted: number, error?: string, code?: string }
```

**GET /api/runs?limit=50&offset=0**
```
Response:
  { success: boolean, runs: [...], total: number, limit: number, offset: number }
```

**GET /api/runs/:runId**
```
Response:
  { success: boolean, runId: string, clientName: string, data: [...], chartData: [...], error?: string, code?: string }
```

---

## Design Patterns & Conventions

### Frontend
1. **Client Components**: All interactive components use `'use client'` directive
2. **State Management**: Lifted to `page.tsx`, props passed down
3. **API Client**: Singleton pattern with centralized error handling
4. **Responsive Design**: TailwindCSS mobile-first (4-column grid)
5. **Type Safety**: Full TypeScript with exported interfaces

### Backend
1. **TypeScript Strict Mode**: Full type safety enforced
2. **Async/Await**: All database operations use async patterns
3. **Early Validation**: Input validated at route entry
4. **Batching**: Large inserts split into 1000-record batches
5. **Pagination**: Supports `limit` (default 50, max 100) and `offset`
6. **Error Consistency**: Structured responses with error codes
7. **Rollback on Failure**: If data insert fails, run metadata is deleted

---

## Critical File Reference

### Frontend Key Files
- `frontend/src/app/page.tsx:1` - Main orchestrator with state & layout
- `frontend/src/components/UploadForm.tsx` - File upload & pump selection
- `frontend/src/components/DataVisualization.tsx` - Plotly chart rendering
- `frontend/src/components/RunHistory.tsx` - Run list with pagination
- `frontend/src/lib/apiClient.ts` - HTTP API wrapper (Axios singleton)
- `frontend/src/types/index.ts` - TypeScript interfaces

### Backend Key Files
- `backend/src/index.ts` - Express setup, middleware, routes
- `backend/src/routes/upload.ts` - POST /api/upload with full validation pipeline
- `backend/src/routes/runs.ts` - GET /api/runs endpoints
- `backend/src/utils/csv-parser.ts` - CSV transformation and Plotly formatting
- `backend/src/utils/db.ts` - Supabase database operations
- `backend/src/utils/validation.ts` - Input validation functions
- `backend/src/config/index.ts` - Environment config singleton
- `backend/src/middleware/errorHandler.ts` - Error handling & asyncHandler wrapper
- `backend/src/types/index.ts` - TypeScript interfaces & error codes

---

## Performance Considerations

- **Batch Inserts**: 1000 records per batch to avoid timeout on large CSVs
- **Pagination**: Default 50 runs, max 100 (prevents loading entire history)
- **Database Indexes**: On `run_id` and `parameter` for query performance
- **File Size Limit**: 10MB via Multer and config validation
- **In-Memory Storage**: Multer uses memory (no disk I/O), suitable for development

---

## Testing

```bash
cd backend
npm test                # Run all tests (Vitest)
npm run test:coverage   # Coverage report
```

---

## Troubleshooting

**Port conflicts:** Change `PORT` in `.env` or kill process: `lsof -ti:3000 | xargs kill -9`

**Database connection errors:** Verify `SUPABASE_URL` and `SUPABASE_KEY` in `.env`

**TypeScript errors:** Run `npx tsc --noEmit` to check, or `npm run format && npm run lint -- --fix`

**CSV upload failures:** Check error code in response; verify filename format and CSV structure match expected format

**Chart not rendering:** Verify data is returned from `/api/runs/:runId`, check browser console for JavaScript errors

---

## Vercel Deployment (Single Project)

This project is configured to deploy as a **single Vercel project** hosting both frontend and backend.

### Configuration Files

- **`vercel.json`** - Configures Vercel to build and deploy the monorepo
  - Installs all packages (`npm run install-all`)
  - Builds both frontend and backend (`npm run build:all`)
  - Routes `/api/*` requests to backend
  - Routes all other requests to frontend

### Deployment Steps

1. **Connect repository to Vercel:**
   - Go to https://vercel.com
   - Import your GitHub repository
   - Select this project

2. **Configure environment variables in Vercel dashboard:**
   ```
   SUPABASE_URL=https://...supabase.co
   SUPABASE_KEY=eyJhbGc...
   NODE_ENV=production
   PORT=3000
   HOST=0.0.0.0
   NEXT_PUBLIC_API_URL=https://your-vercel-domain.vercel.app
   FRONTEND_URL=https://your-vercel-domain.vercel.app
   LOG_LEVEL=info
   MAX_FILE_SIZE=10485760
   ALLOWED_FILE_TYPES=text/csv
   ```

3. **Vercel automatically:**
   - Detects `vercel.json` configuration
   - Builds Next.js frontend and Node.js backend
   - Deploys both together
   - Routes requests appropriately

### Important Notes

⚠️ **Backend Port:** On Vercel, `PORT` is automatically set. Using `HOST=0.0.0.0` is required for serverless environments.

⚠️ **API URL:** Set `NEXT_PUBLIC_API_URL` to your Vercel domain (e.g., `https://my-app.vercel.app`). Frontend uses this to call backend API.

⚠️ **File Uploads:** Multer is configured for in-memory storage (no disk I/O). This works on Vercel's ephemeral filesystem.

⚠️ **Database Timeouts:** Vercel serverless has 10-30s timeout. Large CSV uploads might timeout. Monitor and optimize batch sizes if needed.

---

## Additional Documentation

For detailed architecture information, see `docs/CLAUDE.md` which includes:
- Complete directory structure walk-through
- In-depth component analysis
- Detailed API contract specifications
- Development workflow examples
