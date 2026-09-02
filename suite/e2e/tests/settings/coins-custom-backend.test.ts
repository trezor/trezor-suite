import type { NetworkSymbol, ServerType } from '@suite-common/wallet-config';
import { BlockbookProxyMock, TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

const BTC_BACKEND_WS_URL = 'wss://btc1.trezor.io/websocket';

type Coin = {
    coin: NetworkSymbol;
    backendType: ServerType;
    customBackendUrlRight: string;
    customBackendUrlWrong: string;
};

test.describe('Coin Settings', { tag: ['@T3W1', '@T3T1'] }, () => {
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
                await test.step(`Enable ${coin.toUpperCase()} asset`, async () => {
                    await settingsPage.coinsTab.expectNetworkDisabled(coin);
                    await settingsPage.coinsTab.enableNetwork(coin);
                    await settingsPage.coinsTab.expectNetworkEnabled(coin);
                });

                await test.step(`Enable custom ${backendType} server`, async () => {
                    await settingsPage.coinsTab.openNetworkAdvanceSettings(coin);
                    await settingsPage.coinsTab.changeBackend(backendType, customBackendUrlRight);
                    await settingsPage.coinsTab.expectCustomBackendIndicator(coin);
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
                await test.step(`Enable ${coin.toUpperCase()} asset`, async () => {
                    await settingsPage.coinsTab.expectNetworkDisabled(coin);
                    await settingsPage.coinsTab.enableNetwork(coin);
                    await settingsPage.coinsTab.expectNetworkEnabled(coin);
                });

                await test.step(`Enable custom ${backendType} server`, async () => {
                    await settingsPage.coinsTab.openNetworkAdvanceSettings(coin);
                    await settingsPage.coinsTab.changeBackend(backendType, customBackendUrlWrong);
                    await settingsPage.coinsTab.expectCustomBackendIndicator(coin);
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

    test(
        'Set a custom BTC backend before enabling the network',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a custom Bitcoin blockbook backend can be configured while the network is still disabled, that no communication reaches the backend until the network is enabled, that the sidebar custom-backend icon appears, and that reverting to the default backend reconnects away from the custom server.',
                category: TestCategory.Settings,
                priority: TestPriority.Medium,
                stream: TestStream.Foundation,
            }),
        },
        async ({ page, dashboardPage, settingsPage, walletPage }) => {
            const backendType: ServerType = 'blockbook';
            const backendProxy = new BlockbookProxyMock(BTC_BACKEND_WS_URL);
            await backendProxy.start();

            try {
                await test.step('BTC starts disabled', async () => {
                    await settingsPage.coinsTab.expectNetworkDisabled('btc');
                });

                await test.step('Set a custom backend without enabling the network', async () => {
                    await settingsPage.coinsTab.openNetworkAdvanceSettings('btc', {
                        autoEnable: false,
                    });
                    await settingsPage.coinsTab.changeBackend(backendType, backendProxy.url);
                    await settingsPage.coinsTab.expectCustomBackendIndicator('btc');
                    await settingsPage.coinsTab.expectNetworkDisabled('btc');
                    await expect(dashboardPage.customBackendButton).toBeHidden();
                    expect(
                        backendProxy.connectedClients,
                        'Expected no connection to the backend while the network is disabled',
                    ).toBe(0);
                });

                await test.step('Enable BTC & run discovery against the custom backend', async () => {
                    await settingsPage.coinsTab.enableNetwork('btc');
                    await settingsPage.coinsTab.expectCustomBackendIndicator('btc');
                    await settingsPage.coinsTab.activateCoinsButton.click();
                    await Promise.all([
                        settingsPage.verifyDiscoveryLoaderFinishes(),
                        page.discoveryShouldFinish(),
                    ]);
                    await expect
                        .poll(() => backendProxy.connectedClients, {
                            message: 'Expected discovery to connect to the custom backend',
                        })
                        .toBeGreaterThan(0);
                });

                await test.step('Open BTC account & verify it is loaded successfully', async () => {
                    await walletPage.openAccount({ symbol: 'btc' });
                    await expect(walletPage.emptyAccount).toContainTranslation(
                        'TR_ACCOUNT_IS_EMPTY_TITLE',
                    );
                    await expect(dashboardPage.customBackendButton).toBeVisible();
                });

                await test.step('Revert to the default backend and reconnect', async () => {
                    await settingsPage.navigateTo('coins');
                    await settingsPage.coinsTab.openNetworkAdvanceSettings('btc');
                    await settingsPage.coinsTab.revertToDefaultBackend();
                    await settingsPage.coinsTab.expectNoCustomBackendIndicator('btc');
                    await expect(dashboardPage.customBackendButton).toBeHidden();
                    await expect
                        .poll(() => backendProxy.connectedClients, {
                            message: 'Expected Suite to disconnect from the custom backend',
                        })
                        .toBe(0);
                    await walletPage.openAccount({ symbol: 'btc' });
                    await expect(walletPage.emptyAccount).toContainTranslation(
                        'TR_ACCOUNT_IS_EMPTY_TITLE',
                    );
                });
            } finally {
                await backendProxy.stop();
            }
        },
    );
});
