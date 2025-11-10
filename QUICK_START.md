# Backend Quick Start Guide

## Installation

```bash
# Navigate to backend directory
cd .trees/backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your Supabase credentials
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_KEY=your-anon-key
```

## Development

```bash
# Start development server (with hot reload)
npm run dev

# Server will run on http://localhost:3000

# In another terminal, initialize database
cd .trees/database
npm install
npm run init
```

## Building for Production

```bash
# Compile TypeScript to JavaScript
npm run build

# Start production server
npm run start

# Check code quality
npm run lint

# Format code
npm run format
```

## API Testing

### Health Check
```bash
curl http://localhost:3000/health
```

### Upload CSV
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@ClientABC_R001001_Online_Report_BostonBioprocess.csv" \
  -F "pump1=Glucose" \
  -F "pump2=Base"
```

### List Runs
```bash
curl http://localhost:3000/api/runs?limit=50&offset=0
```

### Get Run Data
```bash
curl http://localhost:3000/api/runs/R001001
```

## Project Structure

```
src/
├── index.ts                 # Express server setup
├── config/
│   └── index.ts            # Configuration management
├── middleware/
│   └── errorHandler.ts     # Error handling
├── routes/
│   ├── upload.ts           # POST /api/upload
│   └── runs.ts             # GET /api/runs endpoints
├── services/
│   └── database.ts         # DatabaseService class
├── utils/
│   ├── csv-parser.ts       # CSV parsing logic
│   ├── db.ts               # Database operations
│   ├── validation.ts       # Input validation
│   ├── validators.ts       # Additional validators
│   ├── errors.ts           # Custom error classes
│   └── logger.ts           # Logging utility
└── types/
    └── index.ts            # TypeScript interfaces
```

## Key Features

✅ **File Upload**
- Supports CSV files up to 10MB
- Validates filename format
- Allows pump type selection

✅ **Data Validation**
- File type and size validation
- CSV structure validation
- Filename format validation
- Pump selection validation

✅ **CSV Processing**
- Automatic parameter mapping
- Pump name substitution
- Data type validation
- Batch processing

✅ **Database**
- Supabase PostgreSQL
- Automatic schema creation
- Transaction support
- Index optimization

✅ **API**
- RESTful design
- Consistent error responses
- Pagination support
- CORS enabled

✅ **Logging**
- Request/response logging
- Error tracking
- Structured logging
- Configurable log levels

## Troubleshooting

### Build Errors
```bash
# Clear build artifacts and rebuild
rm -rf dist
npm run build
```

### Database Connection Issues
- Verify `SUPABASE_URL` is correct
- Check `SUPABASE_KEY` is valid
- Ensure Supabase project is running
- Check network connectivity

### TypeScript Errors
```bash
# Run type checking
npx tsc --noEmit

# Format code and fix issues
npm run format
npm run lint -- --fix
```

### Port Already in Use
```bash
# Change port in .env
PORT=3001

# Or kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## Environment Variables Reference

| Variable | Default | Purpose |
|----------|---------|---------|
| SUPABASE_URL | - | Supabase project URL |
| SUPABASE_KEY | - | Supabase anon key |
| SUPABASE_SERVICE_KEY | - | Supabase service key (optional) |
| NODE_ENV | development | Environment |
| PORT | 3000 | Server port |
| HOST | localhost | Server host |
| FRONTEND_URL | * | Frontend URL for CORS |
| LOG_LEVEL | info | Logging level |
| MAX_FILE_SIZE | 10485760 | Max upload size (bytes) |
| ALLOWED_FILE_TYPES | text/csv | Allowed MIME types |

## Performance Tips

1. **Use Production Build**
   - `npm run build && npm run start`
   - Much faster than dev mode

2. **Enable Caching**
   - Frontend should cache API responses
   - Set appropriate cache headers

3. **Database Optimization**
   - Indexes are automatically created
   - Monitor query performance
   - Consider pagination limits

4. **File Uploads**
   - Current limit: 10MB
   - Can be changed in config
   - Uses memory storage (can use disk for production)

## Security Considerations

1. **Input Validation**
   - All inputs validated before processing
   - CSV injection prevention
   - SQL injection prevention via Supabase client

2. **File Uploads**
   - File type validation
   - Size limit enforcement
   - Filename validation

3. **CORS**
   - Configured per environment
   - Wildcard allowed in development only
   - Restricted in production

4. **Environment Variables**
   - Never commit `.env` file
   - Use `.env.example` as template
   - Rotate keys periodically

## Contributing

- Follow TypeScript strict mode
- Use prettier for formatting
- Run eslint before committing
- Add tests for new features
- Document complex logic

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [PostgreSQL Manual](https://www.postgresql.org/docs/)

---

For detailed implementation information, see [BACKEND_IMPLEMENTATION.md](./BACKEND_IMPLEMENTATION.md)
