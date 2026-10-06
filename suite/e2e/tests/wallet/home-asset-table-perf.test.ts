import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

/**
 * DRAFT, NOT FOR MERGE. What the home asset table costs while a wallet is discovered under it.
 *
 * `mnemonic_all` is funded across many coins, so discovering it writes account after account with
 * Home on screen — the one flow where an account write and a table render meet. The table logs
 * every render it does; the test prints the last of those lines. On desktop the `Profiler` also
 * reports `profiledRenderMs` and `profiledRenderCount` into the performance report.
 *
 * Run it on the branch that reads the table through selectors and on the one that reads it
 * through indexes, and compare the two reports to each other.
 */
const NETWORKS = [asNetworkSymbol('btc'), asNetworkSymbol('eth')];

test.describe('Performance', { tag: ['@T3W1', '@T3T1', '@perf'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });

    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: NETWORKS });
    });

    test(
        'the home asset table stays within its limits while a wallet is discovered',
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ dashboardPage, page, perf }) => {
            // The table reports every render to the console, so the numbers are there whether or
            // not the performance instrumentation is installed — it is not, on web.
            const profiled: string[] = [];
            page.on('console', message => {
                if (message.text().startsWith('[perf]')) {
                    profiled.push(message.text());
                }
            });

            // Home, where the table is, for the whole discovery.
            await page.goto('/');
            await expect(page.getByTestId('@dashboard/index')).toBeVisible();

            await dashboardPage.openDeviceSwitcher();

            await dashboardPage.ejectWallet();

            await perf.measure('home-asset-table-discovery', async () => {
                await dashboardPage.addStandardWallet();
            });

            await expect(page.getByTestId('@dashboard/home-asset-table')).toBeVisible();

            // eslint-disable-next-line no-console
            console.log(
                `\n[perf] ${profiled.length} render lines; last: ${
                    profiled.at(-1) ?? 'the table never rendered'
                }\n`,
            );
        },
    );
});
