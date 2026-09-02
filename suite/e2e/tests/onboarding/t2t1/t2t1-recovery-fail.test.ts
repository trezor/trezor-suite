import { TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe('Onboarding - recover wallet T2T1', { tag: ['@T2T1'] }, () => {
    test.use({
        setupEmulator: false,
    });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.disableNecessaryFirmwareChecks();
    });

    test(
        'Device disconnected during recovery offers retry',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that if the device is disconnected during the recovery process, the user is given the option to retry the recovery.',
                stream: TestStream.Growth,
            }),
        },
        async ({ page, device, onboardingPage, analyticsSection, devicePrompt }) => {
            await test.step('Start wallet recovery process and confirm on device', async () => {
                await analyticsSection.passThroughAnalytics();
                await onboardingPage.firmware.continueThroughFirmware();
                await onboardingPage.recoverWalletButton.click();
                await onboardingPage.startRecoveryButton.click();
                await devicePrompt.confirmOnDevicePromptIsShown();
            });

            await test.step('Disconnect device', async () => {
                await page.waitForTimeout(1000);
                await device.powerOff();
                await page.waitForTimeout(500);
                await devicePrompt.connectDevicePromptIsShown();
                await device.powerOn();
            });

            await test.step('Check that you can retry', async () => {
                await onboardingPage.retryRecoveryButton.click();
                await devicePrompt.confirmOnDevicePromptIsShown();
            });
        },
    );
});
