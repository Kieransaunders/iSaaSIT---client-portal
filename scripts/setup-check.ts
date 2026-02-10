#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    bold: "\x1b[1m",
};

function log(message: string, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logStep(step: string) {
    log(`\n${colors.bold}Step: ${step}${colors.reset}`);
}

async function runCheck() {
    log(`${colors.bold}${colors.blue}--- iSaaSIT Setup Validator ---${colors.reset}`, colors.blue);

    let hasErrors = false;
    let hasWarnings = false;

    // 1. Check for .env.local
    logStep("Checking environment files...");
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        log("✅ .env.local found", colors.green);
    } else {
        log("❌ .env.local missing! Create it from .env.local.example", colors.red);
        hasErrors = true;
    }

    // 2. Validate required environment variables
    logStep("Validating environment variables...");
    const requiredVars = [
        'WORKOS_CLIENT_ID',
        'WORKOS_API_KEY',
        'WORKOS_COOKIE_PASSWORD',
        'WORKOS_REDIRECT_URI',
    ];

    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const envVars = Object.fromEntries(
            envContent
                .split('\n')
                .map(line => line.split('='))
                .filter(([key]) => key && !key.startsWith('#'))
                .map(([key, val]) => [key.trim(), val?.trim()])
        );

        requiredVars.forEach(v => {
            if (envVars[v]) {
                log(`✅ ${v} is set`, colors.green);
                if (v === 'WORKOS_COOKIE_PASSWORD' && envVars[v].length < 32) {
                    log(`   ⚠️  WORKOS_COOKIE_PASSWORD should be at least 32 characters for security`, colors.yellow);
                    hasWarnings = true;
                }
            } else {
                log(`❌ ${v} is missing`, colors.red);
                hasErrors = true;
            }
        });

        // Optional billing vars
        const billingVars = ['LEMONSQUEEZY_API_KEY', 'LEMONSQUEEZY_WEBHOOK_SECRET'];
        billingVars.forEach(v => {
            if (!envVars[v]) {
                log(`ℹ️  ${v} missing (Optional: Billing will be disabled)`, colors.blue);
            }
        });
    }

    // 3. Check Convex Setup
    logStep("Checking Convex configuration...");
    try {
        const convexJsonPath = path.join(process.cwd(), 'convex.json');
        if (fs.existsSync(convexJsonPath)) {
            log("✅ convex.json found", colors.green);
        } else {
            log("⚠️  convex.json missing. Have you run 'npx convex dev'?", colors.yellow);
            hasWarnings = true;
        }
    } catch (err) {
        log("❌ Error checking Convex config", colors.red);
        hasErrors = true;
    }

    // 4. Final report
    logStep("Final Status");
    if (hasErrors) {
        log("🛑 Setup has critical errors. Please fix them before running 'npm run dev'.", colors.red);
        log("👉 Refer to SETUP.md for detailed instructions.", colors.bold);
        process.exit(1);
    } else if (hasWarnings) {
        log("⚠️  Setup complete with warnings. The app should run, but some features might be limited.", colors.yellow);
        process.exit(0);
    } else {
        log("✨ Success! Your environment is correctly configured.", colors.green);
        log("🚀 Run 'npm run dev' to start developing.", colors.bold);
        process.exit(0);
    }
}

runCheck().catch(err => {
    log(`\nUnexpected error: ${err.message}`, colors.red);
    process.exit(1);
});
