#!/usr/bin/env node

/**
 * iSaaSIT Complete Setup Wizard
 * 
 * This script guides users through the complete setup process:
 * 1. Environment variables
 * 2. Convex configuration
 * 3. WorkOS setup instructions
 * 4. GSD (Get Shit Done) installation
 * 
 * Usage: npm run setup
 */

import { execSync } from 'child_process';
import fs from 'fs';
import readline from 'readline';
import path from 'path';

const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

console.log(`${CYAN}`);
console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  iSaaSIT Setup Wizard                                  ║');
console.log('║  Complete project configuration                        ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log(`${RESET}\n`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

function step(number, title) {
  console.log(`\n${CYAN}Step ${number}: ${title}${RESET}`);
  console.log(`${DIM}${'─'.repeat(50)}${RESET}\n`);
}

async function checkEnvFile() {
  const envExists = fs.existsSync('.env.local');
  const envExampleExists = fs.existsSync('.env.local.example');
  
  if (envExists) {
    console.log(`${GREEN}✓ .env.local already exists${RESET}\n`);
    return true;
  }
  
  if (!envExampleExists) {
    console.log(`${RED}✗ .env.local.example not found${RESET}\n`);
    return false;
  }
  
  const answer = await question(
    `${YELLOW}Create .env.local from example? (Y/n): ${RESET}`
  );
  
  if (answer.trim().toLowerCase() !== 'n') {
    fs.copyFileSync('.env.local.example', '.env.local');
    console.log(`${GREEN}✓ Created .env.local${RESET}\n`);
    return true;
  }
  
  return false;
}

async function promptWorkOSConfig() {
  step(1, 'WorkOS AuthKit Configuration');
  
  console.log('You need WorkOS credentials to enable authentication.');
  console.log(`${DIM}Don't have them yet? Get them at: https://workos.com/${RESET}\n`);
  
  const hasCredentials = await question(
    `${CYAN}Do you have your WorkOS Client ID and API Key? (y/N): ${RESET}`
  );
  
  if (hasCredentials.trim().toLowerCase() !== 'y') {
    console.log(`\n${YELLOW}No problem! Here's what you need to do:${RESET}`);
    console.log('  1. Create a WorkOS account at https://workos.com/');
    console.log('  2. Get your Client ID and API Key from the dashboard');
    console.log('  3. Add http://localhost:3000/callback as a redirect URI');
    console.log('  4. Generate a secure cookie password (32+ characters)');
    console.log(`\nThen run ${CYAN}npm run setup${RESET} again.\n`);
    return false;
  }
  
  console.log(`\n${GREEN}Great! Please update your .env.local file with:${RESET}`);
  console.log('  - WORKOS_CLIENT_ID');
  console.log('  - WORKOS_API_KEY');
  console.log('  - WORKOS_COOKIE_PASSWORD');
  console.log('');
  
  await question(`${DIM}Press Enter when ready...${RESET}`);
  return true;
}

async function setupConvex() {
  step(2, 'Convex Backend Setup');
  
  console.log('Setting up Convex backend...\n');
  
  try {
    // Check if convex is already configured
    const convexUrl = process.env.VITE_CONVEX_URL;
    if (convexUrl) {
      console.log(`${GREEN}✓ Convex URL found in environment${RESET}\n`);
    }
    
    // Run convex dev to set up
    console.log(`${CYAN}Running: npx convex dev${RESET}\n`);
    execSync('npx convex dev --until-success', { stdio: 'inherit' });
    
    console.log(`\n${GREEN}✓ Convex setup complete${RESET}\n`);
    return true;
  } catch (error) {
    console.error(`${RED}✗ Convex setup failed${RESET}\n`);
    console.log('You can set it up manually with: npx convex dev\n');
    return false;
  }
}

async function setupWorkOSEnv() {
  step(3, 'Configure WorkOS in Convex');
  
  console.log('WorkOS Client ID needs to be set in Convex environment.');
  
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const clientIdMatch = envContent.match(/WORKOS_CLIENT_ID=(.+)/);
  const clientId = clientIdMatch ? clientIdMatch[1].trim() : null;
  
  if (!clientId || clientId === 'client_xxx') {
    console.log(`${YELLOW}⚠ WORKOS_CLIENT_ID not found in .env.local${RESET}\n`);
    return false;
  }
  
  console.log(`${GREEN}✓ Found WORKOS_CLIENT_ID: ${clientId.substring(0, 15)}...${RESET}\n`);
  
  try {
    console.log(`${CYAN}Setting WorkOS Client ID in Convex...${RESET}\n`);
    execSync(`npx convex env set WORKOS_CLIENT_ID ${clientId}`, { stdio: 'inherit' });
    console.log(`\n${GREEN}✓ WorkOS configured in Convex${RESET}\n`);
    return true;
  } catch (error) {
    console.error(`${YELLOW}⚠ Could not set WorkOS Client ID in Convex${RESET}\n`);
    console.log('You can set it manually with:');
    console.log(`  npx convex env set WORKOS_CLIENT_ID ${clientId}\n`);
    return false;
  }
}

async function installGSD() {
  step(4, 'GSD (Get Shit Done) Setup');
  
  // Check if already installed
  const gsdInstalled = fs.existsSync('.claude/commands/gsd') || 
                       fs.existsSync('.opencode/commands/gsd');
  
  if (gsdInstalled) {
    console.log(`${GREEN}✓ GSD is already installed!${RESET}\n`);
    return true;
  }
  
  console.log('GSD is a meta-prompting system for AI-assisted development.');
  console.log('It helps structure development into research → plan → execute cycles.\n');
  
  const install = await question(
    `${CYAN}Install GSD for AI-assisted development? (Y/n): ${RESET}`
  );
  
  if (install.trim().toLowerCase() === 'n') {
    console.log(`\n${YELLOW}Skipped GSD installation.${RESET}`);
    console.log('Install later with: npm run setup:gsd\n');
    return false;
  }
  
  try {
    console.log('');
    execSync('node scripts/setup-gsd.js', { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`${YELLOW}GSD installation failed.${RESET}`);
    console.log('Install later with: npm run setup:gsd\n');
    return false;
  }
}

async function printNextSteps() {
  step(5, 'Next Steps');
  
  console.log(`${GREEN}Setup complete! Here's what's next:${RESET}\n`);
  
  console.log('1. Start development server:');
  console.log(`   ${CYAN}npm run dev${RESET}\n`);
  
  console.log('2. Open your browser:');
  console.log(`   ${CYAN}http://localhost:3000${RESET}\n`);
  
  console.log('3. With GSD installed, you can now use:');
  console.log('   /gsd:map-codebase  - Analyze your codebase');
  console.log('   /gsd:new-project   - Start spec-driven development\n');
  
  console.log('4. Read the documentation:');
  console.log(`   ${CYAN}AGENTS.md${RESET} - AI coding guide`);
  console.log(`   ${CYAN}LLM.txt${RESET} - Quick reference`);
  console.log(`   ${CYAN}.cursor/rules/*.mdc${RESET} - Detailed patterns\n`);
}

async function main() {
  try {
    // Step 1: Environment file
    const envReady = await checkEnvFile();
    if (!envReady) {
      console.log(`${YELLOW}Please create .env.local and try again.${RESET}\n`);
      process.exit(1);
    }
    
    // Step 2: WorkOS credentials
    const hasCredentials = await promptWorkOSConfig();
    if (!hasCredentials) {
      console.log(`${YELLOW}Setup paused. Complete WorkOS setup and run again.${RESET}\n`);
      process.exit(0);
    }
    
    // Step 3: Convex setup
    await setupConvex();
    
    // Step 4: WorkOS in Convex
    await setupWorkOSEnv();
    
    // Step 5: GSD installation
    await installGSD();
    
    // Step 6: Next steps
    await printNextSteps();
    
  } catch (error) {
    console.error(`${RED}Error: ${error.message}${RESET}\n`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
