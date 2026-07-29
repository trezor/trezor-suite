/**
 * [throwaway: blockchain-link request baseline — DO NOT MERGE]
 *
 * Per-coin discovery + idle request-count measurement.
 *
 * For each coin (env BCL_COINS, default btc,eth,sol) this runs an isolated flow:
 *   onboard -> enable ONLY that coin -> run discovery to completion -> sit idle for
 *   BCL_IDLE_MS (default 60s; bump for a longer steady-state sample).
 *
 * The backend-request taps (BCL_LOG) log every request in the Electron main process; this test
 * writes phase markers into the same file so `.context/bcl-analyze.mjs` can split the discovery
 * burst from the idle steady-state, per coin.
 *
 * Single device-model tag (@T3T1) => runs once per coin under the -all config. base config uses
 * workers:1 so the per-coin tests (and thus the marker windows) never overlap.
 */
import { appendFileSync } from 'fs';

import type { NetworkSymbol } from '@suite-common/wallet-config';

import { expect, test } from '../../support/fixtures';

// discovery should end within this time frame
const DISCOVERY_LIMIT = 1000 * 60 * 2;
const IDLE_MS = Number(process.env.BCL_IDLE_MS ?? 60_000);
const COINS = (process.env.BCL_COINS ?? 'btc,eth,sol')
    .split(',')
    .map(c => c.trim())
    .filter(Boolean) as NetworkSymbol[];

// phase marker written to the shared BCL_LOG file (this test runs in the Playwright node process,
// the taps run in the Electron main process — both append to the same file, ordered by ts)
const marker = (entry: Record<string, unknown>) => {
    const path = process.env.BCL_LOG;
    if (!path) return;
    try {
        appendFileSync(path, `${JSON.stringify({ lvl: 'marker', ...entry, ts: Date.now() })}\n`);
    } catch {
        // ignore
    }
};

test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });

test.describe('BCL request baseline: per-coin discovery + idle', { tag: ['@T3T1'] }, () => {
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    for (const coin of COINS) {
        test(`discovery + ${Math.round(IDLE_MS / 1000)}s idle: ${coin}`, async ({
            page,
            dashboardPage,
            settingsPage,
        }) => {
            test.setTimeout(DISCOVERY_LIMIT + IDLE_MS + 60_000);

            await test.step(`Discover ${coin}`, async () => {
                marker({ coin, phase: 'discovery-start' });
                // enable ONLY the target coin (btc is the sole default mainnet after onboarding);
                // changeNetworks awaits discoveryShouldFinish() internally
                await settingsPage.changeNetworks({
                    enableNetworks: [coin],
                    disableNetworks: coin === 'btc' ? [] : ['btc'],
                });
                await page.expectReduxSubtreeToContain('wallet.discovery', 'status', 'complete', {
                    timeout: DISCOVERY_LIMIT,
                });
                marker({ coin, phase: 'discovery-done' });
            });

            await test.step(`Idle ${Math.round(IDLE_MS / 1000)}s on dashboard`, async () => {
                // sit on the dashboard so steady-state load accrues: periodic per-coin account sync,
                // per-block resync, keep-alive pings, fiat polling.
                // NOTE: syncAccountsWithBlockchainThunk is gated on selectIsWindowVisible — if idle
                // counts come out ~0, the Electron window is being reported as hidden and visibility
                // must be forced. Pings + block/notification events are not visibility-gated.
                await dashboardPage.dashboardMenuButton.click();
                await expect(page.getByTestId('@deviceStatus-connected')).toBeVisible();
                await page.waitForTimeout(IDLE_MS);
                marker({ coin, phase: 'idle-done' });
            });
        });
    }
});
