#!/bin/bash

# CSS Reset Script for Frontend
# Run this if CSS styling is not working

echo "🔄 Starting CSS troubleshooting reset..."

# Step 1: Clean node_modules and cache
echo "1️⃣  Removing node_modules and Next.js cache..."
rm -rf node_modules
rm -rf .next
rm -f package-lock.json
echo "✅ Cleaned"

# Step 2: Reinstall dependencies
echo "2️⃣  Installing dependencies..."
npm install
echo "✅ Dependencies installed"

# Step 3: Build to verify
echo "3️⃣  Building frontend to verify CSS setup..."
npm run build
BUILD_EXIT=$?

if [ $BUILD_EXIT -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🚀 You can now run: npm run dev"
    echo ""
    echo "🌐 Open browser at: http://localhost:3000"
    echo "📋 CSS should now be working correctly"
else
    echo "❌ Build failed. Check the error messages above."
    exit 1
fi
