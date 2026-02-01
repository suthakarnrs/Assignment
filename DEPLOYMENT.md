# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas**: Set up a MongoDB database at [mongodb.com/atlas](https://mongodb.com/atlas)
3. **GitHub Repository**: Push your code to GitHub

## Deployment Steps

### 1. Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from root directory
vercel
```

#### Option B: Using Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the configuration

### 2. Environment Variables

Set these environment variables in your Vercel project settings:

#### Backend Variables

- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: A secure random string for JWT tokens
- `NODE_ENV`: `production`
- `FRONTEND_URL`: Your Vercel frontend URL (e.g., `https://your-app.vercel.app`)

#### Optional Variables

- `REDIS_URL`: If using Redis for queues
- `MAX_FILE_SIZE`: Maximum file upload size (default: 10MB)

### 3. MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Whitelist Vercel's IP addresses (or use 0.0.0.0/0 for all IPs)
5. Get your connection string and add it to `MONGODB_URI`

### 4. Domain Configuration

After deployment:

1. Update `FRONTEND_URL` environment variable with your actual Vercel URL
2. Update CORS settings if needed
3. Configure custom domain if desired

## Project Structure

```
├── frontend/          # React frontend (deployed as static site)
├── backend/           # Node.js API (deployed as serverless functions)
├── vercel.json        # Main Vercel configuration
└── DEPLOYMENT.md      # This file
```

## API Routes

All backend routes will be available at:

- `https://your-app.vercel.app/api/auth/*`
- `https://your-app.vercel.app/api/upload/*`
- `https://your-app.vercel.app/api/reconciliation/*`
- etc.

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure `FRONTEND_URL` matches your actual Vercel URL
2. **Database Connection**: Verify MongoDB Atlas connection string and IP whitelist
3. **Environment Variables**: Double-check all required env vars are set in Vercel
4. **Build Errors**: Check build logs in Vercel dashboard

### Logs

View deployment and runtime logs in:

- Vercel Dashboard → Your Project → Functions tab
- Or use `vercel logs` command

## Notes

- Vercel automatically handles SSL certificates
- Serverless functions have a 10-second timeout limit
- File uploads are limited by Vercel's 4.5MB request limit
- Consider using external storage (AWS S3, Cloudinary) for large file uploads
