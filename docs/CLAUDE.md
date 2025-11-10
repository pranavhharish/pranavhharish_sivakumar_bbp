# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# Fermentation Data Platform - Architecture & Development Guide

## Project Overview

The Fermentation Data Platform is a full-stack web application for uploading, storing, and visualizing fermentation run data. It enables Boston Bioprocess users to upload CSV files, parse them with custom parameter mapping, store structured data in a PostgreSQL database via Supabase, and visualize time-series parameters through interactive charts.

**Tech Stack:**
- Frontend: Next.js 16 + React 19 + TailwindCSS 4
- Backend: Node.js + Express + TypeScript
- Database: Supabase (PostgreSQL)
- File Handling: Multer (backend) + Papaparse (CSV parsing)
- Visualization: Plotly.js

---

## Project Structure

```
.
├── frontend/              # Next.js frontend application
│   ├── src/
│   │   ├── app/          # App router, layouts, pages
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom hooks
│   │   ├── lib/          # Utilities (API client, CSV parser)
│   │   ├── styles/       # TailwindCSS globals
│   │   └── types/        # TypeScript interfaces
│   └── package.json
├── backend/               # Express API server
│   ├── src/
│   │   ├── config/       # Environment configuration
│   │   ├── middleware/   # Express middleware
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Database service layer
│   │   ├── utils/        # Helpers (CSV parsing, validation, database)
│   │   ├── types/        # TypeScript interfaces
│   │   └── index.ts      # Express app setup
│   └── package.json
├── database/              # Database schema & initialization
│   ├── init-db.js        # SQL generation script
│   └── package.json
├── CLAUDE.md             # This file
├── README.md             # Project overview and quick start
└── .env                  # Environment variables (not committed)
```

---

## Common Development Commands

### Frontend (`frontend/`)

```bash
# Development server with hot reload
npm run dev              # http://localhost:3000

# Production build
npm run build
npm run start

# Code quality
npm run lint            # Run ESLint
```

### Backend (`backend/`)

```bash
# Development server with hot reload & auto-restart
npm run dev              # http://localhost:3000

# Production build & run
npm run build            # Compile TypeScript
npm run start            # Run compiled code

# Code quality & testing
npm run test             # Run tests with Vitest
npm run test:coverage    # Test coverage report
npm run lint             # Run ESLint
npm run format           # Format with Prettier
```

### Database (`database/`)

```bash
# Generate SQL initialization statements
npm run init             # Prints SQL to console for manual execution
```

### Quick Development Workflow

**Terminal 1 - Start backend:**
```bash
cd backend
npm install
cp .env.example .env     # Fill in SUPABASE_URL and SUPABASE_KEY
npm run dev
```

**Terminal 2 - Start frontend:**
```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` and proxies API calls to the backend.

---

## High-Level Architecture

### Data Flow

```
CSV Upload (Frontend)
    ↓
File & CSV Structure Validation (Frontend)
    ↓
HTTP POST /api/upload with FormData (Backend)
    ↓
Filename Parsing, CSV Parsing, Pump Mapping (Backend)
    ↓
Database Insert (2 tables: run_client, run_time_series_data)
    ↓
Response with Run ID & Record Count
    ↓
Display Results & Refresh Run History (Frontend)
    ↓
User Clicks Run in History
    ↓
GET /api/runs/:runId (Backend)
    ↓
Transform Time-Series Data to Plotly Format
    ↓
Render Interactive Dual-Axis Chart (Frontend)
```

### Frontend Architecture

**Main State Container:** `frontend/src/app/page.tsx`
- Manages `currentRun`, `refreshTrigger`, `isLoading`, and toasts
- Orchestrates file upload, run selection, and data visualization
- Uses 4-column grid layout: 1 column sidebar + 3 columns content

**Key Components:**
- `UploadForm.tsx` - CSV file input, pump selection (Glucose|Glycerol, Base|Acid), upload with progress
- `DataVisualization.tsx` - Plotly.js dual Y-axis chart
- `RunHistory.tsx` - Paginated list of previous runs (50 per page)
- `Toast.tsx` - Notification UI component
- `useToast.ts` - Toast state management hook

**API Integration:**
- `lib/apiClient.ts` - Singleton Axios instance with centralized error handling
- Methods: `uploadFile()`, `getRunData()`, `listRuns()`
- Uses `NEXT_PUBLIC_API_URL` env variable (defaults to `http://localhost:3000`)

### Backend Architecture

**Express Middleware Stack (in `src/index.ts`):**
1. CORS (wildcard in dev, restricted in prod)
2. JSON body parsing (10MB limit)
3. Request logging
4. Routes mounting
5. 404 and error handlers (error handler must be last)

**API Endpoints:**
- `POST /api/upload` - File upload with pump mapping
- `GET /api/runs` - List runs with pagination (query: `limit`, `offset`)
- `GET /api/runs/:runId` - Get specific run with time-series data and Plotly traces

**Validation Pipeline (in `src/routes/upload.ts`):**
1. File type & size validation
2. Pump selection validation
3. Filename pattern validation (extract `ClientXXX` and `RXXXXXX`)
4. CSV structure validation (required columns: Time Stamp, Parameter, Process value, Units)
5. Data type validation (numeric fields)
6. Database insert with batching (1000 records per batch)

**Error Handling:**
- Structured error responses: `{ success, error, code }`
- Error codes: `INVALID_FILE`, `MISSING_PARAMETERS`, `INVALID_FILENAME`, `INVALID_CSV_FORMAT`, `DATABASE_ERROR`, `DUPLICATE_RUN_ID`
- Middleware: `middleware/errorHandler.ts` with `asyncHandler` wrapper for Promise rejection handling

**Database Layer:**
- `utils/db.ts` - Core Supabase operations
- `services/database.ts` - Alternative structured DatabaseService class (both available)
- Operations: insert with duplicate check, getRunData, listRuns with pagination
- Rollback on error (deletes run metadata if data insert fails)

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

**Initialization:** Run `database/init-db.js` to generate SQL statements, then execute in Supabase SQL Editor manually (Supabase JS client doesn't support raw SQL execution).

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

**Parameter Mapping (in `src/utils/csv-parser.ts`):**
- "Pump1" → User-selected value (`Glucose` or `Glycerol`)
- "Pump2" → User-selected value (`Base` or `Acid`)
- Other parameters (pH, Temperature) → Passed through unchanged

**Plotly Chart Configuration:**
- Left Y-axis: pH, Glucose, Glycerol, Base, Acid
- Right Y-axis: Temperature (prevents scale mismatch)
- Color map: pH=#3B82F6, Temp=#EF4444, Pumps=#F97316, Base/Acid=#10B981
- Interactive: hover, zoom, pan, download as PNG, legend toggle

### Environment Configuration

**Frontend (`frontend/.env.local`):**
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Backend (`backend/.env`):**
```
SUPABASE_URL=https://...supabase.co
SUPABASE_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...  (optional)
NODE_ENV=development
PORT=3000
HOST=localhost
MAX_FILE_SIZE=10485760          (bytes)
ALLOWED_FILE_TYPES=text/csv
LOG_LEVEL=info
FRONTEND_URL=*                   (CORS - use specific URL in prod)
```

**Root `.env` (for database initialization):**
```
SUPABASE_URL=https://...supabase.co
SUPABASE_KEY=eyJhbGc...
```

### API Contracts

**POST /api/upload**
```
Request:
  Content-Type: multipart/form-data
  Body: file (CSV), pump1 ("Glucose"|"Glycerol"), pump2 ("Base"|"Acid")

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
4. **Responsive Design**: TailwindCSS mobile-first
5. **Type Safety**: Full TypeScript with exported interfaces

### Backend
1. **TypeScript Strict Mode**: Full type safety enforced
2. **Async/Await**: All database operations use async patterns
3. **Early Validation**: Input validated at route entry
4. **Batching**: Large inserts split into 1000-record batches
5. **Pagination**: Supports `limit` (default 50, max 100) and `offset`
6. **Error Consistency**: Structured responses with error codes

### Database
1. **Rollback on Failure**: If data insert fails, run metadata is deleted
2. **Indexes**: Created on `run_id` and `parameter` for query performance
3. **Foreign Keys**: CASCADE delete from `run_client` to `run_time_series_data`

---

## Critical File Reference

### Frontend Key Files
- `frontend/src/app/page.tsx` - Main orchestrator with state & layout
- `frontend/src/app/layout.tsx` - Root HTML with metadata
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
- `backend/src/config/index.ts` - Environment config singleton with validation
- `backend/src/middleware/errorHandler.ts` - Error handling & asyncHandler wrapper
- `backend/src/types/index.ts` - TypeScript interfaces & error codes

---

## Performance Considerations

- **Batch Inserts**: 1000 records per batch to avoid timeout on large CSVs
- **Pagination**: Default 50 runs, max 100 (prevents loading entire history)
- **Database Indexes**: Automatically created on `run_id` and `parameter`
- **File Size Limit**: 10MB via Multer and config
- **In-Memory Storage**: Multer uses memory (no disk I/O), suitable for development

---

## Testing

Run backend tests with coverage:
```bash
cd backend
npm test                # Run all tests
npm run test:coverage   # Coverage report
```

Tests use Vitest framework.

---

## Deployment Notes

### Frontend (Vercel)
- Next.js builds and deploys automatically on push
- Set `NEXT_PUBLIC_API_URL` environment variable to point to backend
- Static assets served from CDN

### Backend (Options)
- **Vercel**: Deploy as serverless functions
- **Traditional**: Docker container or Node.js server
- **Docker**: See `Dockerfile` and `Dockerfile.dev`

### Database (Supabase)
- Managed PostgreSQL, automatic backups
- Schema initialized via SQL Editor or CLI

---

## Troubleshooting

**Port conflicts:** Change `PORT` in `.env` or kill process: `lsof -ti:3000 | xargs kill -9`

**Database connection errors:** Verify `SUPABASE_URL` and `SUPABASE_KEY` in `.env`

**TypeScript errors:** Run `npx tsc --noEmit` to check, or `npm run format && npm run lint -- --fix`

**CSV upload failures:** Check error code in response; verify filename format and CSV structure match expected format

**Chart not rendering:** Verify data is returned from `/api/runs/:runId`, check browser console for JavaScript errors

---

## Quick Reference: How Features Work

### Uploading a CSV
1. User selects file via drag-drop or input
2. Frontend validates file (size, name format, MIME type) before upload
3. User selects pump mappings
4. Frontend POSTs to `/api/upload` with FormData
5. Backend validates CSV structure and extracts metadata
6. Backend parses CSV with pump parameter substitution
7. Backend inserts run + time-series data in batches with rollback on error
8. Frontend shows success toast and refreshes run history

### Viewing a Run
1. User clicks run in history sidebar
2. Frontend calls `GET /api/runs/:runId`
3. Backend retrieves run metadata and time-series data
4. Backend transforms data to Plotly trace format
5. Frontend renders dual-axis interactive chart
6. User can zoom, pan, hover for details, download as PNG

