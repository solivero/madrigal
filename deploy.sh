#!/bin/bash

# This script makes sure the core package is built and deployed as tarball to frontend and server for consistency
# It is a workaround when Gcloud NPM registry gives 404/403 during core package install in builder

set -e
set -x
rm madrigal-core*.tgz */madrigal-core*.tgz || true
echo "Building and pack game/ aka @madrigal/core package"
npm run build --workspace=game/
npm pack --workspace=game/
# Make sure core tarball is in frontend dir to be uploaded to App Engine
ln -s $(pwd)/madrigal-core*.tgz frontend/madrigal-core.tgz
# Point to built tarball for @madrigal/core dep in frontend package.json
npm install file:frontend/madrigal-core.tgz -w @madrigal/frontend
npm run deploy --workspace @madrigal/frontend
ln -s $(pwd)/madrigal-core*.tgz server/madrigal-core.tgz
npm install file:server/madrigal-core.tgz -w @madrigal/server
npm run deploy --workspace @madrigal/server

