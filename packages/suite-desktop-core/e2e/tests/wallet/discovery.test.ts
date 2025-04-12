import { NetworkSymbol } from '@suite-common/wallet-config';
import { getRandomInt } from '@trezor/utils';

import { expect, test } from '../../support/fixtures';

// discovery should end within this time frame
const DISCOVERY_LIMIT = 1000 * 60 * 2;

const coinsToActivate = [
    'ltc',
    'eth',
    'etc',
    'bch',
    'doge',
    'ada',
    'xrp',
    'zec',
] as NetworkSymbol[];
test.describe('Discovery', { tag: ['@group=wallet'] }, () => {
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    test('go to wallet settings page, activate all coins and see that there is equal number of records on dashboard', async ({
        page,
        dashboardPage,
        settingsPage,
        walletPage,
    }) => {
        await settingsPage.navigateTo('coins');
        for (const symbol of coinsToActivate) {
            await settingsPage.coins.enableNetwork(symbol);
        }

        await dashboardPage.dashboardMenuButton.click();
        // all available networks should return something from discovery
        await expect(dashboardPage.loading).toBeVisible({ timeout: 10000 });

        // wait randomly between 1000 and 4000 ms
        await page.waitForTimeout(getRandomInt(1, 40) * 100);

        // trigger reload to simulate interruption. we want to make sure that communication with the device does not
        // end up in some de-synced state. if this test becomes flaky, this reload might be the reason.
        await page.reload();
        await expect(page.getByTestId('@deviceStatus-connected')).toBeVisible();
        await expect(dashboardPage.loading).toBeVisible({ timeout: 10000 });
        await dashboardPage.loading.waitFor({ state: 'detached', timeout: DISCOVERY_LIMIT });
        for (const symbol of ['btc', ...coinsToActivate] as NetworkSymbol[]) {
            await expect(walletPage.balanceOfAccount(symbol).first()).toBeVisible();
        }
    });
});
