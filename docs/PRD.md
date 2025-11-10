# Product Requirements Document (PRD)
# Fermentation Data Platform

**Version:** 1.0  
**Last Updated:** November 9, 2025  
**Author:** Pranavh  
**Project Duration:** 1 day  

---

## 1. Executive Summary

### 1.1 Project Overview
Build a single-page web application that allows Boston Bioprocess users to upload fermentation run CSV files, store the data in a database, and visualize time-series parameters in an interactive chart.

### 1.2 Objectives
- Enable CSV file upload with custom parameter mapping
- Parse and store fermentation run data in a structured database
- Provide interactive visualization of time-series data
- Deliver a production-ready, deployed application

### 1.3 Success Criteria
- Working upload flow with validation
- Data correctly stored in database with proper schema
- Professional, interactive visualization of all 4 parameters
- Deployed application with live URL
- Docker setup for local development
- Comprehensive README documentation

---

## 2. Technical Stack

### 2.1 Frontend
- **Framework:** next.js
- **Styling:** TailwindCSS
- **Visualization:** Plotly.js (preferred) or Recharts
- **State Management:** React hooks (useState, useEffect)
- **HTTP Client:** Fetch API or Axios

### 2.2 Backend
- **Runtime:** Node.js 18+
- **Framework:** Vercel Serverless Functions (or Express for local)
- **CSV Parsing:** papaparse
- **Validation:** Custom validation utilities

### 2.3 Database
- **Provider:** Supabase (PostgreSQL)
- **Tables:** 
  - `run_client` (run metadata)
  - `run_time_series_data` (time-series records)

### 2.4 Infrastructure
- **Hosting:** Vercel (frontend + serverless functions)
- **Database:** Supabase (managed PostgreSQL)
- **Local Development:** Docker Compose
- **Version Control:** Git + GitHub

---

## 3. Data Model

### 3.1 Database Schema

#### Table: `run_client`
````sql
CREATE TABLE run_client (
  run_id VARCHAR(20) PRIMARY KEY,
  client_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
````

| Column | Type | Description |
|--------|------|-------------|
| run_id | VARCHAR(20) | Unique run identifier (e.g., "R001001") |
| client_name | VARCHAR(100) | Client name (e.g., "ClientABC") |
| created_at | TIMESTAMP | Record creation timestamp |

#### Table: `run_time_series_data`
````sql
CREATE TABLE run_time_series_data (
  id SERIAL PRIMARY KEY,
  run_id VARCHAR(20) REFERENCES run_client(run_id) ON DELETE CASCADE,
  time_stamp FLOAT NOT NULL,
  parameter VARCHAR(50) NOT NULL,
  process_value FLOAT NOT NULL,
  units VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_run_time_series_run_id ON run_time_series_data(run_id);
CREATE INDEX idx_run_time_series_parameter ON run_time_series_data(parameter);
````

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Auto-increment primary key |
| run_id | VARCHAR(20) | Foreign key to run_client |
| time_stamp | FLOAT | Time value from CSV |
| parameter | VARCHAR(50) | Parameter name (pH, Temperature, Glucose, etc.) |
| process_value | FLOAT | Measured value |
| units | VARCHAR(20) | Unit of measurement (pH, DegC, %) |
| created_at | TIMESTAMP | Record creation timestamp |

### 3.2 CSV File Format

**Filename Pattern:**
````
{ClientName}_{RunID}_Online_Report_BostonBioprocess.csv
Example: ClientABC_R001001_Online_Report_BostonBioprocess.csv
````

**CSV Structure:**
````
Row 1: ClientABC_R001001: DataLog Param, PV and Units
Row 2: (empty)
Row 3: Time Stamp,Parameter,Process value,Units
Row 4+: 0.009,pH,5.99,pH
        0.009,Pump1,0,%
        0.009,Pump2,0,%
        0.009,Temperature,28.01,DegC
````

**Parameter Mapping:**
- `Pump1` → User selects: **Glucose** or **Glycerol**
- `Pump2` → User selects: **Base** or **Acid**
- `pH` → Remains as **pH**
- `Temperature` → Remains as **Temperature**

---

## 4. Features & Requirements

### 4.1 File Upload (Priority: CRITICAL)

#### 4.1.1 Upload Form
**Requirements:**
- Drag-and-drop file upload area
- Click to browse file selection
- Two dropdown selectors:
  - Pump1 options: ["Glucose", "Glycerol"]
  - Pump2 options: ["Base", "Acid"]
- Submit button (disabled until file + selections made)

**Validation:**
- File type: Only `.csv` files accepted
- File size: Maximum 10MB
- Filename format: Must match pattern `Client*_R######_Online_Report_BostonBioprocess.csv`
- Selections required: Both pump selections must be made

**UI States:**
- Empty state: Show instructions and upload area
- File selected: Display filename, size, and selections
- Uploading: Show progress spinner with "Uploading and processing..."
- Success: Show success message with run ID
- Error: Display specific error message with retry option

#### 4.1.2 CSV Parsing Logic
**Steps:**
1. Extract client name and run ID from filename
2. Skip first 2 rows of CSV
3. Parse from row 3 onwards (Time Stamp, Parameter, Process value, Units)
4. Replace "Pump1" with user's Pump1 selection
5. Replace "Pump2" with user's Pump2 selection
6. Keep pH and Temperature as-is

**Error Handling:**
- Missing required columns
- Invalid data types (non-numeric values)
- Empty CSV file
- Malformed CSV structure

### 4.2 Data Storage (Priority: CRITICAL)

#### 4.2.1 Database Operations
**Insert Flow:**
1. Check if run_id already exists in `run_client`
   - If exists: Return error "Run ID already exists"
   - If not: Proceed
2. Insert into `run_client`: (run_id, client_name)
3. Batch insert into `run_time_series_data`: All time-series rows

**Transaction Handling:**
- Use database transactions to ensure atomicity
- Rollback if any insert fails
- Return appropriate error messages

### 4.3 Data Visualization (Priority: CRITICAL)

#### 4.3.1 Chart Requirements
**Type:** Interactive line chart with multiple traces

**Features:**
- 4 separate traces (one per parameter):
  - pH (left Y-axis)
  - Temperature (right Y-axis)
  - Pump1 selection (left Y-axis)
  - Pump2 selection (right Y-axis)
- X-axis: Time (from time_stamp column)
- Interactive legend (click to show/hide traces)
- Zoom and pan controls
- Hover tooltips showing exact values
- Responsive design (works on different screen sizes)

**Chart Configuration:**
````javascript
{
  title: `Run ${runId} - ${clientName}`,
  xaxis: { title: 'Time' },
  yaxis: { title: 'pH / Percentage (%)' },
  yaxis2: { 
    title: 'Temperature (DegC)', 
    overlaying: 'y', 
    side: 'right' 
  },
  legend: { x: 1.1, y: 1 },
  hovermode: 'closest'
}
````

**Color Scheme:**
- pH: Blue (#3B82F6)
- Temperature: Red (#EF4444)
- Pump1 (Glucose/Glycerol): Orange (#F97316)
- Pump2 (Base/Acid): Green (#10B981)

### 4.4 Run History (Priority: SHOULD-HAVE)

#### 4.4.1 Run List View
**Requirements:**
- Display list of all uploaded runs
- Show: Run ID, Client Name, Upload Date
- Click to view visualization
- Sort by: Most recent first

**Implementation:**
- Sidebar or dropdown component
- Fetch from `run_client` table ordered by `created_at DESC`
- Limit to 50 most recent runs

### 4.5 Additional Features (Priority: NICE-TO-HAVE)

#### 4.5.1 Data Table Toggle
- Toggle button to switch between chart and data table
- Table shows: Time, Parameter, Value, Units
- Sortable columns
- Pagination (50 rows per page)

#### 4.5.2 Export Functionality
- Download chart as PNG image
- Export data as CSV
- Copy chart URL to clipboard

---

## 5. API Specification

### 5.1 Endpoints

#### POST `/api/upload`
**Description:** Upload and process CSV file

**Request:**
````
Content-Type: multipart/form-data

FormData:
- file: <CSV file>
- pump1: "Glucose" | "Glycerol"
- pump2: "Base" | "Acid"
````

**Response (Success):**
````json
{
  "success": true,
  "runId": "R001001",
  "clientName": "ClientABC",
  "recordsInserted": 1000,
  "message": "File uploaded and processed successfully"
}
````

**Response (Error):**
````json
{
  "success": false,
  "error": "Run ID R001001 already exists",
  "code": "DUPLICATE_RUN_ID"
}
````

**Error Codes:**
- `INVALID_FILE_TYPE`: File is not CSV
- `INVALID_FILENAME`: Filename doesn't match pattern
- `FILE_TOO_LARGE`: File exceeds 10MB
- `DUPLICATE_RUN_ID`: Run ID already in database
- `INVALID_CSV_FORMAT`: CSV structure is incorrect
- `MISSING_PARAMETERS`: Required selections not provided
- `DATABASE_ERROR`: Database operation failed

#### GET `/api/runs/:runId`
**Description:** Fetch time-series data for a specific run

**Response (Success):**
````json
{
  "success": true,
  "runId": "R001001",
  "clientName": "ClientABC",
  "data": [
    {
      "time_stamp": 0.009,
      "parameter": "pH",
      "process_value": 5.99,
      "units": "pH"
    },
    {
      "time_stamp": 0.009,
      "parameter": "Glucose",
      "process_value": 0,
      "units": "%"
    }
    // ... more records
  ]
}
````

**Response (Error):**
````json
{
  "success": false,
  "error": "Run ID not found",
  "code": "RUN_NOT_FOUND"
}
````

#### GET `/api/runs`
**Description:** List all runs (for history view)

**Query Parameters:**
- `limit` (optional): Number of runs to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
````json
{
  "success": true,
  "runs": [
    {
      "run_id": "R001002",
      "client_name": "ClientDEF",
      "created_at": "2025-11-09T10:30:00Z"
    },
    {
      "run_id": "R001001",
      "client_name": "ClientABC",
      "created_at": "2025-11-08T15:20:00Z"
    }
  ],
  "total": 2
}
````

---

## 6. UI/UX Specifications

### 6.1 Layout Structure
````
┌─────────────────────────────────────────────────────┐
│  Header: "Fermentation Data Platform"              │
│  Logo + Title                                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────────────────────────────────────┐    │
│  │                                           │    │
│  │   UPLOAD SECTION                         │    │
│  │   - Drag & drop area                     │    │
│  │   - Pump1 dropdown                       │    │
│  │   - Pump2 dropdown                       │    │
│  │   - Submit button                        │    │
│  │                                           │    │
│  └───────────────────────────────────────────┘    │
│                                                     │
│  ┌───────────────────────────────────────────┐    │
│  │                                           │    │
│  │   VISUALIZATION SECTION                   │    │
│  │   - Chart title (Run ID + Client)        │    │
│  │   - Plotly interactive chart             │    │
│  │   - Export options                       │    │
│  │                                           │    │
│  └───────────────────────────────────────────┘    │
│                                                     │
│  ┌───────────────────────────────────────────┐    │
│  │   HISTORY SIDEBAR (collapsible)          │    │
│  │   - List of past runs                    │    │
│  └───────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
````

### 6.2 Component Specifications

#### 6.2.1 UploadForm Component
**Props:** None (handles its own state)

**State:**
````javascript
{
  file: null,
  pump1: "",
  pump2: "",
  isUploading: false,
  error: null,
  success: null
}
````

**Styling:**
- Border: Dashed border with hover effect
- Colors: TailwindCSS blue-600 for primary actions
- Spacing: p-6, rounded-lg, shadow-md
- Responsive: Full width on mobile, max-w-2xl on desktop

#### 6.2.2 DataVisualization Component
**Props:**
````javascript
{
  runId: string,
  clientName: string,
  data: Array<TimeSeriesData>
}
````

**Features:**
- Loading skeleton while fetching data
- Empty state if no data
- Chart rendered with Plotly.react()
- Export button in top-right corner

#### 6.2.3 RunHistory Component (Optional)
**Props:** None

**Features:**
- Collapsible sidebar
- Searchable list
- Click handler to load run data

### 6.3 Responsive Design

**Breakpoints:**
- Mobile: < 640px (sm)
- Tablet: 640px - 1024px (md)
- Desktop: > 1024px (lg)

**Adjustments:**
- Mobile: Stack form elements vertically, full-width chart
- Tablet: 2-column form layout, full-width chart
- Desktop: 2-column form, chart with sidebar

### 6.4 Accessibility

**Requirements:**
- All form inputs have labels
- Keyboard navigation support (Tab, Enter, Escape)
- ARIA labels for buttons and interactive elements
- Color contrast meets WCAG AA standards
- Error messages announced to screen readers
- Focus indicators visible

---

## 7. Validation Rules

### 7.1 File Validation

| Rule | Validation | Error Message |
|------|-----------|---------------|
| File required | file !== null | "Please select a file to upload" |
| File type | file.type === 'text/csv' | "Only CSV files are accepted" |
| File size | file.size <= 10MB | "File size must be less than 10MB" |
| Filename format | Matches regex pattern | "Filename must match format: ClientXXX_RXXXXXX_Online_Report_BostonBioprocess.csv" |

**Filename Regex:**
````javascript
/^Client[A-Z]+_R\d{6}_Online_Report_BostonBioprocess\.csv$/
````

### 7.2 Form Validation

| Field | Validation | Error Message |
|-------|-----------|---------------|
| Pump1 | ['Glucose', 'Glycerol'].includes(value) | "Please select Pump1 type" |
| Pump2 | ['Base', 'Acid'].includes(value) | "Please select Pump2 type" |

### 7.3 CSV Structure Validation

**Required Columns:** Time Stamp, Parameter, Process value, Units

**Data Type Checks:**
- Time Stamp: Must be numeric
- Process value: Must be numeric
- Parameter: Must be string
- Units: Must be string

**Row Validation:**
- Minimum 1 data row after header (row 3+)
- All 4 parameters must be present for each timestamp

---

## 8. Error Handling

### 8.1 Frontend Error Handling

**Display Strategy:**
- Toast notifications for transient errors
- Inline error messages for form validation
- Modal for critical errors (e.g., network failure)

**Error Message Format:**
````javascript
{
  type: 'error' | 'warning' | 'info',
  title: 'Brief error title',
  message: 'Detailed explanation',
  action: 'Retry' | 'Dismiss' (optional)
}
````

### 8.2 Backend Error Handling

**Response Format:**
````javascript
{
  success: false,
  error: "Human-readable error message",
  code: "MACHINE_READABLE_CODE",
  details: {} // Optional: Additional context
}
````

**Error Logging:**
- Log all errors to console with stack traces
- Include timestamp, endpoint, and request details
- Consider Sentry integration (mention in README)

---

## 9. Performance Requirements

### 9.1 Response Time Targets

| Operation | Target | Acceptable |
|-----------|--------|-----------|
| Page load | < 2s | < 3s |
| File upload (5MB) | < 5s | < 10s |
| Data fetch | < 1s | < 2s |
| Chart render | < 1s | < 2s |

### 9.2 Optimization Strategies

**Frontend:**
- Code splitting: Lazy load Plotly
- Image optimization: Compress logo/icons
- Bundle size: < 500KB initial load
- Caching: Cache API responses for 5 minutes

**Backend:**
- Batch database inserts (all rows in one query)
- Database indexing on frequently queried columns
- Connection pooling for Supabase client
- Streaming CSV parsing for large files

### 9.3 Scalability Considerations

**Database:**
- Index on `run_id` in both tables
- Partitioning strategy for large datasets (future)
- Archive old runs after 1 year (future)

**Backend:**
- Serverless functions auto-scale
- Supabase handles up to 500 concurrent connections
- Consider background job queue for large uploads (future)

---

## 10. Security Requirements

### 10.1 Input Sanitization

**File Upload:**
- Validate file type on both client and server
- Limit file size to prevent DoS
- Scan filenames for malicious patterns

**CSV Parsing:**
- Use parameterized queries (Supabase client handles this)
- Escape special characters in string fields
- Validate numeric ranges

### 10.2 Authentication (Future Enhancement)

**Current:** No authentication required for assignment

**Future:**
- User accounts with email/password
- Role-based access control (admin, viewer)
- API key authentication for programmatic access

### 10.3 Environment Variables

**Required Variables:**
````
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (server-side only)
````

**Security:**
- Never commit `.env` files
- Use `.env.example` for template
- Rotate keys periodically

---

## 11. Testing Strategy

### 11.1 Unit Tests

**Coverage Target:** 70%+ for core logic

**Priority Functions:**
````javascript
// CSV Parser
- parseFilename(filename) → {clientName, runId}
- transformCSVData(csvData, pump1, pump2) → transformedData
- validateCSVStructure(csvData) → {isValid, errors}

// Validation
- validateFile(file) → {isValid, errors}
- validatePumpSelections(pump1, pump2) → {isValid, errors}

// Data Transformation
- groupDataByParameter(data) → groupedData
- formatChartData(data) → plotlyFormat
````

### 11.2 Integration Tests

**Test Scenarios:**
````javascript
// Upload Flow
1. Upload valid CSV → Success response
2. Upload duplicate run ID → Error response
3. Upload invalid filename → Error response
4. Upload with missing selections → Error response

// Data Retrieval
1. Fetch existing run → Returns correct data
2. Fetch non-existent run → 404 error
3. Fetch with malformed runId → 400 error
````

### 11.3 Manual Testing Checklist

- [ ] Upload valid CSV with all parameters
- [ ] Upload CSV with invalid filename
- [ ] Upload non-CSV file
- [ ] Upload duplicate run ID
- [ ] Upload without pump selections
- [ ] Upload file larger than 10MB
- [ ] Visualization renders all 4 parameters
- [ ] Legend click toggles trace visibility
- [ ] Zoom and pan work correctly
- [ ] Hover tooltips display accurate values
- [ ] Chart responsive on mobile/tablet
- [ ] Run history loads and filters correctly
- [ ] Page works without JavaScript (graceful degradation)

---

## 12. Docker Configuration

### 12.1 Local Development Setup

**docker-compose.yml:**
````yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:3000
      - VITE_SUPABASE_URL=${SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    volumes:
      - ./src:/app/src
      - ./public:/app/public
    command: npm run dev

  # Optional: Local API server (mirrors Vercel functions)
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
    volumes:
      - ./api:/app
````

**Dockerfile.dev (Frontend):**
````dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
````

### 12.2 Production Deployment

**Platform:** Vercel

**Deployment Steps:**
1. Connect GitHub repository
2. Configure environment variables in Vercel dashboard
3. Deploy (automatic on push to main branch)

**Environment Variables (Vercel):**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY` (for API routes)

---

## 13. Documentation Requirements

### 13.1 README.md Structure
````markdown
# Fermentation Data Platform

## Overview
Brief description

## Features
- Feature 1
- Feature 2

## Tech Stack
- Frontend: React + Vite + TailwindCSS
- Backend: Node.js + Vercel Serverless
- Database: Supabase (PostgreSQL)

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account

### Installation
```bash
git clone <repo>
cd fermentation-data-platform
npm install
```

### Environment Setup
```bash
cp .env.example .env
# Add your Supabase credentials
```

### Run Locally (Without Docker)
```bash
npm run dev
```

### Run Locally (With Docker)
```bash
docker-compose up
```

## Deployment
Deployed on Vercel: [Live Link]

## API Documentation
See [API.md](./docs/API.md)

## Architecture
See [ARCHITECTURE.md](./docs/ARCHITECTURE.md)

## Testing
See testing strategy in code

## Design Decisions

### Why Serverless?
Explanation...

### Why Supabase?
Explanation...

## Future Enhancements
- User authentication
- Run comparison
- Advanced filtering

## License
MIT
````

### 13.2 Additional Documentation Files

**docs/API.md:**
- Detailed API endpoint documentation
- Request/response examples
- Error code reference

**docs/ARCHITECTURE.md:**
- System architecture diagram
- Data flow diagrams
- Technology choices explained

**docs/DEPLOYMENT.md:**
- Step-by-step deployment guide
- Environment configuration
- Troubleshooting common issues

---

## 14. Project Timeline

### Phase 1: Setup & Core Backend (3-4 hours)
- [ ] Initialize Vite + React project
- [ ] Setup TailwindCSS
- [ ] Create Supabase project and tables
- [ ] Implement CSV parsing logic
- [ ] Create `/api/upload` endpoint
- [ ] Test upload flow with Postman

### Phase 2: Frontend & Visualization (3-4 hours)
- [ ] Build UploadForm component
- [ ] Implement file validation
- [ ] Create DataVisualization component
- [ ] Integrate Plotly.js
- [ ] Connect frontend to backend
- [ ] Test full upload → visualize flow

### Phase 3: Polish & Docker (2-3 hours)
- [ ] Add loading states and error handling
- [ ] Implement run history (optional)
- [ ] Create Docker configuration
- [ ] Test Docker setup
- [ ] Write comprehensive README
- [ ] Deploy to Vercel

### Phase 4: Testing & Documentation (1-2 hours)
- [ ] Manual testing checklist
- [ ] Fix bugs
- [ ] Add comments to code
- [ ] Create API documentation
- [ ] Final review and polish

**Total Estimated Time:** 9-13 hours (fits within 1 day constraint)

---

## 15. Acceptance Criteria

### 15.1 Functional Requirements
✅ User can upload a CSV file  
✅ User can select Pump1 and Pump2 options  
✅ System parses CSV and extracts client name + run ID from filename  
✅ System replaces Pump1/Pump2 with user selections  
✅ Data is stored in two database tables with proper schema  
✅ User sees interactive chart with all 4 parameters  
✅ Chart has zoom, pan, and legend controls  
✅ Application handles errors gracefully  
✅ Application works on mobile, tablet, and desktop  

### 15.2 Non-Functional Requirements
✅ Application deployed and accessible via public URL  
✅ Docker Compose setup works for local development  
✅ README includes clear setup instructions  
✅ Code is modular and well-organized  
✅ UI is professional and intuitive  
✅ API responses are fast (< 3s for uploads)  

### 15.3 Code Quality
✅ Consistent code formatting (ESLint + Prettier)  
✅ Meaningful variable and function names  
✅ Adequate comments for complex logic  
✅ No console errors in browser  
✅ No security vulnerabilities (npm audit)  

---

## 16. Known Limitations & Future Enhancements

### 16.1 Current Limitations
- No user authentication
- No data editing or deletion features
- Limited to 10MB file uploads
- No real-time updates
- No data export functionality

### 16.2 Planned Enhancements
- User accounts and authentication
- Role-based access control
- Run comparison feature (overlay multiple runs)
- Advanced filtering and search
- Data export (CSV, Excel, PDF)
- Email notifications for upload status
- Batch upload (multiple files)
- API rate limiting
- Automated data quality checks
- Integration with lab equipment (future)

---

## 17. Contact & Support

**Developer:** Pranavh  
**GitHub:** [Your GitHub Profile]  
**LinkedIn:** [Your LinkedIn]  
**Email:** [Your Email]

**Submission:**
- GitHub Repository: `pranavh_bbp` (invite: vkhatavkar@bostonbioprocess.com)
- Live URL: [Vercel deployment link]
- Zip file: Submitted via email

---

## Appendix A: Sample Data

**Sample Filename:**
````
ClientDEF_R001002_Online_Report_BostonBioprocess.csv
````

**Expected Parsed Data:**
````javascript
{
  clientName: "ClientDEF",
  runId: "R001002",
  timeSeriesData: [
    { timestamp: 0.009, parameter: "pH", value: 5.99, units: "pH" },
    { timestamp: 0.009, parameter: "Glucose", value: 0, units: "%" },
    { timestamp: 0.009, parameter: "Base", value: 0, units: "%" },
    { timestamp: 0.009, parameter: "Temperature", value: 28.01, units: "DegC" }
  ]
}
````

---

## Appendix B: Color Palette

**Primary Colors:**
- Blue: #3B82F6 (primary actions, pH line)
- Red: #EF4444 (temperature line)
- Orange: #F97316 (pump1 line)
- Green: #10B981 (pump2 line)

**Neutral Colors:**
- Gray 50: #F9FAFB (backgrounds)
- Gray 200: #E5E7EB (borders)
- Gray 600: #4B5563 (text)
- Gray 900: #111827 (headings)

**Status Colors:**
- Success: #10B981
- Error: #EF4444
- Warning: #F59E0B
- Info: #3B82F6

---

## Appendix C: Git Commit Guidelines

**Branch Strategy:**
- `main`: Production-ready code
- `develop`: Development branch
- Feature branches: `feature/upload-form`, `feature/visualization`

**Commit Message Format:**
````
<type>: <subject>

<body> (optional)

Types: feat, fix, docs, style, refactor, test, chore
````

**Examples:**
````
feat: implement CSV upload endpoint
fix: handle duplicate run ID error
docs: update README with deployment instructions
refactor: extract CSV parsing logic into utility
````

---

**End of PRD**

---

## Quick Start Checklist

For immediate implementation, follow this order:

1. ✅ Setup Supabase project and create tables
2. ✅ Initialize Vite + React + TailwindCSS
3. ✅ Build CSV parsing utility
4. ✅ Create `/api/upload` serverless function
5. ✅ Build UploadForm component
6. ✅ Implement file validation
7. ✅ Create DataVisualization with Plotly
8. ✅ Connect frontend to API
9. ✅ Add error handling and loading states
10. ✅ Create Docker setup
11. ✅ Deploy to Vercel
12. ✅ Write README

**Priority: Get core flow working first, then polish!**