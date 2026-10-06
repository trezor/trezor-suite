import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

/**
 * DRAFT, NOT FOR MERGE. What the home asset table costs while a wallet is discovered under it.
 *
 * `mnemonic_all` is funded across many coins, and a passphrase wallet is discovered on every
 * enabled network at once, so the table is written to again and again with Home on screen — the
 * one flow where an account write and a table render meet. `profiledRenderMs` and
 * `profiledRenderCount` are what its `Profiler` reports; the rest of the metrics are the app's.
 *
 * Run it on the branch that reads the table through selectors and on the one that reads it
 * through indexes, and compare the two reports to each other.
 */
const PASSPHRASE = 'musical passphrase';

const NETWORKS = [
    asNetworkSymbol('btc'),
    asNetworkSymbol('eth'),
    asNetworkSymbol('ltc'),
    asNetworkSymbol('bch'),
    asNetworkSymbol('doge'),
];

test.describe('Performance', { tag: ['@T3W1', '@T3T1', '@perf'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });

    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: NETWORKS });
    });

    test(
        'the home asset table stays within its limits while a passphrase wallet is discovered',
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ dashboardPage, page, perf }) => {
            // Home, where the table is, for the whole discovery.
            await page.goto('/');
            await expect(page.getByTestId('@dashboard/index')).toBeVisible();

            await dashboardPage.openDeviceSwitcher();

            await perf.measure('home-asset-table-discovery', async () => {
                await dashboardPage.addHiddenWallet(PASSPHRASE);
            });

            await expect(page.getByTestId('@dashboard/home-asset-table')).toBeVisible();
        },
    );
});
