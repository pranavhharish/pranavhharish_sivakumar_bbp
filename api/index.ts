/**
 * Vercel Serverless Function Entry Point
 * This wraps the Express app to work with Vercel's serverless infrastructure
 */

import app from '../backend/src/index.js';

// Export the Express app for Vercel serverless
export default app;

