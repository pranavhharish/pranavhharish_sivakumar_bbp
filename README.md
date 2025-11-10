# Fermentation Data Platform - Backend API

Robust Node.js/Express backend for processing fermentation run data, handling CSV uploads, and providing REST APIs for data retrieval and visualization.

## Features

- ✅ **CSV File Upload & Processing** - Drag-and-drop file upload with parameter mapping
- ✅ **Data Validation** - Comprehensive file, format, and data type validation
- ✅ **Supabase Integration** - PostgreSQL database with optimized schema and indexes
- ✅ **REST API** - Complete CRUD operations for fermentation runs
- ✅ **Error Handling** - Structured error responses with detailed error codes
- ✅ **Logging** - Comprehensive application logging with configurable levels
- ✅ **Type Safety** - Full TypeScript implementation with strict type checking
- ✅ **Testing** - Unit tests for core utilities with Vitest

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript 5
- **Database:** Supabase (PostgreSQL)
- **CSV Parsing:** PapaParse
- **Testing:** Vitest
- **Linting:** ESLint + Prettier
- **Package Manager:** npm

## Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration management
│   │   └── index.ts         # Environment and app config
│   ├── middleware/          # Express middleware
│   │   └── errorHandler.ts  # Global error handling
│   ├── routes/              # API route handlers
│   │   ├── upload.ts        # POST /api/upload
│   │   └── runs.ts          # GET /api/runs, GET /api/runs/:runId
│   ├── services/            # Business logic services
│   │   └── database.ts      # Database operations
│   ├── types/               # TypeScript types and interfaces
│   │   └── index.ts         # Core type definitions
│   ├── utils/               # Utility functions
│   │   ├── csv-parser.ts    # CSV parsing and validation
│   │   ├── validators.ts    # Input validation utilities
│   │   ├── logger.ts        # Logging utility
│   │   ├── errors.ts        # Custom error classes
│   │   └── *.test.ts        # Unit tests
│   └── index.ts             # Application entry point
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript configuration
├── vitest.config.ts         # Test configuration
├── .env.example             # Environment variables template
└── README.md                # This file
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account with credentials

### Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd Boston_spring/.trees/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Database setup** (if not already done)
   ```bash
   # Execute SQL migrations in Supabase dashboard
   # See: ../database/001_init_schema.sql
   ```

### Development

**Start development server** (with hot reload):
```bash
npm run dev
```

Server will start at `http://localhost:3000`

### Testing

**Run all tests**:
```bash
npm test
```

**Run tests with coverage**:
```bash
npm run test:coverage
```

**Run tests in watch mode**:
```bash
npm test -- --watch
```

### Build & Production

**Build for production**:
```bash
npm run build
```

**Start production server**:
```bash
npm start
```

## API Endpoints

### Health Check
- **GET** `/health` - Server health status
- **GET** `/` - API info and endpoints

### File Upload
- **POST** `/api/upload` - Upload and process CSV file
  - **Body:** `multipart/form-data`
    - `file` (required): CSV file
    - `pump1` (required): "Glucose" | "Glycerol"
    - `pump2` (required): "Base" | "Acid"
  - **Response:** `{ success, runId, clientName, recordsInserted }`

### Retrieve Runs
- **GET** `/api/runs` - List all runs with pagination
  - **Query Params:**
    - `limit` (optional): Items per page (1-500, default: 50)
    - `offset` (optional): Starting position (default: 0)
  - **Response:** `{ success, runs, total }`

### Retrieve Run Data
- **GET** `/api/runs/:runId` - Get specific run with time-series data
  - **Response:** `{ success, runId, clientName, data }`

## Configuration

Environment variables in `.env`:

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key  # Optional, for server-side operations

# Server
NODE_ENV=development              # development | production | test
PORT=3000
HOST=localhost
LOG_LEVEL=debug                   # debug | info | warn | error

# File Upload
MAX_FILE_SIZE=10485760            # 10MB in bytes
ALLOWED_FILE_TYPES=text/csv
```

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": {}  // Optional additional context
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_FILE_TYPE` | 400 | File is not CSV |
| `INVALID_FILENAME` | 400 | Filename doesn't match pattern |
| `FILE_TOO_LARGE` | 400 | File exceeds 10MB |
| `MISSING_PARAMETERS` | 400 | Required parameters missing |
| `DUPLICATE_RUN_ID` | 409 | Run ID already exists |
| `INVALID_CSV_FORMAT` | 422 | CSV structure is incorrect |
| `RUN_NOT_FOUND` | 404 | Run ID not found |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## CSV File Format

Expected filename pattern:
```
ClientXXX_RXXXXXX_Online_Report_BostonBioprocess.csv
```

Example: `ClientABC_R001001_Online_Report_BostonBioprocess.csv`

CSV structure:
```
Row 1: ClientABC_R001001: DataLog Param, PV and Units
Row 2: (empty)
Row 3: Time Stamp,Parameter,Process value,Units
Row 4+: 0.009,pH,5.99,pH
        0.009,Pump1,0,%
        0.009,Pump2,0,%
        0.009,Temperature,28.01,DegC
```

### Parameter Mapping

| CSV Column | Mapped To |
|-----------|-----------|
| pH | pH (no mapping) |
| Temperature | Temperature (no mapping) |
| Pump1 | User selects: Glucose or Glycerol |
| Pump2 | User selects: Base or Acid |

## Database Schema

### run_client
```sql
CREATE TABLE run_client (
  run_id VARCHAR(20) PRIMARY KEY,
  client_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### run_time_series_data
```sql
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
```

## Code Quality

**Linting**:
```bash
npm run lint
```

**Code formatting**:
```bash
npm run format
```

## Docker

(See parent project for Docker Compose setup)

## Performance

- **File Upload:** < 5s for 5MB file
- **Data Fetch:** < 1s for typical queries
- **Batch Inserts:** Optimized for 1000+ records per batch

## Security

- ✅ Input validation on all endpoints
- ✅ SQL injection prevention via parameterized queries
- ✅ CORS configuration
- ✅ Environment variable protection
- ✅ File upload size limits

## Logging

Application logs include:
- Request/response lifecycle
- Error stack traces
- Database operations
- Performance metrics (response times)

Configure log level via `LOG_LEVEL` env variable.

## Future Enhancements

- [ ] User authentication & authorization
- [ ] Rate limiting
- [ ] Request caching
- [ ] Batch file uploads
- [ ] Data export endpoints
- [ ] Advanced filtering & search
- [ ] Webhook notifications
- [ ] API documentation (Swagger/OpenAPI)

## Troubleshooting

### Database connection errors
- Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct
- Check Supabase project status
- Ensure tables are created (run SQL migrations)

### File upload failures
- Check file is CSV format
- Verify filename matches required pattern
- Confirm file size is < 10MB
- Ensure pump selections are valid

### Port already in use
- Change `PORT` in .env
- Or kill process: `kill -9 $(lsof -t -i:3000)`

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test: `npm test`
3. Lint code: `npm run lint`
4. Format code: `npm run format`
5. Commit with meaningful message
6. Push and create pull request

## License

MIT

## Support

For issues or questions:
- Check logs: `npm run dev` (development)
- Review error codes in API responses
- Check Supabase dashboard for database issues

---

**Built with ❤️ for Boston Bioprocess**
