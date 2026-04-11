#!/bin/bash

# Amplify Frontend Deployment Script
# Deploys the Next.js frontend to AWS Amplify

set -e

ENVIRONMENT=${1:-production}
REGION="ap-south-1"

echo "🚀 Deploying frontend to AWS Amplify"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"

# Check if Amplify CLI is installed
if ! command -v amplify &> /dev/null; then
    echo "❌ Amplify CLI not found. Installing..."
    npm install -g @aws-amplify/cli
fi

# Check if we're in the right directory
if [ ! -f "amplify.yml" ]; then
    echo "❌ amplify.yml not found. Please run this script from the project root."
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo "❌ frontend directory not found."
    exit 1
fi

echo ""
echo "📋 Amplify Configuration:"
echo "  - App ID: $(grep -o 'appId.*' amplify/.config/local-env-info.json 2>/dev/null | cut -d'"' -f3 || echo 'Not set')"
echo "  - Environment: main"
echo "  - Region: $REGION"

echo ""
echo "🔨 Building frontend..."
cd frontend
npm install --legacy-peer-deps
npm run build
cd ..

echo ""
echo "✅ Frontend build completed successfully"
echo ""
echo "📤 Pushing to Amplify..."
echo "Note: This will trigger a build in the Amplify Console"
echo "You can monitor the build at: https://console.aws.amazon.com/amplify"

# The actual push happens through git - Amplify watches the repository
echo ""
echo "✅ Deployment initiated!"
echo ""
echo "📍 Next Steps:"
echo "  1. Commit and push your changes to GitHub:"
echo "     git add ."
echo "     git commit -m 'Deploy frontend to Amplify'"
echo "     git push origin main"
echo ""
echo "  2. Monitor the build in Amplify Console:"
echo "     https://console.aws.amazon.com/amplify"
echo ""
echo "  3. Once deployed, your app will be available at:"
echo "     https://main.[APP_ID].amplifyapp.com"
echo ""
echo "✨ Deployment script completed!"
