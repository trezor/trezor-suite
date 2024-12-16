import { test, expect } from '../../support/fixtures';

// Skip due to minimal value of this test at current state
test.describe.skip('Firmware update', { tag: ['@group=device-management'] }, () => {
    test.use({ emulatorStartConf: { wipe: true, model: 'T2T1', version: '2.5.2' } });
    test.beforeEach(async ({ onboardingPage, dashboardPage }) => {
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
    });

    test('User triggers firmware update from a notification banner', async ({ page }) => {
        await page.getByTestId('@notification/update-notification-banner').click();
        await page.getByTestId('@firmware/install-button').click();

        await expect(page.getByTestId('@firmware-modal')).toBeVisible();
        // await expect(page.getByTestId('@firmware-modal')).toHaveScreenshot('check-seed.png');
        await page.getByTestId('@firmware/confirm-seed-checkbox').click();
        await page.getByTestId('@firmware/confirm-seed-button').click();

        // we can't really test anything from this point since this https://github.com/trezor/trezor-suite/pull/12472 was merged
        // in combination with not doing git lfs checkout in feature branches. Firmware will not be uploaded and an error is presented to user
        // but only in feature branches, develop or production branches should display correct behavior.

        // one point to get over this would be to stub correct (bigger) firmware binary response here, but I don't know how to stub fetch that
        // happens inside a nested iframe (connect-iframe).
        // Update: Trezor env does not support bootloader atm https://github.com/trezor/trezor-user-env/issues/219

        // reconnect in bootloader screen (disconnect)
        // await expect(page.getByTestId('@firmware/disconnect-message')).toHaveText(
        //     'Disconnect your Trezor',
        // );
        // await trezorUserEnvLink.stopBridge();

        // reconnect in bootloader screen (connect in bootloader)
        // await expect(page.getByTestId('@firmware/connect-in-bootloader-message')).toHaveText(
        //     'Swipe your finger across the touchscreen while connecting the USB cable.',
        // );
    });
});
