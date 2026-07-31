/**
 * [throwaway: blockchain-link request baseline — DO NOT MERGE]
 *
 * Per-coin discovery + idle request-count measurement AND a correctness gate.
 *
 * For each coin (env BCL_COINS) this runs an isolated flow: onboard(mnemonic_all) → enable ONLY
 * that coin → run discovery to completion → CORRECTNESS GATE → sit idle BCL_IDLE_MS.
 * Phase markers are written into BCL_LOG so the aggregator can split discovery vs idle per coin.
 *
 * CORRECTNESS GATE (prevents "fewer requests because the wallet broke" from scoring as a win):
 * after discovery, the discovered account state is read from redux and, if a committed golden
 * (env BCL_GOLDEN -> tests/wallet/bcl-golden.json) has an entry for the coin, the test ASSERTS
 * history.total >= golden minTx (tx count is monotonic — robust to the public all-seed being swept
 * or funded, unlike balance which is ~0 everywhere), plus no failed:/empty account. A break makes
 * the test RED, and the optimization loop treats a red run as "not a win" (revert). When the golden
 * has no entry for a coin, the observed state is logged (capture mode) so baselines can be committed.
 *
 * This test file is OFF-LIMITS to the optimization agent (it is the ruler).
 */
import { appendFileSync, readFileSync } from 'fs';

import type { NetworkSymbol } from '@suite-common/wallet-config';

import { expect, test } from '../../support/fixtures';

const DISCOVERY_LIMIT = 1000 * 60 * 2;
const IDLE_MS = Number(process.env.BCL_IDLE_MS ?? 60_000);
const COINS = (process.env.BCL_COINS ?? 'btc,eth,sol')
    .split(',')
    .map(c => c.trim())
    .filter(Boolean) as NetworkSymbol[];

type GoldenEntry = { minTx: number; nonEmpty: boolean };
const GOLDEN: Record<string, GoldenEntry> = (() => {
    const path = process.env.BCL_GOLDEN;
    if (!path) return {};
    try {
        return JSON.parse(readFileSync(path, 'utf8'));
    } catch {
        return {};
    }
})();

const bclWrite = (entry: Record<string, unknown>) => {
    const path = process.env.BCL_LOG;
    if (!path) return;
    try {
        appendFileSync(path, `${JSON.stringify({ ...entry, ts: Date.now() })}\n`);
    } catch {
        // ignore
    }
};
const marker = (entry: Record<string, unknown>) => bclWrite({ lvl: 'marker', ...entry });

// read the discovered account state for a coin from redux (client-side, generates no backend traffic)
const readCoinState = async (page: any, coin: string) => {
    const raw = (await page.getReduxObject('wallet.accounts')) ?? [];
    const list: any[] = Array.isArray(raw) ? raw : (raw.accounts ?? []);
    const mine = list.filter(a => a?.symbol === coin);
    const txTotal = mine.reduce((s, a) => s + (a?.history?.total ?? 0), 0);
    const failed = mine.filter(
        a => typeof a?.descriptor === 'string' && a.descriptor.startsWith('failed:'),
    ).length;
    const hasNonEmpty = mine.some(a => a && a.empty === false);
    return { accounts: mine.length, txTotal, failed, hasNonEmpty };
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
                await settingsPage.changeNetworks({
                    enableNetworks: [coin],
                    disableNetworks: coin === 'btc' ? [] : ['btc'],
                });
                await page.expectReduxSubtreeToContain('wallet.discovery', 'status', 'complete', {
                    timeout: DISCOVERY_LIMIT,
                });
                marker({ coin, phase: 'discovery-done' });
            });

            await test.step(`Correctness gate ${coin}`, async () => {
                const state = await readCoinState(page, coin);
                // always log observed state so baselines can be captured from any run
                bclWrite({ lvl: 'golden', coin, ...state });

                const golden = GOLDEN[coin];
                if (!golden) return; // capture mode: no committed baseline yet, only log

                // a request-reducing change must NOT break discovery correctness:
                expect(state.failed, `${coin}: ${state.failed} failed account(s)`).toBe(0);
                if (golden.nonEmpty) {
                    expect(state.hasNonEmpty, `${coin}: no non-empty account discovered`).toBe(true);
                }
                // tx count is monotonic (only ever grows) -> a correct run always has >= baseline
                expect(
                    state.txTotal,
                    `${coin}: tx count ${state.txTotal} < baseline ${golden.minTx} (discovery likely broken)`,
                ).toBeGreaterThanOrEqual(golden.minTx);
            });

            await test.step(`Idle ${Math.round(IDLE_MS / 1000)}s on dashboard`, async () => {
                // steady-state load: periodic sync, per-block resync, keep-alive pings, fiat polling.
                await dashboardPage.dashboardMenuButton.click();
                await expect(page.getByTestId('@deviceStatus-connected')).toBeVisible();
                await page.waitForTimeout(IDLE_MS);
                marker({ coin, phase: 'idle-done' });
            });
        });
    }
});
