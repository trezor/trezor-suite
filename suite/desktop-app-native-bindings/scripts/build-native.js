#!/usr/bin/env node

import { execSync } from 'child_process';
import os from 'os';

// Check if running on Windows
if (os.platform() !== 'win32') {
    console.error('Error: This build script can only be run on Windows platforms');
    process.exit(1);
}

console.log('Building native module...');

try {
    // Run node-gyp rebuild with path to binding.gyp in src directory
    execSync('node-gyp rebuild --directory=src', { stdio: 'inherit' });
    console.log('Native module built successfully');

    // Copy binary after successful build
    execSync('node scripts/copy-binary.js', { stdio: 'inherit' });
} catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
}
