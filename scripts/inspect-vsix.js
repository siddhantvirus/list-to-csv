#!/usr/bin/env node

/**
 * This script builds the VSIX package and then lists its contents
 * to help verify what's being included in your extension package.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get the project root directory
const rootDir = path.resolve(__dirname, '..');
process.chdir(rootDir);

// Build the extension
console.log('Building extension...');
execSync('npm run compile', { stdio: 'inherit' });

// Package the extension
console.log('\nPackaging extension...');
execSync('npx vsce package', { stdio: 'inherit' });

// Find the latest VSIX file
const files = fs.readdirSync(rootDir).filter(file => file.endsWith('.vsix'));
const latestVsix = files.sort().pop();

if (!latestVsix) {
  console.error('No VSIX file found after packaging');
  process.exit(1);
}

// List the contents of the VSIX package
console.log(`\nContents of ${latestVsix}:`);
execSync(`unzip -l "${latestVsix}"`, { stdio: 'inherit' });

console.log('\nVSIX package inspection complete.');
