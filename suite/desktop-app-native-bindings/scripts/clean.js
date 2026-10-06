#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('Cleaning build artifacts and src directory...');

try {
    // Use yarn global rimraf to clean directories
    execSync('yarn g:rimraf ./build', { stdio: 'inherit' });
    execSync('yarn g:rimraf ./src/win_hello.node', { stdio: 'inherit' });
    console.log('Clean completed successfully');
} catch (error) {
    console.error('Clean failed:', error.message);
    process.exit(1);
}
