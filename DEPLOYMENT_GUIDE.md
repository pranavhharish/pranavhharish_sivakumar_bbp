# Vercel Deployment Guide

This guide will help you deploy the Fermentation Data Platform to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup) (free tier works)
2. [Vercel CLI](https://vercel.com/docs/cli) installed (optional but recommended)
3. A Supabase project set up with the required tables
4. Git repository (recommended for automatic deployments)

## Option 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Prepare Your Repository

1. Initialize a git repository if you haven't already:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Vercel deployment"
   ```

2. Push to GitHub, GitLab, or Bitbucket:
   ```bash
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

### Step 2: Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave as is for monorepo)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/.next`
   - **Install Command**: `npm install --prefix frontend`

### Step 3: Configure Environment Variables

In the Vercel project settings, add these environment variables:

#### Backend Variables
```
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=text/csv
LOG_LEVEL=info
```

#### Frontend Variables
```
NEXT_PUBLIC_API_URL=/api
```

### Step 4: Deploy

Click **"Deploy"** and Vercel will:
1. Install dependencies
2. Build your frontend
3. Deploy the application

## Option 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy

From your project root directory:

```bash
# For production deployment
vercel --prod

# Or for preview deployment
vercel
```

The CLI will prompt you to configure the project. Follow the prompts and select the appropriate settings.

### Step 4: Set Environment Variables via CLI

```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_KEY
vercel env add SUPABASE_SERVICE_KEY
vercel env add NEXT_PUBLIC_API_URL
# Add other variables as needed
```

## Important Notes

### Monorepo Structure

This project uses a monorepo structure with separate frontend and backend. Vercel is configured to:
- Serve the Next.js frontend from `/`
- Route API calls from `/api/*` to the backend

### Backend Deployment Considerations

⚠️ **Important**: Vercel's serverless functions have limitations:
- Maximum execution time: 10 seconds (Hobby plan) / 60 seconds (Pro plan)
- Maximum payload size: 4.5 MB
- Stateless (no persistent connections)

If your backend operations exceed these limits, consider:

1. **Option A: Deploy Backend Separately**
   - Deploy backend to Railway, Render, or Fly.io
   - Update `NEXT_PUBLIC_API_URL` to point to the backend URL
   - Example: `NEXT_PUBLIC_API_URL=https://your-backend.railway.app`

2. **Option B: Use Vercel Pro**
   - Upgrade to Pro plan for longer execution times

### Database Setup

Ensure your Supabase database has the required tables:

```sql
-- Run this in Supabase SQL Editor
-- See database/001_init_schema.sql for the complete schema
```

You can run the initialization script from your local machine:

```bash
cd database
npm install
node init-db.js
```

## Post-Deployment

### 1. Test Your Deployment

Visit your deployed URL: `https://your-app-name.vercel.app`

Test the following:
- Health check: `https://your-app-name.vercel.app/health`
- Upload functionality
- Data visualization

### 2. Set Up Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

### 3. Enable Automatic Deployments

Vercel automatically deploys when you push to your Git repository:
- **Production**: Pushes to `main` branch
- **Preview**: Pushes to other branches or pull requests

## Troubleshooting

### Build Fails

1. Check build logs in Vercel dashboard
2. Verify all dependencies are in `package.json`
3. Ensure TypeScript compilation succeeds locally

### API Routes Not Working

1. Verify environment variables are set correctly
2. Check function logs in Vercel dashboard
3. Ensure Supabase credentials are valid

### CORS Errors

Update `FRONTEND_URL` environment variable in backend to match your Vercel deployment URL.

### Database Connection Issues

1. Verify Supabase URL and keys
2. Check Supabase project is active
3. Ensure IP restrictions (if any) include Vercel's IPs

## Useful Commands

```bash
# View deployment logs
vercel logs <deployment-url>

# List deployments
vercel ls

# Remove deployment
vercel remove <deployment-name>

# Pull environment variables locally
vercel env pull
```

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Documentation](https://supabase.com/docs)

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review Supabase logs
3. Check browser console for frontend errors
4. Review Network tab for API request failures

---

**Note**: For optimal performance on Vercel's free tier, consider implementing caching strategies and optimizing your API endpoints to complete within the 10-second limit.

