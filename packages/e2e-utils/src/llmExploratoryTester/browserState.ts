import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { error, log } from '../logger';
import { BROWSER_STATE_FILE } from './paths';

// Tracks the harness-owned Playwright runner so setup can replace its browser
// and the run can stop it afterwards. Foreign browsers on :9222 (e.g. the developer's own)
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

async function waitForProcessGroupExit(runnerPid: number): Promise<void> {
    const deadline = Date.now() + 5_000;

    while (Date.now() < deadline) {
        try {
            // A negative PID targets the runner's process group. Signal 0 only checks
            // whether it exists; it does not stop anything.
            process.kill(-runnerPid, 0);
        } catch (processError) {
            // ESRCH means the process group no longer exists: shutdown is complete.
            if (processError.code === 'ESRCH') {
                return;
            }

            throw processError;
        }

        await new Promise(resolve => setTimeout(resolve, 200));
    }

    throw new Error(`Browser runner process group ${runnerPid} did not exit within 5 seconds`);
}

// Stop the harness-owned browser (if any) and remove its state file. Setup
// calls this at start to replace a previous run; run.ts calls it in finally
// at the end of the agent session.
export async function stopHarnessBrowser(): Promise<void> {
    if (existsSync(BROWSER_STATE_FILE)) {
        const stateFileContents = readFileSync(BROWSER_STATE_FILE, 'utf-8');
        const state = JSON.parse(stateFileContents) as BrowserState;

        // Ask the runner to stop. Playwright then closes its Electron/Chromium processes.
        // The negative PID sends this request to the runner's whole process group.
        try {
            process.kill(-state.pid, 'SIGTERM');
        } catch (processError) {
            // An already-stopped runner is fine. Report other errors, such as missing permission.
            if (processError.code !== 'ESRCH') {
                throw processError;
            }
        }

        await waitForProcessGroupExit(state.pid);
        log(`Browser runner (pid ${state.pid}) stopped.`);
    }

    // A browser we did not start (e.g. the developer's own) would steal the
    // CDP attach — refuse to continue rather than onboard in the wrong browser.
    if (await isCdpPortInUse()) {
        throw new Error('a browser the harness does not own is running on :9222 — close it first');
    }
    rmSync(BROWSER_STATE_FILE, { force: true });
}

// Ctrl-C / kill would otherwise leak the browser: it lives in a detached
// process group the terminal signal never reaches.
export function registerHarnessBrowserCleanup(): void {
    for (const signal of ['SIGINT', 'SIGTERM'] as const) {
        process.once(signal, () => {
            stopHarnessBrowser()
                .catch(e => error(`Browser cleanup failed: ${e instanceof Error ? e.message : e}`))
                .finally(() => process.exit(signal === 'SIGINT' ? 130 : 143));
        });
    }
}
