#!/bin/bash

# Build script for Lambda layers
# This script builds both the common dependencies and utility functions layers

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
LAYERS_DIR="$PROJECT_ROOT/infrastructure/lambda-layers"

echo "Building Lambda layers..."
echo "Project root: $PROJECT_ROOT"
echo "Layers directory: $LAYERS_DIR"

# Build common dependencies layer
echo ""
echo "=========================================="
echo "Building common dependencies layer..."
echo "=========================================="

COMMON_DEPS_DIR="$LAYERS_DIR/common-dependencies"
COMMON_DEPS_NODEJS="$COMMON_DEPS_DIR/nodejs"

# Create nodejs directory structure
mkdir -p "$COMMON_DEPS_NODEJS/node_modules"

# Install dependencies
cd "$COMMON_DEPS_DIR"
npm install --production

echo "Common dependencies layer built successfully"

# Build utility functions layer
echo ""
echo "=========================================="
echo "Building utility functions layer..."
echo "=========================================="

UTIL_FUNCS_DIR="$LAYERS_DIR/utility-functions"
UTIL_FUNCS_DIST="$UTIL_FUNCS_DIR/dist"
UTIL_FUNCS_NODEJS="$UTIL_FUNCS_DIST/nodejs/node_modules/shared-utils"

# Clean previous build
rm -rf "$UTIL_FUNCS_DIST"

# Create directory structure
mkdir -p "$UTIL_FUNCS_NODEJS"

# Install dependencies
cd "$UTIL_FUNCS_DIR"
npm install

# Build TypeScript
npm run build

# Copy compiled files to layer structure
cp -r "$UTIL_FUNCS_DIR/dist"/* "$UTIL_FUNCS_NODEJS/"

echo "Utility functions layer built successfully"

# Create layer ZIP files (optional)
echo ""
echo "=========================================="
echo "Creating layer ZIP files..."
echo "=========================================="

cd "$LAYERS_DIR"

# Create common dependencies ZIP
if [ -f "common-dependencies.zip" ]; then
  rm "common-dependencies.zip"
fi
cd "$COMMON_DEPS_DIR"
zip -r "$LAYERS_DIR/common-dependencies.zip" nodejs/

# Create utility functions ZIP
if [ -f "utility-functions.zip" ]; then
  rm "utility-functions.zip"
fi
cd "$UTIL_FUNCS_DIR"
zip -r "$LAYERS_DIR/utility-functions.zip" dist/

echo "Layer ZIP files created successfully"

echo ""
echo "=========================================="
echo "Lambda layers built successfully!"
echo "=========================================="
echo ""
echo "Layer locations:"
echo "  Common dependencies: $COMMON_DEPS_DIR"
echo "  Utility functions: $UTIL_FUNCS_DIR/dist"
echo ""
