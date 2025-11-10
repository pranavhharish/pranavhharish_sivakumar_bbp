# Fermentation Data Platform

A full-stack web application for Boston Bioprocess engineers to upload fermentation run CSV files, store data in a PostgreSQL database, and visualize time-series parameters in interactive charts.

## 🎯 Features

- ✅ **CSV File Upload & Processing** - Drag-and-drop with parameter mapping
- ✅ **Data Validation** - Comprehensive validation at all stages
- ✅ **Interactive Visualization** - Plotly.js charts with dual Y-axes
- ✅ **REST API** - Complete API for data management
- ✅ **Full TypeScript** - Type-safe frontend and backend
- ✅ **Database** - PostgreSQL via Supabase
- ✅ **Docker Support** - Local development setup

## 📁 Project Structure

This is a monorepo with three main modules:

```
.
├── frontend/          # Next.js 16 frontend application
├── backend/           # Express.js API server
├── database/          # Database schema and migrations
├── CLAUDE.md          # Architecture guide for Claude Code
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- npm or yarn

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/pranavhharish/pranavhharish_sivakumar_bbp.git
   cd pranavhharish_sivakumar_bbp
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend && npm install && cd ..

   # Frontend
   cd frontend && npm install && cd ..

   # Database (optional for direct initialization)
   cd database && npm install && cd ..
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Initialize database** (if needed)
   ```bash
   cd database && npm run init
   ```

5. **Start development servers**

   **Terminal 1 - Backend:**
   ```bash
   cd backend && npm run dev
   # Server runs on http://localhost:3000
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd frontend && npm run dev
   # App runs on http://localhost:3000 (or next available port)
   ```

## 📚 Documentation

- **CLAUDE.md** - Complete architecture guide and development reference
- **PRD.md** - Product requirements document with detailed specifications
- **backend/README.md** - Backend API documentation
- **database/README.md** - Database schema and setup guide
- **frontend/README.md** - Frontend setup and component guide

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TailwindCSS, Plotly.js |
| Backend | Express.js, TypeScript, Multer |
| Database | Supabase (PostgreSQL) |
| DevOps | Docker, Docker Compose |
| Testing | Vitest, Jest |
| Linting | ESLint, Prettier |

## 🔧 Development Commands

### Backend (./backend)
```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run start        # Run production server
npm run test         # Run tests
npm run lint         # Lint code
npm run format       # Format code
```

### Frontend (./frontend)
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Run production server
npm run lint         # Lint code
```

### Database (./database)
```bash
npm run init         # Initialize database schema
npm run seed         # Seed sample data
npm run seed:clean   # Clean and reseed
```

## 📡 API Endpoints

### POST /api/upload
Upload and process a CSV file
- **Body:** multipart/form-data (file, pump1, pump2)
- **Response:** `{ success, runId, clientName, recordsInserted }`

### GET /api/runs
List all fermentation runs with pagination
- **Query:** `limit`, `offset`
- **Response:** `{ success, runs, total }`

### GET /api/runs/:runId
Fetch specific run with time-series data
- **Response:** `{ success, runId, clientName, data, plotlyData }`

See backend/README.md for complete API documentation.

## 📊 CSV Format

Expected filename: `ClientXXX_RXXXXXX_Online_Report_BostonBioprocess.csv`

Expected structure:
```
Row 1: ClientABC_R001001: DataLog Param, PV and Units
Row 2: (empty)
Row 3: Time Stamp,Parameter,Process value,Units
Row 4+: Data rows
```

Parameters are mapped as:
- **pH** → pH (unchanged)
- **Temperature** → Temperature (unchanged)
- **Pump1** → User selects: Glucose or Glycerol
- **Pump2** → User selects: Base or Acid

## 🗄️ Database Schema

Two tables:
- **run_client** - Run metadata (run_id, client_name, created_at)
- **run_time_series_data** - Time-series data with foreign key

See database/README.md for full schema details.

## 🐳 Docker

Run all services with Docker Compose:
```bash
docker-compose up
```

This starts:
- Frontend on http://localhost:3000
- Backend API on http://localhost:3001

## 🧪 Testing

### Backend Unit Tests
```bash
cd backend
npm test              # Run all tests
npm run test:coverage # Coverage report
```

## 📈 Performance Targets

- Page load: < 2s
- File upload (5MB): < 5s
- Data fetch: < 1s
- Chart render: < 1s

## 🔒 Security

- Input validation on all endpoints
- File type and size restrictions (CSV, max 10MB)
- SQL injection prevention via parameterized queries
- CORS configuration
- Environment variable protection

## 🚀 Deployment

### Vercel (Recommended)

1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Docker Deployment

Build and push Docker images:
```bash
docker build -f frontend/Dockerfile -t fermentation-frontend .
docker build -f backend/Dockerfile -t fermentation-backend .
```

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test
3. Lint and format: `npm run lint && npm run format`
4. Commit with meaningful message
5. Push and create PR

## 📝 License

MIT

## 📞 Support

For questions or issues:
- Check logs in development mode
- Review error codes in API responses
- Check Supabase dashboard
- See CLAUDE.md for architecture details

---

**Built with ❤️ for Boston Bioprocess**
