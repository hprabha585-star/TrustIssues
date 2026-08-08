#!/usr/bin/env bash
# Builds the React client and drops it into server/public
set -e
cd "$(dirname "$0")"

echo "📦 Installing client dependencies..."
cd client && npm install

echo "🔨 Building React app..."
npm run build

echo "📁 Copying build to server/public..."
rm -rf ../server/public
mkdir -p ../server/public
cp -r dist/* ../server/public/

echo "📦 Installing server dependencies..."
cd ../server && npm install --omit=dev

echo "✅ Build complete! Ready for deployment."
echo "   Entry file: server/app.js"
