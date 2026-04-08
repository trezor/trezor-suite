import { expect, test } from '../../support/fixtures';

test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });

test.describe('Forget TS5', { tag: ['@T3T1', '@desktopOnly'] }, () => {
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
            await settingsPage.deviceTab.forgetDeviceButton.scrollIntoViewIfNeeded();
            await settingsPage.deviceTab.forgetDeviceButton.click();
        });

        await test.step('Confirm forget in the confirmation modal', async () => {
            await expect(settingsPage.deviceTab.forgetConfirmationModal).toBeVisible();
            await settingsPage.deviceTab.forgetConfirmButton.click();
        });

        await test.step('Unplug device to complete forget', async () => {
            await expect(settingsPage.deviceTab.forgetUnplugModal).toBeVisible();
            await device.powerOff();
        });

        await test.step('Verify landing on starting screen', async () => {
            await expect(onboardingPage.welcomeBody).toBeVisible({
                timeout: 30_000,
            });
        });

        await test.step('Reload and verify no wallet is remembered', async () => {
            await page.reload();
            await expect(onboardingPage.welcomeBody).toBeVisible({
                timeout: 30_000,
            });
        });
    });

    test('User can forget a disconnected TS5 immediately and no wallet is remembered', async ({
        onboardingPage,
        settingsPage,
        page,
        device,
    }) => {
        await onboardingPage.completeOnboarding();

        await test.step('Power off emulator to simulate disconnected device', async () => {
            await device.powerOff();
        });

        await test.step('Navigate to device settings', async () => {
            await settingsPage.navigateTo('device');
        });

        await test.step('Click Forget device button', async () => {
            await settingsPage.deviceTab.forgetDeviceButton.scrollIntoViewIfNeeded();
            await settingsPage.deviceTab.forgetDeviceButton.click();
        });

        await test.step('Confirm forget in the confirmation modal', async () => {
            await expect(settingsPage.deviceTab.forgetConfirmationModal).toBeVisible();
            await settingsPage.deviceTab.forgetConfirmButton.click();
        });

        await test.step('Verify landing on starting screen', async () => {
            await expect(onboardingPage.welcomeBody).toBeVisible({
                timeout: 30_000,
            });
        });

        await test.step('Reload and verify no wallet is remembered', async () => {
            await page.reload();
            await expect(onboardingPage.welcomeBody).toBeVisible({
                timeout: 30_000,
            });
        });
    });
});
