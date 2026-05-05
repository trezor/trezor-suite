import { TestCategory, TestPriority } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('T2T1 - Device settings', { tag: ['@T2T1'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('device');
    });

    test(
        'change all possible device settings',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can change all possible device settings.',
                category: TestCategory.Settings,
                priority: TestPriority.Medium,
            }),
        },
        async ({ page, device, settingsPage, devicePrompt }) => {
            await test.step('Verify firmware modal', async () => {
                await page.getByTestId('@settings/device/update-button').click();
                await devicePrompt.closeModal();
            });

            await test.step("Change and verify device's name", async () => {
                const newDeviceName = 'TREVOR!';
                await settingsPage.changeDeviceName(newDeviceName);
                await expect(page.getByTestId('@menu/device/label')).toHaveText(newDeviceName);
            });

            await test.step('Change display rotation', async () => {
                await page.getByTestId('@settings/device/rotation-button/East').click();
                await devicePrompt.confirmOnDevicePromptIsShown();
                await device.pressYes();
                await devicePrompt.confirmOnDevicePromptIsHidden();
            });
        },
    );

    test('Device Wipe', async ({ page, device }) => {
        await page.getByTestId('@settings/device/open-wipe-modal-button').click();
        await page.getByTestId('@wipe/wipe-button').click();
        await page.getByTestId('@wipe/wipe-button').click();
        await device.pressYes();
        //TODO: Any verification?
    });

    test(
        'Can change homescreen background in firmware >= 2.5.4',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can change homescreen background in firmware >= 2.5.4',
                category: TestCategory.Settings,
                priority: TestPriority.Low,
            }),
        },
        async ({ settingsPage }) => {
            await settingsPage.changeDeviceBackground('original_t2t1');
        },
    );

    // TODO: upload custom image
    // TODO: set auto-lock (needs pin)
});
