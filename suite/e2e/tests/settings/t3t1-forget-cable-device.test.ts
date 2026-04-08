import { expect, test } from '../../support/fixtures';

test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });

test.describe('Forget TS5 connected via cable', { tag: ['@T3T1', '@desktopOnly'] }, () => {
    test('User can forget a cable-connected TS5 after unplugging and no wallet is remembered', async ({
        onboardingPage,
        settingsPage,
        page,
        device,
    }) => {
        await onboardingPage.completeOnboarding();

        await test.step('Navigate to device settings', async () => {
            await settingsPage.navigateTo('device');
        });

        await test.step('Click Forget device button', async () => {
            await page.getByTestId('@settings/device/forget-button').scrollIntoViewIfNeeded();
            await page.getByTestId('@settings/device/forget-button').click();
        });

        await test.step('Confirm forget in the confirmation modal', async () => {
            // ConnectedCableForgetFlow step 1: ConfirmationModal
            await page
                .getByTestId('@settings/device/forget-confirmation-modal')
                .waitFor({ state: 'visible' });
            await page.getByTestId('@settings/device/forget-confirm').click();
        });

        await test.step('Unplug device to complete forget', async () => {
            // ConnectedCableForgetFlow step 2: UnplugDeviceModal
            // Power off the emulator to simulate unplugging the cable
            await page
                .getByTestId('@settings/device/forget-unplug-modal')
                .waitFor({ state: 'visible' });
            await device.powerOff();
        });

        await test.step('Verify landing on starting screen', async () => {
            await expect(page.getByTestId('@welcome-layout/body')).toBeVisible({
                timeout: 30_000,
            });
        });

        await test.step('Reload and verify no wallet is remembered', async () => {
            await page.reload();
            await expect(page.getByTestId('@welcome-layout/body')).toBeVisible({
                timeout: 30_000,
            });
        });
    });
});
