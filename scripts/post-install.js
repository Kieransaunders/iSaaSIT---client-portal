#!/usr/bin/env node

/**
 * Post-install hook for iSaaSIT
 * 
 * This script runs automatically after npm install.
 * It offers to set up GSD (Get Shit Done) for AI-assisted development.
 * 
 * Users can skip this by setting SKIP_GSD_SETUP=1
 */

import { execSync } from 'child_process';
import fs from 'fs';
import readline from 'readline';

const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

// Check if we should skip
if (process.env.SKIP_GSD_SETUP === '1' || process.env.CI === 'true') {
  console.log(`${DIM}Skipping GSD setup (SKIP_GSD_SETUP=1 or CI=true)${RESET}`);
  process.exit(0);
}

// Check if GSD is already installed
function isGSDInstalled() {
  return fs.existsSync('.claude/commands/gsd') || 
         fs.existsSync('.opencode/commands/gsd') ||
         fs.existsSync('.gemini/commands/gsd');
}

// Main function
async function main() {
  console.log('');
  console.log(`${CYAN}╔════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${CYAN}║  Welcome to iSaaSIT!                                   ║${RESET}`);
  console.log(`${CYAN}║  AI-Powered SaaS Starter Kit                           ║${RESET}`);
  console.log(`${CYAN}╚════════════════════════════════════════════════════════╝${RESET}`);
  console.log('');

  // Check if GSD is already installed
  if (isGSDInstalled()) {
    console.log(`${GREEN}✓ GSD (Get Shit Done) is already installed!${RESET}\n`);
    console.log('GSD commands available:');
    console.log('  /gsd:help          - Show all commands');
    console.log('  /gsd:map-codebase  - Analyze your code\n');
    return;
  }

  // Check if we're in an interactive terminal
  if (!process.stdin.isTTY) {
    console.log(`${YELLOW}⚠ Non-interactive environment detected.${RESET}`);
    console.log('To install GSD later, run: npm run setup:gsd\n');
    return;
  }

  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Ask user
  const question = `${CYAN}Would you like to install GSD (Get Shit Done)?${RESET}

GSD is a meta-prompting system for AI-assisted development that helps you:
  • Structure development into research → plan → execute → verify cycles
  • Prevent context rot in long AI conversations
  • Generate project documentation (PROJECT.md, ROADMAP.md, etc.)
  • Work efficiently with Claude Code, OpenCode, or Gemini CLI

Learn more: https://github.com/glittercowboy/get-shit-done

${DIM}Install GSD? (Y/n): ${RESET}`;

  rl.question(question, (answer) => {
    rl.close();
    
    const response = answer.trim().toLowerCase();
    
    if (response === '' || response === 'y' || response === 'yes') {
      console.log('');
      console.log(`${CYAN}Installing GSD...${RESET}\n`);
      
      try {
        execSync('node scripts/setup-gsd.js', { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
      } catch (error) {
        console.error(`${YELLOW}GSD installation failed.${RESET}`);
        console.log('You can try again later with: npm run setup:gsd\n');
      }
    } else {
      console.log('');
      console.log(`${YELLOW}Skipped GSD installation.${RESET}`);
      console.log('To install later, run: npm run setup:gsd\n');
    }
  });
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(0); // Don't fail npm install
});
