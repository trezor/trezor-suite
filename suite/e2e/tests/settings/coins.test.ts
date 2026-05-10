import type { NetworkSymbol } from '@suite-common/wallet-config';
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
        async ({ dashboardPage, settingsPage, assetsSection }) => {
            const defaultUncheckedMainnet: NetworkSymbol[] = [
                'btc',
                'ltc',
                'eth',
                'etc',
                'xrp',
                // 'xlm', add when removed from experimental features
                'bch',
                'doge',
                'zec',
                'ada',
                'sol',
            ];
            // Testnets are not shown in ActivateAssetsModal, must be enabled via coins settings
            const defaultUncheckedTestnet: NetworkSymbol[] = [
                'test',
                'tsep',
                'thod',
                'txrp',
                // 'txlm', add when removed from experimental features
                'dsol',
            ];
            const defaultUnchecked: NetworkSymbol[] = [
                ...defaultUncheckedMainnet,
                ...defaultUncheckedTestnet,
            ];

            await test.step('Empty state on dashboard', async () => {
                await settingsPage.toggleTestnetNetworks();
                await settingsPage.navigateTo('coins');

                for (const network of defaultUnchecked) {
                    await expect(settingsPage.coinsTab.networkButton(network)).toBeDisabledCoin();
                }
                // check dashboard with all coins disabled
                await dashboardPage.navigateTo();
                await expect(dashboardPage.discoveryEmptyHeader).toHaveTranslation(
                    'TR_YOUR_WALLET_IS_READY_WHAT',
                );
                await expect(dashboardPage.discoveryEmptyDesc).toHaveTranslation(
                    'TR_DASHBOARD_ACTIVATE_ASSETS_DESC',
                );
                await expect(dashboardPage.discoveryEmptyPrimaryButton).toHaveTranslation(
                    'TR_DASHBOARD_GET_STARTED',
                );
            });

            await test.step('Activate assets', async () => {
                await dashboardPage.discoveryEmptyPrimaryButton.click();
                for (const network of defaultUncheckedMainnet) {
                    await assetsSection.activateAssetsModalNetworkButton(network).click();
                }
                await assetsSection.activateAssetsModalSaveButton.click();
                await settingsPage.navigateTo('coins');
                await settingsPage.coinsTab.temporarilySetOfficialCardanoBackend();
                for (const network of defaultUncheckedTestnet) {
                    await settingsPage.coinsTab.enableNetwork(network);
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
