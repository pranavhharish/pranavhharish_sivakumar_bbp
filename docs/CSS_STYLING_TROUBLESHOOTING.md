# CSS Styling Troubleshooting Guide

## Issues Found & Solutions

### Issue 1: Monorepo Lock File Conflict ⚠️

**Problem:** Warning appears when running dev server:
```
Warning: Next.js inferred your workspace root, but it may not be correct.
We detected multiple lockfiles...
```

**Root Cause:** There's a `package-lock.json` at the root directory, which Next.js thinks is a monorepo root. This can cause CSS build issues.

**Solution:**
```bash
# From root directory
rm package-lock.json
cd frontend && npm install
```

This removes the root-level package-lock.json that shouldn't exist and ensures frontend uses its own dependencies.

---

### Issue 2: CSS Not Loading - Tailwind Configuration

**Problem:** Tailwind CSS classes not applying (layout looks unstyled).

**Root Cause:** Tailwind 4 with `@tailwindcss/postcss` requires proper PostCSS configuration.

**Verification Checklist:**

✓ **`frontend/src/styles/globals.css`** has Tailwind directives:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

✓ **`frontend/src/app/layout.tsx`** imports the CSS:
```typescript
import '@/styles/globals.css';
```

✓ **`frontend/postcss.config.js`** is configured correctly:
```javascript
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
```

✓ **`frontend/tailwind.config.ts`** includes content paths:
```typescript
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // ...
};
```

---

### Issue 3: Next.js Configuration

**Current Config:** `frontend/next.config.ts`
```typescript
const config: NextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
};
```

**For CSS to work properly with Turbopack, add:**
```typescript
import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};

export default config;
```

This configuration is already correct. No changes needed.

---

## Step-by-Step Debugging

### Step 1: Clean & Reinstall

```bash
cd /Users/pranavhharish/Desktop/tonight/Boston_spring

# Remove problematic root lock file
rm package-lock.json

# Go to frontend and clean
cd frontend
rm -rf node_modules .next
npm install
```

### Step 2: Check Build

```bash
cd frontend
npm run build
```

Expected output:
```
✓ Compiled successfully
Collecting page data ...
Generating static pages (0/3) ...
✓ Generating static pages (3/3)
```

### Step 3: Run Dev Server

```bash
npm run dev
```

Expected console output:
```
▲ Next.js 16.0.1 (Turbopack)
- Local:        http://localhost:3000
- Environments: .env
✓ Ready in XXXms
```

### Step 4: Check Browser

Open `http://localhost:3000` and inspect:

1. **Open DevTools** (F12)
2. **Check Network tab** → look for `_next/static/css` files loading
3. **Check Elements** → Tailwind classes should render as actual CSS
4. **Check Console** → No CSS-related errors

---

## Common CSS Issues & Fixes

### Problem: Classes Not Applying

**Check:**
1. Is the file a React component? (`'use client'` at top for client components)
2. Are className values valid Tailwind classes?
3. Is the file in the `content` paths in `tailwind.config.ts`?

**Fix Example:**
```tsx
// ❌ Dynamic classes won't work
<div className={`text-${color}-600`}>

// ✅ Use fixed classes
<div className="text-blue-600">

// ✅ Or use conditional rendering
<div className={isActive ? "text-blue-600" : "text-gray-600"}>
```

### Problem: Styles Not Updating in Dev Mode

**Fix:**
```bash
# Kill dev server
pkill -f "next dev"

# Clean next cache
rm -rf .next

# Restart
npm run dev
```

### Problem: CSS Works in Build but Not in Dev

**Cause:** Turbopack caching issue

**Fix:**
```bash
# Method 1: Clear Turbopack cache
rm -rf .next/cache

# Method 2: Restart with clean flag
npm run dev -- --turbopack-disable-cache
```

---

## CSS Architecture in This Project

### Global Styles
- **File:** `frontend/src/styles/globals.css`
- **Import Location:** `frontend/src/app/layout.tsx`
- **Scope:** Applied to entire app

### Component Styles
- **Method:** Inline Tailwind classes
- **Pattern:** `className="bg-white rounded-lg shadow-md"`
- **Custom CSS:** Toast styles in globals.css

### Custom CSS Classes

**Toast Styling (in globals.css):**
```css
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  animation: slideIn 0.3s ease-out;
}

/* Variant classes */
.toast.success { background-color: #d1fae5; }
.toast.error { background-color: #fee2e2; }
.toast.warning { background-color: #fef3c7; }
.toast.info { background-color: #dbeafe; }
```

---

## Tailwind Classes Used in Components

### UploadForm Component
- Grid layout: `grid grid-cols-1 md:grid-cols-2 gap-4`
- Form styling: `border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500`
- Buttons: `bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400`

### DataVisualization Component
- Container: `w-full bg-white rounded-lg shadow-md`
- Typography: `text-2xl font-bold text-gray-900`

### RunHistory Component
- List items: `bg-white border-b border-gray-200 hover:bg-gray-50`
- Pagination: `text-sm text-gray-600 text-center py-4`

---

## Performance Tips

1. **Avoid Dynamic Class Names:**
   ```tsx
   // Bad - Tailwind can't process
   <div className={`text-${size}`}>

   // Good - Static classes
   <div className="text-sm">
   ```

2. **Use CSS Variables for Dynamic Values:**
   ```tsx
   <div style={{ width: `${percentage}%` }}>
   ```

3. **Lazy Load Heavy Components:**
   ```tsx
   const DataVisualization = dynamic(() => import('@/components/DataVisualization'));
   ```

---

## Verification Checklist

- [ ] No errors in `npm run build`
- [ ] Dev server starts with `npm run dev`
- [ ] `http://localhost:3000` loads without styling issues
- [ ] Inspector shows CSS in `<style>` tags
- [ ] Classes like `bg-gray-50`, `rounded-lg` are visible in DevTools
- [ ] No console warnings about CSS
- [ ] Hover effects work (e.g., `hover:bg-blue-700`)
- [ ] Responsive classes work (e.g., `lg:grid-cols-4` on desktop)

---

## If Issues Persist

### Reset Frontend Completely

```bash
cd /Users/pranavhharish/Desktop/tonight/Boston_spring/frontend

# Remove everything
rm -rf node_modules .next .env .next-env.ts.next package-lock.json

# Reinstall
npm install

# Verify build
npm run build

# Run dev
npm run dev
```

### Check Node/NPM Versions

```bash
node --version  # Should be 18+
npm --version   # Should be 9+
```

### Check for Conflicting CSS

```bash
# Look for inline <style> tags that might override Tailwind
grep -r "style=" src/ | head -10
```

---

## Dependencies

All CSS dependencies should be installed:

```json
{
  "@tailwindcss/postcss": "^4.1.17",
  "autoprefixer": "^10.4.21",
  "postcss": "^8.5.6",
  "tailwindcss": "^4.1.17"  // Should be added if missing
}
```

If missing, add Tailwind:
```bash
npm install tailwindcss
```

---

## Browser Compatibility

Tailwind CSS 4 works on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

If using older browsers, you may see unstyled content.

---

## Further Reading

- [Next.js CSS Documentation](https://nextjs.org/docs/app/building-your-application/styling)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs/installation)
- [PostCSS Configuration](https://postcss.org/)
