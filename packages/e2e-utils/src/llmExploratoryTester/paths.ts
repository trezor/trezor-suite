import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

export const REPO_ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], {
    encoding: 'utf-8',
}).trim();

export const BOT_DIR = join(REPO_ROOT, 'packages/e2e-utils/src/llmExploratoryTester');
const REPORTS_DIR = join(BOT_DIR, 'reports');

export const CONTEXT_FILE = join(REPORTS_DIR, 'context.json');
export const TEST_RESULT_FILE = join(REPORTS_DIR, 'test-result.json');
export const BROWSER_STATE_FILE = join(REPORTS_DIR, 'browser-state.json');
export const SETUP_READY_FILE = join(REPORTS_DIR, 'setup-ready');
export const BROWSER_DIR = join(REPORTS_DIR, 'browser');
export const BROWSER_RELATIVE_DIR = relative(REPO_ROOT, BROWSER_DIR);
export const CONTEXT_IMAGES_DIR = join(REPORTS_DIR, 'context-images');
export const CONTEXT_IMAGES_RELATIVE_DIR = relative(REPO_ROOT, CONTEXT_IMAGES_DIR);
// Isolated XDG home so the spawned server cannot merge a global opencode.json.
export const OPENCODE_CONFIG_DIR = join(REPORTS_DIR, 'opencode-config');

export function readJson(path: string): unknown {
    return JSON.parse(readFileSync(path, 'utf-8'));
}

export function writeJson(path: string, data: unknown): void {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}
