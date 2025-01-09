import { test, expect } from '../../support/fixtures';

test.describe(
    'Settings changes persist when device disconnected',
    { tag: ['@group=settings'] },
    () => {
        test.beforeEach(async ({ onboardingPage, dashboardPage }) => {
            await onboardingPage.completeOnboarding({ enableViewOnly: true });
            await dashboardPage.discoveryShouldFinish();
        });

        test('Settings navigation', async ({ page, trezorUserEnvLink }) => {
            await test.step('Go to send form and verify Trezor disconnected warning', async () => {
                await page.getByTestId('@account-menu/btc/normal/0').click();
                await page.getByTestId('@wallet/menu/wallet-send').click();
                await trezorUserEnvLink.stopEmu();
                await expect(page.getByTestId('@warning/trezorNotConnected')).toBeVisible();
            });

            await test.step('Go to settings and verify Trezor disconnected warning', async () => {
                await page.getByTestId('@suite/menu/settings').click();
                await page.getByTestId('@settings/menu/device').click();
                await expect(
                    page.getByTestId('@settings/device/disconnected-device-banner'),
                ).toBeVisible();
            });

            await test.step('Reconnect trezor and verify warning is gone', async () => {
                await trezorUserEnvLink.startEmu();
                await page.getByTestId('@suite/menu/suite-index').click();
                await page.getByTestId('@account-menu/btc/normal/0').click();
                await page.getByTestId('@wallet/menu/wallet-send').click();
                await expect(page.getByTestId('@wallet/send/outputs-and-options')).toBeVisible();
                await page
                    .getByTestId('@settings/device/disconnected-device-banner')
                    .waitFor({ state: 'detached' });
            });
        });
    },
);
