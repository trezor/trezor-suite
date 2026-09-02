import { TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('Without device', { tag: ['@T3W1', '@T3T1'] }, () => {
    const ADDRESS_INDEX_1 = 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v';

    test.beforeEach(
        async ({ page, onboardingPage, settingsPage, trezorUserEnv, dashboardPage }) => {
            await onboardingPage.completeOnboarding();

            await test.step('Enable regtest network with balance', async () => {
                await settingsPage.navigateTo('application');
                await settingsPage.toggleDebugModeInSettings();

                await settingsPage.toggleTestnetNetworks();
                await settingsPage.changeNetworks({
                    enableNetworks: ['regtest'],
                    skipActivation: true,
                });

                await trezorUserEnv.sendToAddressAndMineBlock({
                    address: ADDRESS_INDEX_1,
                    btc_amount: 1,
                });
                await dashboardPage.dashboardMenuButton.click();
                await page.discoveryShouldFinish();
            });
        },
    );

    test.use({
        deviceSetup: {
            needs_backup: true,
            mnemonic: 'mnemonic_all',
        },
    });

    test(
        'Send flow prompts for device reconnection when device disconnected',
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ page, device, walletPage, settingsPage, tradingPage }) => {
            await test.step('Go to send form and verify prompt to connect Trezor', async () => {
                await walletPage.openAccount({ symbol: 'regtest' });
                await walletPage.openSendFormButton.click();

                await device.powerOff();
                await expect(walletPage.deviceDisconnectedStatus).toBeVisible({ timeout: 30_000 });

                await tradingPage.sendAddressInput.fill(ADDRESS_INDEX_1);
                await tradingPage.sendAmountInput.fill('0.3');

                await page.getByTestId('@send/review-button').click();
                await expect(page.getByTestId('@suite/connection-modal')).toBeVisible();
                await page.modalCloseButton.click();
            });

            await test.step('Go to settings and verify Trezor disconnected warning', async () => {
                await settingsPage.navigateTo('device');
                await expect(
                    page.getByTestId('@settings/device/disconnected-device-banner'),
                ).toBeVisible();
            });
        },
    );
});
