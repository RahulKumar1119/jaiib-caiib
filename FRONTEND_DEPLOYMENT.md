# Frontend Deployment Guide - S3 + CloudFront

This guide explains how to deploy the Next.js frontend to AWS S3 with CloudFront CDN.

## Architecture

- **S3 Bucket**: Stores static frontend files
- **CloudFront**: Global CDN for fast content delivery
- **Origin Access Identity (OAI)**: Secure S3 access from CloudFront only
- **Cache Policies**: Optimized caching for different file types

## Prerequisites

1. Backend infrastructure deployed (VPC, Lambda, DynamoDB, API Gateway)
2. AWS CLI configured with credentials
3. Node.js 18+ installed
4. Frontend built and ready for deployment

## Deployment Steps

### Step 1: Build Backend Infrastructure

Ensure the CDK stack is deployed first:

```bash
# Set environment variables
export $(grep -v '^#' .env.production | grep -v '^$' | xargs)

# Build and deploy
npm run build
npm run cdk:deploy
```

### Step 2: Prepare Frontend

```bash
cd frontend

# Install dependencies
npm install

# Build the Next.js application
npm run build
```

### Step 3: Deploy Frontend to S3 + CloudFront

#### Option A: Using the deployment script (Recommended)

```bash
# Make script executable
chmod +x scripts/deploy-frontend.sh

# Deploy to production
./scripts/deploy-frontend.sh production

# Or deploy to staging
./scripts/deploy-frontend.sh staging
```

#### Option B: Manual deployment

```bash
# Get stack outputs
STACK_NAME="JaiibCaiibStack"
REGION="ap-south-1"

BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
  --output text)

DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text)

# Build frontend
cd frontend
npm run build

# Create output directory
mkdir -p out
cp -r .next/static out/ 2>/dev/null || true
cp -r public/* out/ 2>/dev/null || true

cd ..

# Upload to S3
aws s3 sync frontend/out s3://$BUCKET_NAME \
  --region $REGION \
  --delete \
  --cache-control "public, max-age=3600"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*" \
  --region $REGION
```

### Step 4: Verify Deployment

```bash
# Get the CloudFront URL
aws cloudformation describe-stacks \
  --stack-name JaiibCaiibStack \
  --region ap-south-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionUrl`].OutputValue' \
  --output text

# Visit the URL in your browser
```

## Cache Configuration

The CloudFront distribution uses optimized cache policies:

### Static Assets (JS, CSS, Images)
- **Cache Duration**: 1 year
- **Compression**: Enabled (gzip, brotli)
- **Policy**: `CachingOptimized`

### HTML Files
- **Cache Duration**: 1 hour (default), 5 minutes (via S3 metadata)
- **Compression**: Enabled
- **Purpose**: Allow updates without full cache invalidation

### API Routes
- **Cache Duration**: No caching
- **Compression**: Enabled
- **Purpose**: Always fetch fresh data

## Environment Variables

Set these in your frontend `.env.local` or deployment platform:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=https://your-api-gateway-url

# Application settings
NEXT_PUBLIC_APP_NAME=JAIIB-CAIIB Exam Prep Portal
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_LOG_LEVEL=warn
```

## Monitoring

### CloudFront Metrics

```bash
# View CloudFront distribution metrics
aws cloudfront get-distribution-statistics \
  --id $DISTRIBUTION_ID \
  --region ap-south-1
```

### S3 Bucket Metrics

```bash
# List objects in bucket
aws s3 ls s3://$BUCKET_NAME --recursive --human-readable --summarize

# Get bucket size
aws s3 ls s3://$BUCKET_NAME --recursive --human-readable --summarize | tail -1
```

### CloudWatch Logs

```bash
# View CloudFront access logs (if enabled)
aws logs tail /aws/cloudfront/jaiib-caiib --follow --region ap-south-1
```

## Troubleshooting

### Frontend shows 404 errors

**Problem**: CloudFront returns 404 for valid routes

**Solution**: 
1. Verify S3 bucket has the files: `aws s3 ls s3://$BUCKET_NAME`
2. Check CloudFront error responses are configured for SPA routing
3. Invalidate cache: `aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"`

### Stale content after deployment

**Problem**: Old version of site is still showing

**Solution**:
1. Invalidate CloudFront cache: `./scripts/deploy-frontend.sh production`
2. Clear browser cache (Ctrl+Shift+Delete)
3. Wait for invalidation to complete (usually 1-2 minutes)

### S3 bucket access denied

**Problem**: "Access Denied" when uploading to S3

**Solution**:
1. Verify AWS credentials: `aws sts get-caller-identity`
2. Check IAM permissions for S3 and CloudFront
3. Ensure bucket name is correct

### High CloudFront costs

**Problem**: Unexpected CloudFront charges

**Solution**:
1. Check data transfer volume: `aws cloudfront get-distribution-statistics`
2. Enable compression (already enabled in config)
3. Use `PRICE_CLASS_100` for cost optimization (already configured)
4. Consider using CloudFront caching more aggressively

## Performance Optimization

### Enable Compression

Already enabled in the CloudFront distribution for gzip and brotli.

### Use CloudFront Functions

For additional performance, consider adding CloudFront Functions:

```bash
# Example: Rewrite URLs for SPA routing
aws cloudfront create-function \
  --name spa-routing \
  --auto-publish \
  --function-code file://spa-routing.js
```

### Monitor Performance

```bash
# Get CloudFront performance metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name BytesDownloaded \
  --dimensions Name=DistributionId,Value=$DISTRIBUTION_ID \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

## Custom Domain (Optional)

To use a custom domain instead of CloudFront domain:

```bash
# 1. Create/verify ACM certificate for your domain
aws acm request-certificate \
  --domain-name example.com \
  --validation-method DNS \
  --region us-east-1

# 2. Update CloudFront distribution with custom domain
aws cloudfront update-distribution \
  --id $DISTRIBUTION_ID \
  --distribution-config file://distribution-config.json

# 3. Update Route53 DNS records to point to CloudFront
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --change-batch file://dns-change.json
```

## Rollback

To rollback to a previous version:

```bash
# List S3 object versions
aws s3api list-object-versions \
  --bucket $BUCKET_NAME \
  --region ap-south-1

# Restore previous version
aws s3api get-object \
  --bucket $BUCKET_NAME \
  --key index.html \
  --version-id VERSION_ID \
  index.html

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

## Cost Estimation

### Monthly Costs (Approximate)

- **S3 Storage**: $0.023 per GB (typically 50-100 MB for frontend)
- **CloudFront Data Transfer**: $0.085 per GB (varies by region)
- **CloudFront Requests**: $0.0075 per 10,000 requests

**Example**: 1000 daily users, 100 MB frontend, 1 GB monthly transfer
- S3: ~$0.01
- CloudFront: ~$0.09
- **Total**: ~$0.10/month

## Next Steps

1. Set up custom domain with Route53
2. Enable CloudFront logging for analytics
3. Configure WAF rules for security
4. Set up CI/CD pipeline for automated deployments
5. Monitor performance and costs

## Support

For issues or questions:
1. Check CloudFront distribution status
2. Review S3 bucket permissions
3. Check CloudWatch logs
4. Verify AWS credentials and IAM permissions
