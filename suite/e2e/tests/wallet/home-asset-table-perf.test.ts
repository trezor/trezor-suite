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
const NETWORKS = [
    asNetworkSymbol('btc'),
    asNetworkSymbol('eth'),
    asNetworkSymbol('ltc'),
    asNetworkSymbol('bch'),
    asNetworkSymbol('doge'),
    asNetworkSymbol('etc'),
    asNetworkSymbol('zec'),
    asNetworkSymbol('ada'),
    asNetworkSymbol('sol'),
    asNetworkSymbol('xrp'),
];

/**
 * The seed and the passphrase come from the environment, so a wallet of your own can be measured
 * without either of them being written down here. `E2E_MNEMONIC` is a seed or one of the names
 * trezor-user-env knows; `E2E_PASSPHRASE`, when given, makes the measured wallet a passphrase one.
 *
 * Anything on screen is recorded: the run writes screenshots, a video and a trace under
 * `suite/e2e/test-results`. With a seed of your own those hold its balances and addresses, so
 * delete that directory when you are done.
 */
const MNEMONIC = process.env.E2E_MNEMONIC ?? 'mnemonic_all';
const PASSPHRASE = process.env.E2E_PASSPHRASE;

/** A passphrase wallet discovered over a seed funded everywhere outlasts the usual wait. */
const DISCOVERY_TIMEOUT = 600_000;

test.describe('Performance', { tag: ['@T3W1', '@T3T1', '@perf'] }, () => {
    test.use({
        deviceSetup: { mnemonic: MNEMONIC, passphrase_protection: PASSPHRASE !== undefined },
    });

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
            await dashboardPage.dashboardMenuButton.click();
            await expect(page.getByTestId('@dashboard/index')).toBeVisible();

            await dashboardPage.openDeviceSwitcher();

            const discoveryBar = page.getByTestId('@wallet/discovery-progress-bar');

            if (PASSPHRASE === undefined) {
                await dashboardPage.ejectWallet();
            }

            await perf.measure('home-asset-table-discovery', async () => {
                if (PASSPHRASE === undefined) {
                    await dashboardPage.addStandardWallet();

                    return;
                }

                // The page object's own wait for discovery is shorter than a well used wallet
                // needs, so the wait is here instead.
                await dashboardPage.addHiddenWallet(PASSPHRASE, { skipDiscovery: true });
                await discoveryBar.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {});
                await expect(discoveryBar).toBeHidden({ timeout: DISCOVERY_TIMEOUT });
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
