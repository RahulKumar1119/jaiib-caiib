# AWS Amplify Deployment Guide - Next.js Frontend

This guide explains how to deploy the Next.js frontend using AWS Amplify, which natively supports Next.js with SSR, SSG, and ISR.

## Why AWS Amplify?

- ✅ Native Next.js support (SSR, SSG, ISR)
- ✅ Automatic CI/CD from Git
- ✅ Built-in CDN and edge caching
- ✅ Serverless backend integration
- ✅ Custom domains and SSL
- ✅ Environment variables management
- ✅ Automatic deployments on push

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI configured
3. Node.js 18+ installed
4. Git repository (GitHub, GitLab, Bitbucket, or CodeCommit)
5. AWS Amplify CLI: `npm install -g @aws-amplify/cli`

## Quick Start

### Option 1: Using AWS Console (Recommended for first-time)

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click "Create app"
3. Select your Git provider (GitHub, GitLab, etc.)
4. Authorize and select your repository
5. Select the branch to deploy (main/production)
6. Configure build settings:
   - Build command: `cd frontend && npm install --legacy-peer-deps && npm run build`
   - Start command: `npm start`
   - Base directory: `frontend`
7. Review and deploy

### Option 2: Using Amplify CLI

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure AWS credentials
amplify configure

# Initialize Amplify in your project
amplify init

# When prompted:
# - Project name: jaiib-caiib
# - Environment: production
# - Editor: code
# - App type: javascript
# - Framework: nextjs
# - Source directory: frontend
# - Distribution directory: frontend/.next

# Deploy
amplify push
```

### Option 3: Using the deployment script

```bash
chmod +x scripts/deploy-amplify.sh
./scripts/deploy-amplify.sh production
```

## Manual Deployment Steps

### Step 1: Connect Git Repository

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/jaiib-caiib.git
git push -u origin main
```

### Step 2: Create Amplify App

```bash
# Using AWS CLI
aws amplify create-app \
  --name jaiib-caiib-frontend \
  --region ap-south-1 \
  --repository https://github.com/YOUR_USERNAME/jaiib-caiib.git \
  --branch main \
  --enable-auto-branch-creation
```

### Step 3: Configure Build Settings

Create `amplify.yml` in root directory:

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

### Step 4: Deploy

```bash
# Push to trigger automatic deployment
git push origin main

# Or manually trigger deployment
amplify publish
```

## Environment Variables

Set environment variables in Amplify Console:

1. Go to App Settings → Environment variables
2. Add variables:
   - `NEXT_PUBLIC_API_URL`: Your API Gateway URL
   - `NEXT_PUBLIC_APP_NAME`: JAIIB-CAIIB Exam Prep Portal
   - `NEXT_PUBLIC_LOG_LEVEL`: warn (for production)

Or via CLI:

```bash
amplify env add
amplify env select
amplify update env
```

## Custom Domain

### Using Route 53

```bash
# In Amplify Console:
# 1. Go to Domain management
# 2. Click "Add domain"
# 3. Enter your domain (e.g., app.example.com)
# 4. Select "Route 53" for DNS
# 5. Amplify will create DNS records automatically
```

### Using External DNS Provider

```bash
# In Amplify Console:
# 1. Go to Domain management
# 2. Click "Add domain"
# 3. Enter your domain
# 4. Copy the CNAME record
# 5. Add CNAME record to your DNS provider
```

## Monitoring & Logs

### View Deployment Logs

```bash
# Using Amplify Console
amplify console

# Or via CLI
amplify logs --follow
```

### Monitor Performance

```bash
# View CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Amplify \
  --metric-name Requests \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

## CI/CD Pipeline

Amplify automatically creates a CI/CD pipeline:

1. **Push to Git** → Triggers build
2. **Build Phase** → Installs dependencies, builds Next.js
3. **Deploy Phase** → Deploys to Amplify hosting
4. **Live** → App is live at `https://branch.appid.amplifyapp.com`

### Branch Deployments

```bash
# Deploy feature branch
git checkout -b feature/new-feature
git push origin feature/new-feature

# Amplify automatically creates preview deployment
# Access at: https://feature-new-feature.appid.amplifyapp.com
```

## Rollback

```bash
# View deployment history
amplify status

# Redeploy previous version
amplify publish --invalidateCache

# Or manually select version in Console
# App Settings → Deployments → Select version → Redeploy
```

## Performance Optimization

### Enable Image Optimization

Next.js Image component is automatically optimized by Amplify.

### Enable Caching

```yaml
# In amplify.yml
frontend:
  cache:
    paths:
      - 'frontend/node_modules/**/*'
      - 'frontend/.next/cache/**/*'
```

### Monitor Build Time

```bash
# View build metrics
amplify status
```

## Troubleshooting

### Build Fails

**Problem**: Build fails with dependency errors

**Solution**:
```bash
# Clear cache and rebuild
amplify publish --invalidateCache

# Or in Console: App Settings → Build settings → Clear cache
```

### Blank Page

**Problem**: Frontend shows blank page

**Solution**:
1. Check browser console for errors (F12)
2. Verify environment variables are set
3. Check API Gateway URL is correct
4. View Amplify logs: `amplify logs --follow`

### Slow Performance

**Problem**: App loads slowly

**Solution**:
1. Enable image optimization
2. Check CloudFront cache settings
3. Monitor API response times
4. Use Amplify Analytics

### Environment Variables Not Working

**Problem**: `NEXT_PUBLIC_*` variables undefined

**Solution**:
```bash
# Rebuild to pick up new variables
amplify publish --invalidateCache

# Or redeploy from Console
```

## Cost Estimation

### Monthly Costs (Approximate)

- **Amplify Hosting**: $0.015 per GB served (first 15 GB free)
- **Build Minutes**: $0.01 per build minute (1000 minutes free)
- **Data Transfer**: Included in hosting

**Example**: 1000 daily users, 100 MB app, 10 builds/month
- Hosting: ~$1.50
- Builds: ~$0.10
- **Total**: ~$1.60/month

## Next Steps

1. Connect your Git repository
2. Set up custom domain
3. Configure environment variables
4. Enable branch deployments for staging
5. Set up monitoring and alerts
6. Configure auto-deployments

## Support

- [AWS Amplify Documentation](https://docs.amplify.aws)
- [Next.js on Amplify](https://docs.amplify.aws/nextjs)
- [Amplify CLI Reference](https://docs.amplify.aws/cli)
