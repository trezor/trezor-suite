import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { log } from '../logger';
import { BROWSER_STATE_FILE } from './paths';

// Tracks the harness-owned browser so setup can replace it and the run can
// kill it afterwards. Foreign browsers on :9222 (e.g. the developer's own)
// are never tracked here and never killed.
const CDP_ENDPOINT = 'http://127.0.0.1:9222';

interface BrowserState {
    pid: number;
}

export function writeBrowserState(pid: number): void {
    mkdirSync(dirname(BROWSER_STATE_FILE), { recursive: true });
    writeFileSync(BROWSER_STATE_FILE, JSON.stringify({ pid } satisfies BrowserState));
}

async function isCdpPortInUse(): Promise<boolean> {
    try {
        await fetch(`${CDP_ENDPOINT}/json/version`, { signal: AbortSignal.timeout(1_000) });

        return true;
    } catch {
        return false;
    }
}

async function waitForRunnerExit(pid: number): Promise<void> {
    const deadline = Date.now() + 5_000;
    while (Date.now() < deadline) {
        try {
            process.kill(-pid, 0);
        } catch {
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 200));
    }
}

// Kill the harness-owned browser (if any) and remove its state file. Setup
// calls this at start to replace a previous run; run.ts calls it in finally
// at the end of the agent session.
export async function killHarnessBrowser(): Promise<void> {
    if (existsSync(BROWSER_STATE_FILE)) {
        const state = JSON.parse(readFileSync(BROWSER_STATE_FILE, 'utf-8')) as BrowserState;
        rmSync(BROWSER_STATE_FILE, { force: true });

        // Playwright launches Electron/Chromium in separate process groups. Let its
        // signal handlers close them before forcefully stopping the runner.
        try {
            process.kill(-state.pid, 'SIGTERM');
        } catch {
            // Already dead.
        }
        await waitForRunnerExit(state.pid);
        try {
            process.kill(-state.pid, 'SIGKILL');
        } catch {
            // Already dead.
        }
        log(`Browser (pid ${state.pid}) stopped.`);
    }

    // A browser we did not start (e.g. the developer's own) would steal the
    // CDP attach — refuse to continue rather than onboard in the wrong browser.
    if (await isCdpPortInUse()) {
        throw new Error('a browser the harness does not own is running on :9222 — close it first');
    }
}

// Ctrl-C / kill would otherwise leak the browser: it lives in a detached
// process group the terminal signal never reaches.
export function killHarnessBrowserOnExitSignals(): void {
    for (const signal of ['SIGINT', 'SIGTERM'] as const) {
        process.once(signal, () => {
            killHarnessBrowser()
                .catch(() => {})
                .finally(() => process.exit(signal === 'SIGINT' ? 130 : 143));
        });
    }
}
