#!/bin/bash

set -e

ENVIRONMENT=${1:-production}
REGION=${AWS_REGION:-ap-south-1}
STACK_NAME="JaiibCaiibStack"

echo "🚀 Deploying frontend to S3 + CloudFront"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"

# Get stack outputs
echo "📋 Fetching stack outputs..."
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
  echo "❌ Failed to get stack outputs"
  exit 1
fi

echo "✅ Stack outputs retrieved"

# Build frontend
echo ""
echo "🔨 Building frontend..."
cd frontend
npm run build 2>&1 | tail -20
cd ..

# Upload static files
echo ""
echo "📤 Uploading to S3..."
aws s3 sync frontend/.next/static s3://$BUCKET_NAME/_next/static \
  --region $REGION \
  --cache-control "public, max-age=31536000, immutable" \
  --delete

# Upload public files
if [ -d "frontend/public" ]; then
  aws s3 sync frontend/public s3://$BUCKET_NAME \
    --region $REGION \
    --cache-control "public, max-age=3600" \
    --delete
fi

# Invalidate CloudFront
echo ""
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*" \
  --region $REGION \
  --query 'Invalidation.Id' \
  --output text

echo ""
echo "✅ Frontend deployment complete!"
echo "🌐 URL: $DISTRIBUTION_URL"
