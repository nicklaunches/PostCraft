#!/usr/bin/env node

/**
 * PostCraft CLI
 * Starts the PostCraft Studio on localhost:3579
 */

const { spawn } = require('child_process');
const path = require('path');

// Get the directory where postcraft is installed
const postcraftDir = path.join(__dirname, '..');

console.log('\n🚀 Starting PostCraft Studio...\n');

// Start Next.js dev server for PostCraft Studio
const child = spawn('npx', ['next', 'dev', '-H', '127.0.0.1', '-p', '3579'], {
  cwd: postcraftDir,
  stdio: 'inherit',
  shell: true
});

child.on('error', (error) => {
  console.error('Failed to start PostCraft Studio:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

// Handle SIGINT and SIGTERM
process.on('SIGINT', () => {
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});
