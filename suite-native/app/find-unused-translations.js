#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

// Configuration
const TRANSLATIONS_FILE = '../intl/src/en.ts';
const SEARCH_DIRECTORY = '../';
const FILE_EXTENSIONS = ['*.ts', '*.tsx', '*.js', '*.jsx'];

// Translation usage patterns we're looking for:
// 1. <Translation id="some.key" />
// 2. translate('some.key')
const USAGE_PATTERNS = {
    translationComponent: /<Translation\s+id=["']([^"']+)["']/g,
    translateFunction: /translate\(["']([^"']+)["']/g,
};

function extractKeysFromText(text, usedKeys) {
    // Look for <Translation id="key" /> pattern
    let match;
    while ((match = USAGE_PATTERNS.translationComponent.exec(text)) !== null) {
        usedKeys.add(match[1]); // match[1] is the captured key
    }

    // Look for translate('key') pattern
    while ((match = USAGE_PATTERNS.translateFunction.exec(text)) !== null) {
        usedKeys.add(match[1]); // match[1] is the captured key
    }
}

function extractKeysFromLine(line, usedKeys) {
    extractKeysFromText(line, usedKeys);
}

function findUsedTranslationKeys() {
    console.log(`🔍 Searching for translation usage in ${SEARCH_DIRECTORY}...`);

    const usedKeys = new Set();

    try {
        // Method 1: Use grep for fast searching (Unix/Linux/Mac)
        const findExtensions = FILE_EXTENSIONS.map(ext => `--include="${ext}"`).join(' ');
        const grepCommand = `grep -r ${findExtensions} -h '<Translation id=\\|translate(' ${SEARCH_DIRECTORY}`;

        const grepOutput = execSync(grepCommand, { encoding: 'utf8' });
        const lines = grepOutput.split('\n').filter(line => line.trim());

        for (const line of lines) {
            extractKeysFromLine(line, usedKeys);
        }
    } catch (error) {
        console.log('⚠️  Grep failed, error: ', error);

        // Method 2: Manual search (fallback for Windows or when grep fails)
        const findCommand = FILE_EXTENSIONS.map(ext => `-name "${ext}"`).join(' -o ');

        const files = execSync(`find ${SEARCH_DIRECTORY} ${findCommand}`, { encoding: 'utf8' })
            .split('\n')
            .filter(file => file.trim());

        for (const file of files) {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');
                extractKeysFromText(content, usedKeys);
            }
        }
    }

    return Array.from(usedKeys);
}

function extractTranslationKeys(obj, prefix = '') {
    const keys = [];

    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (typeof value === 'object' && !Array.isArray(value)) {
            // Nested object - recurse deeper
            keys.push(...extractTranslationKeys(value, fullKey));
        } else {
            // This is a translation string
            keys.push(fullKey);
        }
    }

    return keys;
}

function loadAllTranslationKeys() {
    const fileContent = fs.readFileSync(TRANSLATIONS_FILE, 'utf8');

    // Find the main export: "export const en = { ... }"
    const exportMatch = fileContent.match(/export const en = ({[\s\S]*});/);
    if (!exportMatch) {
        throw new Error('Could not find "export const en = {...}" in translations file');
    }

    const translationsObject = eval(`(${exportMatch[1]})`);

    return extractTranslationKeys(translationsObject);
}

function findUnusedKeys(allKeys, usedKeys) {
    const usedKeySet = new Set(usedKeys);

    return allKeys.filter(key => !usedKeySet.has(key));
}

function displayResults(allKeys, usedKeys, unusedKeys) {
    if (unusedKeys.length === 0) {
        console.log('🎉 All translation keys are being used!');

        return;
    }

    console.log(`\n🗑️  FOUND ${unusedKeys.length} UNUSED TRANSLATION KEYS:`);

    // Group by module (first part of the key) for better organization
    const groupedKeys = {};
    for (const key of unusedKeys.sort()) {
        const module = key.split('.')[0];
        if (!groupedKeys[module]) {
            groupedKeys[module] = [];
        }
        groupedKeys[module].push(key);
    }

    // Display grouped results
    for (const [module, keys] of Object.entries(groupedKeys)) {
        console.log(`\n📦 ${module}:`);
        for (const key of keys) {
            console.log(`   • ${key}`);
        }
    }
}

function main() {
    try {
        const allKeys = loadAllTranslationKeys();
        const usedKeys = findUsedTranslationKeys();
        const unusedKeys = findUnusedKeys(allKeys, usedKeys);

        displayResults(allKeys, usedKeys, unusedKeys);

        // Exit with code 1 if unused keys found, 0 if all good
        process.exit(unusedKeys.length > 0 ? 1 : 0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
