// TODOS:
// - focus this test on testing what is different from T2T1: (background image, display rotation)
// - implement these differences in suite in the first place. both suite and T3B1 will happily accept
//   request to change display rotation but it has no effect. It should be at least hidden on client.
// https://github.com/trezor/trezor-suite/issues/6567
import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('T3B1 - Device settings', { tag: ['@T3B1'] }, () => {
    test.describe.configure({ mode: 'serial' });

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
                stream: TestStream.Firmware,
            }),
        },
        async ({ settingsPage, page }) => {
            await test.step('Verify firmware modal', async () => {
                await page.getByTestId('@settings/device/update-button').click();
                await page.modalCloseButton.click();
            });

            await test.step("Change and verify device's name", async () => {
                const newDeviceName = 'TREVOR!';
                await settingsPage.changeDeviceName(newDeviceName);
                await expect(page.getByTestId('@menu/device/label')).toHaveText(newDeviceName);
            });

            await settingsPage.changeDeviceBackground('circleweb');
        },
    );

    test(
        'Device Wipe',
        { annotation: createTestAnnotation({ stream: TestStream.Firmware }) },
        async ({ page, device }) => {
            await page.getByTestId('@settings/device/open-wipe-modal-button').click();
            await page.getByTestId('@wipe/wipe-button').click();
            await page.getByTestId('@wipe/wipe-button').click();
            await device.pressYes();
            //TODO: Verification?
        },
    );
});
