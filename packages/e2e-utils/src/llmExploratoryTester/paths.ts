import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const REPO_ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], {
    encoding: 'utf-8',
}).trim();

// Matches the literals in mcp.json, sandboxGate.mjs and AGENT.md.
export const BOT_DIR = join(REPO_ROOT, 'packages/e2e-utils/src/llmExploratoryTester');
const REPORTS_DIR = join(BOT_DIR, 'reports');

export const CONTEXT_FILE = join(REPORTS_DIR, 'context.json');
export const TEST_RESULT_FILE = join(REPORTS_DIR, 'test-result.json');
export const BROWSER_STATE_FILE = join(REPORTS_DIR, 'browser-state.json');
export const SETUP_READY_FILE = join(REPORTS_DIR, 'setup-ready');
export const BROWSER_DIR = join(REPORTS_DIR, 'browser');

export function readJson(path: string): unknown {
    return JSON.parse(readFileSync(path, 'utf-8'));
}

export function writeJson(path: string, data: unknown): void {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}
