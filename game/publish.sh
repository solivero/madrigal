#!/bin/zsh
npx google-artifactregistry-auth .npmrc
npm run build
npm publish