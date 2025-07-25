#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const source = path.join(__dirname, '..', 'src', 'build', 'Release', 'win_hello.node');
const dest = path.join(__dirname, '..', '..', 'suite-data', 'files', 'bin', 'win_hello.node');

try {
    // Ensure src directory exists
    fs.mkdirSync(path.join(__dirname, '..', 'src'), { recursive: true });

    // Copy the binary file
    fs.copyFileSync(source, dest);

    console.log('Binary copied to src directory');
} catch (error) {
    console.error('Error copying binary:', error.message);
    process.exit(1);
}
