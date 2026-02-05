#!/usr/bin/env node

/**
 * GSD (Get Shit Done) Setup Script for iSaaSIT
 * 
 * Installs the GSD meta-prompting system for spec-driven development
 * with Claude Code, OpenCode, or Gemini CLI.
 * 
 * Usage:
 *   npm run setup:gsd           # Interactive mode
 *   npm run setup:gsd -- --claude --local    # Claude Code, local install
 *   npm run setup:gsd -- --all --global      # All runtimes, global install
 * 
 * Reference: https://github.com/glittercowboy/get-shit-done
 */

import { execSync } from 'child_process';
import fs from 'fs';

const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

console.log(`${CYAN}`);
console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  GSD (Get Shit Done) - Setup for iSaaSIT              ║');
console.log('║  Meta-prompting system for AI-assisted development    ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log(`${RESET}\n`);

// Check if GSD is already installed
function checkExistingInstall() {
  const gsdFiles = [
    '.claude/commands/gsd',
    '.opencode/commands/gsd', 
    '.gemini/commands/gsd'
  ];
  
  const existing = gsdFiles.filter(dir => fs.existsSync(dir));
  if (existing.length > 0) {
    console.log(`${YELLOW}⚠ GSD appears to already be installed:${RESET}`);
    existing.forEach(dir => console.log(`  - ${dir}`));
    console.log(`\nTo reinstall, run: npx get-shit-done-cc@latest --uninstall`);
    console.log(`Then run this setup again.\n`);
    return true;
  }
  return false;
}

// Main installation
async function installGSD() {
  if (checkExistingInstall()) {
    process.exit(0);
  }

  console.log(`${CYAN}Installing GSD...${RESET}\n`);
  
  try {
    // Parse any arguments passed through
    const args = process.argv.slice(2);
    const hasRuntime = args.some(arg => ['--claude', '--opencode', '--gemini', '--all'].includes(arg));
    const hasLocation = args.some(arg => ['--local', '--global', '-l', '-g'].includes(arg));
    
    // Default to local + claude if no args provided
    const installArgs = [];
    if (!hasRuntime) installArgs.push('--claude');
    if (!hasLocation) installArgs.push('--local');
    
    const command = `npx get-shit-done-cc@latest ${args.join(' ')} ${installArgs.join(' ')}`;
    
    console.log(`${CYAN}Running: ${command}${RESET}\n`);
    execSync(command, { stdio: 'inherit' });
    
    console.log(`\n${GREEN}✓ GSD installed successfully!${RESET}\n`);
    
    // Print next steps
    console.log(`${CYAN}Next Steps:${RESET}`);
    console.log('  1. Start your AI coding assistant (Claude Code, OpenCode, etc.)');
    console.log('  2. Type: /gsd:help');
    console.log('  3. For existing codebase: /gsd:map-codebase');
    console.log('  4. For new features: /gsd:new-project\n');
    
    console.log(`${CYAN}Recommended Workflow:${RESET}`);
    console.log('  /gsd:map-codebase        → Analyze existing code');
    console.log('  /gsd:discuss-phase 1     → Clarify implementation');
    console.log('  /gsd:plan-phase 1        → Create execution plans');
    console.log('  /gsd:execute-phase 1     → Build the feature');
    console.log('  /gsd:verify-phase 1      → Verify it works\n');
    
  } catch (error) {
    console.error(`${YELLOW}Installation failed. Trying alternative method...${RESET}\n`);
    
    // Fallback: provide manual instructions
    console.log(`${CYAN}Please install manually:${RESET}`);
    console.log('  npx get-shit-done-cc@latest --claude --local\n');
    console.log('For other options:');
    console.log('  npx get-shit-done-cc@latest --help\n');
    process.exit(1);
  }
}

installGSD();
