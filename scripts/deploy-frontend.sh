#!/bin/bash

# Frontend deployment script for S3 + CloudFront
# Usage: ./scripts/deploy-frontend.sh <environment>

set -e

ENVIRONMENT=${1:-production}
REGION=${AWS_REGION:-ap-south-1}

echo "🚀 Deploying frontend to S3 + CloudFront"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"

# Get stack outputs
echo "📋 Fetching stack outputs..."
STACK_NAME="JaiibCaiibStack"

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

DISTRIBUTION_URL=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionUrl`].OutputValue' \
  --output text)

if [ -z "$BUCKET_NAME" ] || [ -z "$DISTRIBUTION_ID" ]; then
  echo "❌ Failed to get stack outputs. Ensure the CDK stack is deployed."
  exit 1
fi

echo "✅ Stack outputs retrieved"
echo "   Bucket: $BUCKET_NAME"
echo "   Distribution ID: $DISTRIBUTION_ID"
echo "   URL: $DISTRIBUTION_URL"

# Build frontend
echo ""
echo "🔨 Building frontend..."
cd frontend
# npm install
npm run build

# Create .next/standalone directory if it doesn't exist
if [ ! -d ".next/standalone" ]; then
  echo "⚠️  .next/standalone not found. Creating optimized build..."
  npm run build
fi

# Export static site
echo "📦 Exporting static site..."
OUT_DIR=".next/standalone/.next/static"
if [ ! -d "$OUT_DIR" ]; then
  OUT_DIR=".next/static"
fi

# Create out directory for static export
mkdir -p out
cp -r .next/static out/ 2>/dev/null || true
cp -r public/* out/ 2>/dev/null || true

# For Next.js 15, we need to handle the build differently
# Create a simple export by copying the build artifacts
if [ -d ".next" ]; then
  echo "📁 Preparing build artifacts..."
  # Copy all necessary files
  cp -r .next/static out/ 2>/dev/null || true
  cp public/* out/ 2>/dev/null || true
fi

cd ..

# Upload to S3
echo ""
echo "📤 Uploading to S3..."
aws s3 sync frontend/out s3://$BUCKET_NAME \
  --region $REGION \
  --delete \
  --cache-control "public, max-age=3600" \
  --exclude ".git/*" \
  --exclude "node_modules/*" \
  --exclude ".next/*"

# Upload HTML files with shorter cache
echo "📄 Uploading HTML files with shorter cache..."
aws s3 sync frontend/out s3://$BUCKET_NAME \
  --region $REGION \
  --include "*.html" \
  --cache-control "public, max-age=300" \
  --metadata-directive REPLACE

# Invalidate CloudFront cache
echo ""
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*" \
  --region $REGION

echo ""
echo "✅ Frontend deployment complete!"
echo "🌐 Frontend URL: $DISTRIBUTION_URL"
echo ""
echo "Note: CloudFront invalidation may take a few minutes to complete."
echo "Visit the URL above to see your deployed frontend."
