# Fermentation Data Platform

A full-stack web application for uploading, storing, and visualizing fermentation run data.

## 🚀 Quick Start

### Local Development

1. **Install Dependencies**
   ```bash
   npm run install-all
   ```

2. **Set Up Environment Variables**
   
   Create `.env` files in the `backend` directory:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   NODE_ENV=development
   PORT=3000
   ```

3. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend
   npm run dev:backend
   
   # Terminal 2 - Frontend
   npm run dev:frontend
   ```

4. **Access the Application**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000

## 📦 Deploy to Vercel

### Quick Deploy (Automated)

```bash
npm run deploy
```

This will guide you through the deployment process.

### Manual Deploy

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Configure Environment Variables**
   
   Go to your Vercel dashboard → Project → Settings → Environment Variables
   
   Add the following:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   NEXT_PUBLIC_API_URL=/api
   NODE_ENV=production
   ```

5. **Redeploy** after adding environment variables

### Deploy via GitHub (Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel Dashboard](https://vercel.com/new)
3. Configure environment variables
4. Deploy!

Vercel will automatically deploy on every push to main branch.

## 📚 Documentation

- [Detailed Deployment Guide](./DEPLOYMENT_GUIDE.md) - Complete step-by-step deployment instructions
- [PRD](./docs/PRD.md) - Product Requirements Document
- [Backend Implementation](./docs/BACKEND_IMPLEMENTATION.md) - Backend architecture details
- [Quick Start Guide](./docs/QUICK_START.md) - Development setup guide

## 🏗️ Project Structure

```
Boston_spring/
├── frontend/          # Next.js frontend application
├── backend/           # Express.js backend API
├── api/              # Vercel serverless functions wrapper
├── database/         # Database schema and initialization
├── docs/             # Documentation
└── vercel.json       # Vercel deployment configuration
```

## 🛠️ Tech Stack

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Plotly.js for data visualization

### Backend
- Node.js
- Express.js
- TypeScript
- Supabase (PostgreSQL)

### Deployment
- Vercel (Frontend & Backend)
- Supabase (Database)

## 🧪 Testing

```bash
# Run backend tests
npm run test:backend

# Run with coverage
cd backend && npm run test:coverage
```

## 🔧 Available Scripts

- `npm run install-all` - Install all dependencies
- `npm run dev:backend` - Start backend dev server
- `npm run dev:frontend` - Start frontend dev server
- `npm run build:all` - Build both frontend and backend
- `npm run test:backend` - Run backend tests
- `npm run lint:all` - Lint all code
- `npm run deploy` - Deploy to Vercel (interactive)

## 📝 Features

- ✅ CSV file upload with validation
- ✅ Data parsing and storage in Supabase
- ✅ Interactive time-series visualization
- ✅ Run history tracking
- ✅ Real-time data updates
- ✅ Responsive design
- ✅ Error handling and validation
- ✅ TypeScript support throughout

## 🔐 Environment Variables

### Backend
| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_KEY` | Your Supabase anon/public key | Yes |
| `SUPABASE_SERVICE_KEY` | Your Supabase service role key | Optional |
| `NODE_ENV` | Environment (development/production) | No |
| `PORT` | Backend port (default: 3000) | No |

### Frontend
| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |

## 🐛 Troubleshooting

### Build Errors
- Ensure all dependencies are installed: `npm run install-all`
- Check TypeScript compilation: `cd backend && npm run build`

### API Connection Issues
- Verify backend is running on correct port
- Check environment variables are set correctly
- Ensure Supabase credentials are valid

### Deployment Issues
- Check Vercel build logs
- Verify environment variables in Vercel dashboard
- Ensure Supabase project is active and accessible

## 📄 License

MIT

## 👤 Author

Pranavh

---

For more detailed information, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

