#!/usr/bin/env node

/**
 * Restructure dist folder for Netlify deployment:
 * - Move dist/client/* to dist/ (root)
 * - Keep dist/server/ as-is (for potential serverless functions)
 * - This makes dist/index.html available at the root for Netlify
 */

import { cpSync, rmSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const distDir = join(__dirname, '../dist');
const clientDir = join(distDir, 'client');

console.log('Restructuring dist folder for Netlify...');

// Check if client directory exists
if (!existsSync(clientDir)) {
  console.error('❌ dist/client not found. Run build first.');
  process.exit(1);
}

// Move all files from dist/client to dist root
const clientFiles = readdirSync(clientDir);
console.log(`Moving ${clientFiles.length} items from dist/client to dist/`);

for (const file of clientFiles) {
  const srcPath = join(clientDir, file);
  const destPath = join(distDir, file);

  // Copy the file/directory
  cpSync(srcPath, destPath, { recursive: true });
  console.log(`  ✓ ${file}`);
}

// Remove the now-empty client directory
rmSync(clientDir, { recursive: true, force: true });

console.log('✓ Restructuring complete!');
console.log('  - dist/index.html (at root)');
console.log('  - dist/server/ (preserved)');
console.log('  - dist/docs/ (will be added next)');
