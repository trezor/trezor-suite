// TODOS:
// - focus this test on testing what is different from T2T1: (background image, display rotation)
// - implement these differences in suite in the first place. both suite and T3B1 will happily accept
//   request to change display rotation but it has no effect. It should be at least hidden on client.
// https://github.com/trezor/trezor-suite/issues/6567
import { TestCategory, TestPriority } from '../../support/enums/testAnnotations';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe.serial('T3B1 - Device settings', { tag: ['@group=settings'] }, () => {
    test.use({
        emulatorStartConf: { model: 'T3B1', wipe: true },
    });

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
        async ({ settingsPage, page }) => {
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
        },
    );

    test('Device Wipe', async ({ page, trezorUserEnvLink }) => {
        await page.getByTestId('@settings/device/open-wipe-modal-button').click();
        await page.getByTestId('@wipe/checkbox-1').click();
        await page.getByTestId('@wipe/checkbox-2').click();
        await page.getByTestId('@wipe/wipe-button').click();
        await trezorUserEnvLink.pressYes();
        //TODO: Verification?
    });
});
