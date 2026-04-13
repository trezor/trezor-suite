import { BackendType, NetworkSymbol } from '@suite-common/wallet-config';
import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

type Coin = {
    coin: NetworkSymbol;
    backendType: BackendType;
    customBackendUrlRight: string;
    customBackendUrlWrong: string;
};

test.describe('Coin Settings', { tag: ['@T3W1', '@T3T1', '@smoke'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic:
                'mammal walnut prosper gesture level ozone armed coffee tuna feature good december',
        },
    });

    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('coins');
    });

    const coins: Coin[] = [
        {
            coin: 'btc',
            backendType: 'blockbook',
            customBackendUrlRight: `https://btc1.trezor.io`,
            customBackendUrlWrong: `https://btc1-wrong.trezor.io`,
        },
        {
            coin: 'eth',
            backendType: 'blockbook',
            customBackendUrlRight: `https://eth1.trezor.io`,
            customBackendUrlWrong: `https://eth1-wrong.trezor.io`,
        },
    ];

    for (const { coin, backendType, customBackendUrlRight, customBackendUrlWrong } of coins) {
        test(
            `Enable ${coin.toUpperCase()} asset & connect to backend server ${customBackendUrlRight} successfully`,
            {
                annotation: createTestAnnotation({
                    testCase: `Verifies that settings up a custom ${backendType} server for ${coin.toUpperCase()} with correct url ${customBackendUrlRight} will succeed.`,
                    category: TestCategory.Settings,
                    priority: TestPriority.Medium,
                    stream: TestStream.Foundation,
                }),
            },
            async ({ page, settingsPage, walletPage }) => {
                if (coin === 'btc') {
                    await settingsPage.coinsTab.disableNetwork(coin);
                }
                await test.step(`Enable ${coin.toUpperCase()} asset`, async () => {
                    await expect(settingsPage.coinsTab.networkButton(coin)).toBeDisabledCoin();
                    await settingsPage.coinsTab.enableNetwork(coin);
                    await expect(settingsPage.coinsTab.networkButton(coin)).toBeEnabledCoin();
                });
                await test.step(`Enable custom ${backendType} server`, async () => {
                    await settingsPage.coinsTab.openNetworkAdvanceSettings(coin);
                    await settingsPage.coinsTab.changeBackend(backendType, customBackendUrlRight);
                    await expect(settingsPage.coinsTab.networkButton(coin)).toContainTranslation(
                        'TR_CUSTOM_BACKEND',
                    );
                });
                await test.step('Refresh coins', async () => {
                    await settingsPage.coinsTab.activateCoinsButton.click();
                    await Promise.all([
                        settingsPage.verifyDiscoveryLoaderFinishes(),
                        page.discoveryShouldFinish(),
                    ]);
                });
                await test.step(`Open ${coin.toUpperCase()} account & verify it is loaded successfully`, async () => {
                    await walletPage.openAccount({ symbol: coin });
                    await expect(walletPage.emptyAccount).toContainTranslation(
                        'TR_ACCOUNT_IS_EMPTY_TITLE',
                    );
                });
            },
        );

        test(
            `Enable ${coin.toUpperCase()} asset & connect to backend server ${customBackendUrlWrong} errors`,
            {
                annotation: createTestAnnotation({
                    testCase: `Verifies that settings up a custom ${backendType} server for ${coin.toUpperCase()} with wrong url ${customBackendUrlWrong} will fail.`,
                    category: TestCategory.Settings,
                    priority: TestPriority.Medium,
                    stream: TestStream.Foundation,
                }),
            },
            async ({ page, settingsPage, walletPage }) => {
                if (coin === 'btc') {
                    await settingsPage.coinsTab.disableNetwork(coin);
                }
                await test.step(`Enable ${coin.toUpperCase()} asset`, async () => {
                    await expect(settingsPage.coinsTab.networkButton(coin)).toBeDisabledCoin();
                    await settingsPage.coinsTab.enableNetwork(coin);
                    await expect(settingsPage.coinsTab.networkButton(coin)).toBeEnabledCoin();
                });
                await test.step(`Enable custom ${backendType} server`, async () => {
                    await settingsPage.coinsTab.openNetworkAdvanceSettings(coin);
                    await settingsPage.coinsTab.changeBackend(backendType, customBackendUrlWrong);
                    await expect(settingsPage.coinsTab.networkButton(coin)).toContainTranslation(
                        'TR_CUSTOM_BACKEND',
                    );
                });
                await test.step('Refresh coins', async () => {
                    await settingsPage.coinsTab.activateCoinsButton.click();
                    await Promise.all([
                        settingsPage.verifyDiscoveryLoaderFinishes(),
                        page.discoveryShouldFinish(),
                    ]);
                });
                await test.step(`Open ${coin.toUpperCase()} account & verify it errors to load`, async () => {
                    await walletPage.accountButton({ symbol: coin }).click();
                    await expect(walletPage.accountNotLoaded).toContainTranslation(
                        'TR_ACCOUNT_EXCEPTION_DISCOVERY_ERROR',
                    );
                });
            },
        );
    }
});
