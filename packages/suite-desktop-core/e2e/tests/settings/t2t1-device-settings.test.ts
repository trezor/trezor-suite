import { test, expect } from '../../support/fixtures';

test.describe('T2T1 - Device settings', { tag: ['@group=settings'] }, () => {
    test.use({ emulatorStartConf: { wipe: true, model: 'T2T1' } });
    test.beforeEach(async ({ onboardingPage, dashboardPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
        await settingsPage.navigateTo('device');
    });

    test('change all possible device settings', async ({
        page,
        settingsPage,
        devicePrompt,
        trezorUserEnvLink,
    }) => {
        await test.step('Verify firmware modal', async () => {
            await page.getByTestId('@settings/device/update-button').click();
            await page.getByTestId('@modal/close-button').click();
        });

        await test.step("Change and verify device's name", async () => {
            const newDeviceName = 'TREVOR!';
            await settingsPage.changeDeviceName(newDeviceName);
            await expect(page.getByTestId('@menu/device/label')).toHaveText(newDeviceName);
        });

        await test.step('Change display rotation', async () => {
            await page.getByTestId('select-bar/East').click();
            await devicePrompt.confirmOnDevicePromptIsShown();
            await trezorUserEnvLink.pressYes();
            await devicePrompt.confirmOnDevicePromptIsHidden();
        });
    });

    test('Device Wipe', async ({ page, trezorUserEnvLink }) => {
        await page.getByTestId('@settings/device/open-wipe-modal-button').click();
        await page.getByTestId('@wipe/checkbox-1').click();
        await page.getByTestId('@wipe/checkbox-2').click();
        await page.getByTestId('@wipe/wipe-button').click();
        await trezorUserEnvLink.pressYes();
        //TODO: Any verification?
    });

    test('Can change homescreen background in firmware >= 2.5.4', async ({ settingsPage }) => {
        await settingsPage.changeDeviceBackground('original_t2t1');
    });

    test.describe('T2T1 - older firmware < 2.5.4', { tag: ['@group=settings'] }, () => {
        test.use({ emulatorStartConf: { wipe: true, model: 'T2T1', version: '2.5.3' } });
        test('Cannot change homescreen in firmware < 2.5.4', async ({ page }) => {
            await expect(page.getByTestId('@settings/device/homescreen-gallery')).toBeDisabled();
            await expect(page.getByTestId('@settings/device/homescreen-upload')).toBeDisabled();
        });
    });

    // TODO: upload custom image
    // TODO: set auto-lock (needs pin)
});
