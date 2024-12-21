// TODOS:
// - focus this test on testing what is different from T2T1: (background image, display rotation)
// - implement these differences in suite in the first place. both suite and T2B1 will happily accept
//   request to change display rotation but it has no effect. It should be at least hidden on client.
// https://github.com/trezor/trezor-suite/issues/6567
import { test, expect } from '../../support/fixtures';

test.describe.serial('T2B1 - Device settings', { tag: ['@group=settings'] }, () => {
    test.use({
        emulatorStartConf: { version: '2-latest', model: 'T2B1', wipe: true },
    });

    test.beforeEach(async ({ onboardingPage, dashboardPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
        await settingsPage.navigateTo();
        await settingsPage.deviceTabButton.click();
    });

    test('change all possible device settings', async ({ settingsPage, page }) => {
        await test.step('Verify firmware modal', async () => {
            await page.getByTestId('@settings/device/update-button').click();
            await page.getByTestId('@modal/close-button').click();
        });

        await test.step("Change and verify device's name", async () => {
            const newDeviceName = 'TREVOR!';
            await settingsPage.changeDeviceName(newDeviceName);
            await expect(page.getByTestId('@menu/device/label')).toHaveText(newDeviceName);
        });

        await settingsPage.changeDeviceBackground('circleweb');
    });

    test('Device Wipe', async ({ page, trezorUserEnvLink }) => {
        await page.getByTestId('@settings/device/open-wipe-modal-button').click();
        await page.getByTestId('@wipe/checkbox-1').click();
        await page.getByTestId('@wipe/checkbox-2').click();
        await page.getByTestId('@wipe/wipe-button').click();
        await trezorUserEnvLink.pressYes();
        //TODO: Verification?
    });

    test('Backup in settings', async ({ page }) => {
        await expect(page.getByTestId('@settings/device/check-seed-button')).toBeEnabled();
        await page.getByTestId('@settings/device/failed-backup-row').waitFor({ state: 'detached' });
        await page.getByTestId('@settings/device/check-seed-button').click();
        await expect(page.getByTestId('@modal')).toBeVisible();
        //TODO: Verification? Should we actually do the backup?
    });
});
