import type { NetworkSymbol } from '@suite-common/wallet-config';
import { getRandomInt } from '@trezor/utils';

import { expect, test } from '../../support/fixtures';

// discovery should end within this time frame
const DISCOVERY_LIMIT = 1000 * 60 * 2;

const coinsToActivate = [
    'btc',
    'ltc',
    'eth',
    'etc',
    'bch',
    'doge',
    'ada',
    'xrp',
    'zec',
] as NetworkSymbol[];

test.describe('Discovery', { tag: ['@T3W1', '@T3T1', '@smoke'] }, () => {
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    test('go to wallet settings page, activate all coins and see that there is equal number of records on dashboard', async ({
        page,
        dashboardPage,
        settingsPage,
        walletPage,
    }) => {
        await test.step('Activate coins', async () => {
            await settingsPage.navigateTo('coins');
            for (const coin of coinsToActivate) {
                await settingsPage.coinsTab.enableNetwork(coin);
                if (coin === 'ada') {
                    await settingsPage.coinsTab.temporarilySetOfficialCardanoBackend();
                }
            }
        });

        await test.step('Trigger discovery and reload after random delay', async () => {
            await dashboardPage.dashboardMenuButton.click();
            // waiting for discovery bar was unstable so we switched to awaiting flag in redux db
            await page.expectReduxSubtreeToContain('wallet.discovery', 'status', 'starting');

            // wait randomly between 100 and 3000 ms
            await page.waitForTimeout(getRandomInt(1, 30) * 100);

            // trigger reload to simulate interruption. we want to make sure that communication with the device does not
            // end up in some de-synced state. if this test becomes flaky, this reload might be the reason.
            await page.reload();
        });

        await test.step('Wait for discovery completion and check all coins are shown', async () => {
            await expect(page.getByTestId('@deviceStatus-connected')).toBeVisible({
                timeout: DISCOVERY_LIMIT,
            });
            // Discovery bar does not have to be shown at all if discovery finished before reload, so we build verification on accounts' visibility
            await expect(dashboardPage.loading).toBeHidden({ timeout: DISCOVERY_LIMIT });
            await page.expectReduxSubtreeToContain('wallet.discovery', 'status', 'complete', {
                timeout: DISCOVERY_LIMIT,
            });
            const expectedAccounts = coinsToActivate;
            for (const symbol of expectedAccounts) {
                await expect
                    .soft(
                        walletPage.balanceOfAccount({ symbol, atIndex: 0 }),
                        `Failed to discover ${symbol} account`,
                    )
                    .toBeVisible({
                        timeout: DISCOVERY_LIMIT,
                    });
            }
        });
    });
});
