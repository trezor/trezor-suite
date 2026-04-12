import { NetworkSymbol } from '@suite-common/wallet-config';
import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('Coin Settings', { tag: ['@T3W1', '@T3T1', '@smoke'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('coins');
    });

    test(
        'go to wallet settings page, check BTC, activate few networks, deactivate them, set custom backend',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can navigate to the wallet settings page, check BTC, activate few networks, deactivate them, and set a custom backend.',
                category: TestCategory.Settings,
                priority: TestPriority.Critical,
                stream: TestStream.Foundation,
            }),
        },
        async ({ dashboardPage, settingsPage }) => {
            const defaultUnchecked: NetworkSymbol[] = [
                'ltc',
                'etc',
                'xrp',
                // 'xlm', add when removed from experimental features
                'bch',
                'doge',
                'zec',
                'ada',
                'sol',
                'test',
                'tsep',
                'thod',
                'txrp',
                // 'txlm', add when removed from experimental features
                'dsol',
            ];

            await test.step('No assets are active', async () => {
                await settingsPage.toggleTestnetNetworks();
                await settingsPage.navigateTo('coins');

                await expect(settingsPage.coinsTab.networkButton('btc')).toBeEnabledCoin();
                await expect(settingsPage.coinsTab.networkButton('eth')).toBeEnabledCoin();
                for (const network of defaultUnchecked) {
                    await expect(settingsPage.coinsTab.networkButton(network)).toBeDisabledCoin();
                }
                await settingsPage.coinsTab.disableNetwork('btc');
                await settingsPage.coinsTab.disableNetwork('eth');
                // check dashboard with all coins disabled
                await dashboardPage.navigateTo();
                await expect(dashboardPage.discoveryEmptyHeader).toHaveTranslation(
                    'TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY',
                );
                await expect(dashboardPage.discoveryEmptyDesc).toHaveTranslation(
                    'TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY_DESC',
                );
                await expect(dashboardPage.discoveryEmptyPrimaryButton).toHaveTranslation(
                    'TR_COIN_SETTINGS',
                );
            });

            await test.step('Activate assets', async () => {
                await dashboardPage.discoveryEmptyPrimaryButton.click();
                await settingsPage.navigateTo('coins');
                for (const network of ['btc', 'eth', ...defaultUnchecked] as NetworkSymbol[]) {
                    await settingsPage.coinsTab.enableNetwork(network);
                    if (network === 'ada') {
                        await settingsPage.coinsTab.temporarilySetOfficialCardanoBackend();
                    }
                }
            });

            await test.step('Connect to trusted ETH backend server', async () => {
                const backendType = 'blockbook';
                const customServer = 'https://eth.marek.pl/';

                await expect(settingsPage.coinsTab.networkButton('eth')).toBeEnabledCoin();
                await settingsPage.coinsTab.openNetworkAdvanceSettings('eth');
                await settingsPage.coinsTab.changeBackend(backendType, customServer);
                await expect(settingsPage.coinsTab.networkButton('eth')).toContainTranslation(
                    'TR_CUSTOM_BACKEND',
                );
            });
        },
    );
});
