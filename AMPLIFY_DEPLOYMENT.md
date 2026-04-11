# AWS Amplify Frontend Deployment Guide

This guide covers deploying the Next.js frontend to AWS Amplify.

## Overview

AWS Amplify provides a fully managed hosting service for modern web applications. It integrates with your GitHub repository for continuous deployment.

**Key Features:**
- Automatic builds on git push
- Global CDN distribution
- SSL/TLS certificates included
- Environment-specific deployments
- Automatic rollbacks

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **GitHub Repository** connected to Amplify
3. **Amplify App** created in AWS Console
4. **AWS CLI** configured with credentials
5. **Node.js 18+** installed locally

## Current Setup

- **App Name:** jaiib-caiib
- **App ID:** d38n04eo91rm1n
- **Region:** ap-south-1 (Mumbai)
- **Repository:** git@github.com:RahulKumar1119/jaiib-caiib.git
- **Branch:** main

## Deployment Process

### Option 1: Automated Deployment (Recommended)

Run the automated deployment script:

```bash
./scripts/deploy-amplify-frontend.sh production
```

This script will:
1. Verify Amplify CLI is installed
2. Build the frontend locally
3. Prepare for deployment

### Option 2: Manual Deployment

#### Step 1: Build Frontend Locally

```bash
cd frontend
npm install --legacy-peer-deps
npm run build
cd ..
```

#### Step 2: Push to GitHub

```bash
git add .
git commit -m "Deploy frontend to Amplify"
git push origin main
```

Amplify will automatically detect the push and start building.

#### Step 3: Monitor Build

Visit the Amplify Console to monitor the build:
https://console.aws.amazon.com/amplify

## Build Configuration

The build process is configured in `amplify.yml`:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm install --legacy-peer-deps
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/.next
    files:
      - '**/*'
  cache:
    paths:
      - 'frontend/node_modules/**/*'
```

**Key Points:**
- Uses `--legacy-peer-deps` to handle React 19 compatibility
- Builds Next.js in production mode
- Caches node_modules for faster builds
- Serves from `.next` directory

## Environment Variables

Environment variables are managed in Amplify Console:

1. Go to **App Settings** → **Environment Variables**
2. Add variables for each environment (main, staging, etc.)

**Required Variables:**
- `NEXT_PUBLIC_API_URL` - Backend API endpoint
- `NEXT_PUBLIC_APP_ENV` - Environment name (production, staging, etc.)

## Accessing Your Application

Once deployed, your application will be available at:

```
https://main.[APP_ID].amplifyapp.com
```

For your app:
```
https://main.d38n04eo91rm1n.amplifyapp.com
```

## Custom Domain (Optional)

To use a custom domain:

1. Go to **App Settings** → **Domain Management**
2. Click **Add Domain**
3. Enter your domain name
4. Follow the DNS configuration steps

## Monitoring & Logs

### View Build Logs

1. Go to Amplify Console
2. Select your app
3. Click on the build in the **Deployments** tab
4. View logs in real-time

### CloudWatch Logs

Frontend logs are available in CloudWatch:
- Log Group: `/aws/amplify/jaiib-caiib`
- Log Stream: `main` (for main branch)

## Troubleshooting

### Build Fails with "Backend not found"

**Issue:** Amplify tries to build a backend that doesn't exist.

**Solution:** 
- We use AWS CDK for backend, not Amplify backend
- Amplify is configured for frontend-only deployment
- The `amplify.yml` file specifies frontend build only

### Build Fails with Dependency Errors

**Issue:** npm install fails with peer dependency conflicts.

**Solution:**
- The build uses `--legacy-peer-deps` flag
- This is necessary for React 19 compatibility
- If issues persist, check `frontend/package.json` for conflicting versions

### Blank Page After Deployment

**Issue:** Application shows blank page.

**Possible Causes:**
1. Environment variables not set
2. API endpoint not configured
3. Build artifacts not generated

**Solution:**
1. Check environment variables in Amplify Console
2. Verify `NEXT_PUBLIC_API_URL` is set correctly
3. Check build logs for errors
4. Verify `.next` directory was created during build

### Slow Initial Load

**Issue:** First page load is slow.

**Solution:**
- This is normal for Next.js SSR applications
- Amplify caches responses at the edge
- Subsequent loads will be faster
- Consider using ISR (Incremental Static Regeneration) for static pages

## Rollback

To rollback to a previous deployment:

1. Go to Amplify Console
2. Select your app
3. Go to **Deployments** tab
4. Find the previous successful deployment
5. Click **Redeploy**

## Cost Optimization

**Amplify Pricing:**
- Build minutes: $0.01 per build minute
- Hosting: $0.15 per GB served
- Data transfer: Included in AWS free tier

**Tips to Reduce Costs:**
1. Use caching headers for static assets
2. Enable compression
3. Optimize images
4. Use CloudFront caching

## Next Steps

1. **Deploy:** Push to GitHub to trigger Amplify build
2. **Monitor:** Check Amplify Console for build status
3. **Test:** Access your app at the Amplify URL
4. **Configure:** Set up custom domain if needed
5. **Optimize:** Monitor performance and optimize as needed

## Support

For issues or questions:
- [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/)
- [Amplify Console](https://console.aws.amazon.com/amplify)
- [AWS Support](https://console.aws.amazon.com/support/)

## Related Documentation

- [Backend Infrastructure](./DEPLOYMENT.md)
- [Frontend Setup](./frontend/README.md)
- [Environment Configuration](./.env.example)
