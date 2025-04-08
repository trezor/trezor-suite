import { createTestAnnotation } from '../../support/annotations';
import { TestCategory, TestPriority, TestStream } from '../../support/enums/testAnnotations';
import { expect, test } from '../../support/fixtures';

test.describe('T1B1 - Device settings', { tag: ['@group=settings'] }, () => {
    test.use({ emulatorStartConf: { model: 'T1B1', wipe: true } });
    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('device');
    });

    test(
        'enable pin',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can enable PIN on T1B1 device.',
                category: TestCategory.Settings,
                priority: TestPriority.High,
                stream: TestStream.Foundation,
            }),
        },
        async ({ page, devicePrompt, trezorUserEnvLink, trezorInput }) => {
            await page.getByTestId('@settings/device/pin-switch').click();
            await devicePrompt.confirmOnDevicePromptIsShown();
            await trezorUserEnvLink.pressYes();

            const pinEntryNumber = '1';
            await trezorInput.enterPinOnBlindMatrix(pinEntryNumber);
            await expect(page.getByTestId('@pin/input/1')).toBeVisible();
            await trezorInput.enterPinOnBlindMatrix(pinEntryNumber);
            await expect(page.getByTestId('@toast/pin-changed')).toBeVisible();
        },
    );

    test('pin mismatch', async ({ page, devicePrompt, trezorUserEnvLink }) => {
        await page.getByTestId('@settings/device/pin-switch').click();
        await devicePrompt.confirmOnDevicePromptIsShown();
        await trezorUserEnvLink.pressYes();

        await test.step('First input with one number', async () => {
            await page.getByTestId('@pin/input/1').click();
            await page.getByTestId('@pin/submit-button').click();
        });
        await test.step('Second input with two numbers', async () => {
            await page.getByTestId('@pin/input/1').click();
            await page.getByTestId('@pin/input/1').click();
            await page.getByTestId('@pin/submit-button').click();
        });
        await expect(page.getByTestId('@pin-mismatch')).toBeVisible();
        await page.getByTestId('@pin-mismatch/try-again-button').click();
        await devicePrompt.confirmOnDevicePromptIsShown();
        await trezorUserEnvLink.pressYes();
    });

    test(
        'Change homescreen',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can change homescreen background on T1B1 device.',
                category: TestCategory.Settings,
                priority: TestPriority.High,
            }),
        },
        async ({ settingsPage }) => {
            await settingsPage.changeDeviceBackground('nyancat');
        },
    );

    // TODO: pin caching immediately after it is set
    // TODO: keyboard handling
    // TODO: set auto-lock (needs pin)
});
