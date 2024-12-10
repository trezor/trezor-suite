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

    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo();
        await settingsPage.deviceTabButton.click();
    });
    /*
     * Test case:
     * 1. Navigate to settings/device screen and wait for it to load
     * 2. open the firmware update modal
     * 3. verify it by clicking on the close btn
     * 4. change the trezor's name via its input
     * 5. verify the name from top left wallet overview btn
     * 6. change the device's background
     * 7. change the device's rotation
     */
    test('change all possible device settings', async ({
        trezorUserEnvLink,
        window: page,
        apiURL,
    }) => {
        const newDeviceName = 'TREVOR!';

        // verify firmware modal
        await page.getByTestId('@settings/device/update-button').click();
        await page.getByTestId('@modal/close-button').click();

        // change device's name
        await page.getByTestId('@settings/device/label-input').fill(newDeviceName);
        await page.getByTestId('@settings/device/label-submit').click();
        await expect(page.getByTestId('@prompts/confirm-on-device')).toBeVisible();
        await trezorUserEnvLink.pressYes();
        await page.getByTestId('@prompts/confirm-on-device').waitFor({ state: 'detached' });

        // verify the name change
        await expect(page.getByTestId('@menu/device/label')).toHaveText(newDeviceName);

        // change background
        // On Web the there is instability, Playwright keeps clicking the button too soon.
        const buttonImageLoad = page.waitForResponse(
            `${apiURL}static/images/homescreens/BW_64x128/circleweb.png`,
        );
        await page.getByTestId('@settings/device/homescreen-gallery').click();
        await buttonImageLoad;
        await page.getByTestId(`@modal/gallery/bw_64x128/circleweb`).click();
        await expect(page.getByTestId('@prompts/confirm-on-device')).toBeVisible();
        await trezorUserEnvLink.pressYes();
        await page.getByTestId('@prompts/confirm-on-device').waitFor({ state: 'detached' });
    });

    test('wipe device', async ({ window: page, trezorUserEnvLink }) => {
        await page.getByTestId('@settings/device/open-wipe-modal-button').click();
        await page.getByTestId('@wipe/checkbox-1').click();
        await page.getByTestId('@wipe/checkbox-2').click();
        await page.getByTestId('@wipe/wipe-button').click();
        await trezorUserEnvLink.pressYes();
        //TODO: Verification?
    });

    test('backup in settings', async ({ window: page }) => {
        await expect(page.getByTestId('@settings/device/check-seed-button')).toBeEnabled();
        await page.getByTestId('@settings/device/failed-backup-row').waitFor({ state: 'detached' });
        await page.getByTestId('@settings/device/check-seed-button').click();
        await expect(page.getByTestId('@modal')).toBeVisible();
        //TODO: Verification? Should we actually do the backup?
    });
});
