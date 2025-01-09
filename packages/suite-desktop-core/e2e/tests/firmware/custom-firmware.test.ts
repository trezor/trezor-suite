import path from 'node:path';

import { test, expect } from '../../support/fixtures';

const firmwarePath = path.join(__dirname, '../../fixtures/trezor-2.5.1.bin');

test.describe('Custom firmware', { tag: ['@group=device-management'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('device');
    });

    test('Custom firmware installation', async ({ page }) => {
        await test.step('Start `Install firmware` flow', async () => {
            await page.getByTestId('@settings/device/custom-firmware-modal-button').click();
            await expect(page.getByTestId('@firmware-modal/install-button')).toBeDisabled();
        });

        await test.step('Select the custom firmware', async () => {
            const fileChooserPromise = page.waitForEvent('filechooser');
            await page.getByTestId('@firmware-modal/input-area').click();
            const fileChooser = await fileChooserPromise;
            await fileChooser.setFiles(firmwarePath);
        });

        await test.step('Complete the FW installation on the device', async () => {
            await page.getByTestId('@firmware-modal/install-button').click();
            await page.getByTestId('@firmware/confirm-seed-checkbox').click();
            await page.getByTestId('@firmware/confirm-seed-button').click();
            await expect(page.getByTestId('@firmware/reconnect-device')).toBeVisible();
        });
    });
});
