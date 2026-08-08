#!/usr/bin/env bash
# Builds the React client and drops it into server/public so a single
# Node process (server/index.js) serves both the API and the frontend.
set -e
cd "$(dirname "$0")"

echo "Installing client deps..."
cd client && npm install

echo "Building client..."
npm run build

echo "Copying build into server/public..."
rm -rf ../server/public
cp -r dist ../server/public

echo "Installing server deps..."
cd ../server && npm install --omit=dev

echo "Done. Run 'node app.js' inside /server, or zip /server and upload to Hostinger."
