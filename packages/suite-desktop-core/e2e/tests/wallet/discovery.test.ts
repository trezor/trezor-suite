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
    //TODO: Remove ignoreJSExceptions when bug fixed #19436
    test.use({ ignoreJSExceptions: ['Device disconnected'] });
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    test('go to wallet settings page, activate all coins and see that there is equal number of records on dashboard', async ({
        page,
        suite,
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
        await expect(dashboardPage.loading).toBeVisible();

        // wait randomly between 1000 and 1000 ms
        await page.waitForTimeout(getRandomInt(1, 10) * 100);

        // trigger reload to simulate interruption. we want to make sure that communication with the device does not
        // end up in some de-synced state. if this test becomes flaky, this reload might be the reason.
        await suite.reloadApp();

        await expect(page.getByTestId('@deviceStatus-connected')).toBeVisible({ timeout: 10_000 });
        // Discovery bar does not have to be shown at all if discovery finished before reload, so we build verification on accounts' visibility
        await expect(dashboardPage.loading).toBeHidden({ timeout: DISCOVERY_LIMIT });
        const expectedAccounts = ['btc', ...coinsToActivate] as NetworkSymbol[];
        for (const symbol of expectedAccounts) {
            await expect.soft(walletPage.balanceOfAccount(symbol).first()).toBeVisible({
                timeout: DISCOVERY_LIMIT,
            });
        }
    });
});
