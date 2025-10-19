#!/usr/bin/env node

/**
 * PostCraft CLI
 * Starts the PostCraft Studio on localhost:3579 or runs database commands
 */

const { spawn } = require('child_process');
const path = require('path');

// Get the directory where postcraft is installed
const postcraftDir = path.join(__dirname, '..');

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

// Handle database commands
if (command === 'db:push' || command === 'db:generate' || command === 'db:studio') {
  console.log(`\n🔧 Running PostCraft ${command}...\n`);

  // Map command to drizzle-kit command
  const drizzleCommand = {
    'db:push': 'push:pg',
    'db:generate': 'generate:pg',
    'db:studio': 'studio'
  }[command];

  // Run drizzle-kit from the postcraft installation directory
  // but use the current working directory's environment variables
  const child = spawn('npx', ['drizzle-kit', drizzleCommand, '--config', path.join(postcraftDir, 'drizzle.config.ts')], {
    cwd: process.cwd(), // Use user's current directory for env variables
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      // Ensure the schema path is relative to postcraft installation
      NODE_PATH: postcraftDir
    }
  });

  child.on('error', (error) => {
    console.error(`Failed to run ${command}:`, error);
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

  return;
}

// Default: Start PostCraft Studio
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
