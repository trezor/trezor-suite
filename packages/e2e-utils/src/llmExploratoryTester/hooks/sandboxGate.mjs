#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const SUITE_HOST = 'dev.suite.sldev.cz';
const CONTEXT_IMAGES_DIR = 'packages/e2e-utils/src/llmExploratoryTester/reports/context-images';
const BROWSER_DIR = 'packages/e2e-utils/src/llmExploratoryTester/reports/browser';

function deny(reason) {
    process.stderr.write(`${reason}\n`);
    process.exit(2);
}

let event;
try {
    event = JSON.parse(readFileSync(0, 'utf-8'));
} catch {
    deny('invalid PreToolUse JSON');
}

const toolName = String(event.tool_name ?? '');
const toolInput = event.tool_input ?? {};

if (toolName === 'Read') {
    const filePath = String(toolInput.file_path ?? '');
    if (filePath.includes('..') || !filePath.startsWith(`${CONTEXT_IMAGES_DIR}/`)) {
        deny(`Read blocked: ${filePath || 'missing file_path'}`);
    }
}

if (toolName.endsWith('browser_navigate')) {
    const url = new URL(String(toolInput.url).trim());
    if (url.hostname !== SUITE_HOST) {
        deny(`browser_navigate blocked: ${url.href}`);
    }
}

if (toolName.endsWith('browser_tabs')) {
    // Close can drop the only onboarded page (browser_close is already denied), and
    // new opens a tab the agent can navigate away from. List and select stay allowed.
    const action = String(toolInput.action ?? '');
    if (action !== 'list' && action !== 'select') {
        deny(`browser_tabs ${action || 'missing action'} blocked`);
    }
}

if (toolName.endsWith('browser_take_screenshot')) {
    const filename = String(toolInput.filename ?? '');
    if (
        filename.includes('..') ||
        !filename.startsWith(`${BROWSER_DIR}/`) ||
        !filename.endsWith('.png')
    ) {
        deny(`browser_take_screenshot blocked: ${filename || 'missing filename'}`);
    }
}
