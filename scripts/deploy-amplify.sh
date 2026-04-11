#!/bin/bash

set -e

ENVIRONMENT=${1:-production}
APP_NAME="jaiib-caiib-frontend"
REGION="ap-south-1"

echo "🚀 Deploying frontend to AWS Amplify"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"

# Check if Amplify CLI is installed
if ! command -v amplify &> /dev/null; then
  echo "📦 Installing AWS Amplify CLI..."
  npm install -g @aws-amplify/cli
fi

# Initialize Amplify if not already done
if [ ! -d "amplify" ]; then
  echo "🔧 Initializing Amplify..."
  amplify init --amplify '{"projectName":"jaiib-caiib","envName":"'$ENVIRONMENT'","defaultEditor":"code","appType":"javascript","framework":"nextjs","srcDir":"frontend","distDir":"frontend/.next"}' --yes
fi

# Push to Amplify
echo "📤 Deploying to Amplify..."
amplify push --yes

# Get the Amplify app URL
echo ""
echo "✅ Frontend deployment complete!"
echo "🌐 Your frontend is now live on AWS Amplify"
echo ""
echo "To view your app:"
echo "  amplify console"
