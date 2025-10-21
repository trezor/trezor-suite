import { expect, test } from '../../support/fixtures';

test.describe(
    'Settings changes persist when device disconnected',
    { tag: ['@group=settings'] },
    () => {
        const ADDRESS_INDEX_1 = 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v';

        test.beforeEach(async ({ onboardingPage }) => {
            await onboardingPage.completeOnboarding();
        });

        test.use({
            emulatorSetupConf: {
                needs_backup: true,
                mnemonic: 'mnemonic_all',
            },
        });

        test('Settings navigation', async ({
            page,
            walletPage,
            settingsPage,
            dashboardPage,
            tradingPage,
            trezorUserEnvLink,
            emulatorStartConf,
        }) => {
            await test.step('Go to send form and verify prompt to connect Trezor', async () => {
                await settingsPage.navigateTo('application');
                await settingsPage.toggleDebugModeInSettings();

                await settingsPage.navigateTo('coins');
                await settingsPage.coins.enableNetwork('regtest');

                await trezorUserEnvLink.startEmu({ ...emulatorStartConf, wipe: false });

                await trezorUserEnvLink.sendToAddressAndMineBlock({
                    address: ADDRESS_INDEX_1,
                    btc_amount: 1,
                });

                await dashboardPage.dashboardMenuButton.click();
                await walletPage.openAccount({ symbol: 'regtest' });

                await page.getByTestId('@wallet/menu/wallet-send').click();
                await trezorUserEnvLink.stopEmu();
                await expect(
                    page
                        .getByTestId('@menu/switch-device')
                        .getByTestId('@deviceStatus-disconnected'),
                ).toBeVisible({ timeout: 30_000 });
                await tradingPage.sendAddressInput.fill(ADDRESS_INDEX_1);
                await tradingPage.sendAmountInput.fill('0.3');

                await page.getByTestId('@send/review-button').click();
                await expect(page.getByTestId('@suite/connection-modal')).toBeVisible();
                await page.getByTestId('@modal/close-button').click();
            });

            await test.step('Go to settings and verify Trezor disconnected warning', async () => {
                await page.getByTestId('@suite/menu/settings').click();
                await page.getByTestId('@settings/menu/device').click();
                await expect(
                    page.getByTestId('@settings/device/disconnected-device-banner'),
                ).toBeVisible();
            });
        });
    },
);
