---
description: Deploy the HR Attendance App to Vercel
---

# Deploy to Vercel

This workflow guides you through deploying the HR Attendance and Daily Report Management application to Vercel.

## Prerequisites

1. A GitHub, GitLab, or Bitbucket account
2. Your code pushed to a Git repository
3. A Vercel account (free tier available at https://vercel.com)
4. Your Neon database credentials ready

## Step 1: Push Code to Git Repository

If you haven't already, initialize a git repository and push your code:

```bash
git init
git add .
git commit -m "Initial commit - HR Attendance App"
git branch -M main
git remote add origin <your-repository-url>
git push -u origin main
```

## Step 2: Sign Up / Log In to Vercel

1. Go to https://vercel.com
2. Click "Sign Up" or "Log In"
3. Choose "Continue with GitHub" (or your preferred Git provider)
4. Authorize Vercel to access your repositories

## Step 3: Import Your Project

1. Click "Add New..." → "Project" in your Vercel dashboard
2. Select your Git provider (GitHub/GitLab/Bitbucket)
3. Find and import your `project-2` repository
4. Click "Import"

## Step 4: Configure Build Settings

Vercel should auto-detect Next.js settings. Verify:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

These are already configured in `vercel.json`.

## Step 5: Set Environment Variables

Click "Environment Variables" and add the following:

| Name | Value | Notes |
|------|-------|-------|
| `DATABASE_URL` | Your Neon database connection string | From Neon dashboard |
| `JWT_SECRET` | A secure random string (min 32 chars) | Generate with: `openssl rand -base64 32` |
| `ADMIN_EMAIL` | Your admin email | e.g., admin@yourcompany.com |
| `ADMIN_PASSWORD` | Your admin password | Choose a strong password |

**Important**: Make sure to add these for all environments (Production, Preview, Development).

## Step 6: Deploy

1. Click "Deploy"
2. Wait for the build to complete (2-3 minutes)
3. Once deployed, you'll get a URL like: `https://your-app.vercel.app`

## Step 7: Initialize Database Schema

After first deployment, you need to set up the database:

### Option A: Run Locally (Recommended)

```bash
# Make sure your .env.local has the production DATABASE_URL
node apply-schema.js
node make-admin.js
```

### Option B: Use Vercel CLI

// turbo
```bash
npm i -g vercel
vercel login
vercel env pull .env.local
node apply-schema.js
node make-admin.js
```

## Step 8: Verify Deployment

1. Visit your Vercel URL
2. Try to log in with your admin credentials
3. Test the main features:
   - User registration
   - Attendance marking
   - Daily reports
   - Admin dashboard

## Troubleshooting

### Build Fails

- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript/ESLint errors locally first: `npm run build`

### Database Connection Issues

- Verify `DATABASE_URL` is correct in Vercel environment variables
- Check Neon database allows connections from Vercel IPs
- Ensure database schema is applied: `node apply-schema.js`

### Environment Variables Not Working

- Make sure variables are set for the correct environment (Production/Preview)
- Redeploy after adding new environment variables
- Check variable names match exactly (case-sensitive)

## Continuous Deployment

Once set up, Vercel automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: When you create a pull request

## Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate provisioning (automatic)

## Monitoring

- **Analytics**: View in Vercel dashboard
- **Logs**: Real-time logs available in deployment details
- **Performance**: Speed Insights available in Pro plan

---

## Quick Reference

**Vercel Dashboard**: https://vercel.com/dashboard
**Documentation**: https://vercel.com/docs
**Support**: https://vercel.com/support

**Your deployment URL**: Will be provided after first deployment
