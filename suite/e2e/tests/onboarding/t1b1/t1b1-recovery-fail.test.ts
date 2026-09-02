import { TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe('Onboarding - recover wallet T1B1', { tag: ['@firmware-ready', '@T1B1'] }, () => {
    test.use({
        setupEmulator: false,
    });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.disableNecessaryFirmwareChecks();
    });

    test(
        'Device disconnected during recovery offers retry',
        { annotation: createTestAnnotation({ stream: TestStream.Growth }) },
        async ({ device, onboardingPage, analyticsSection, recoveryModal, devicePrompt }) => {
            await test.step('Start wallet recovery process', async () => {
                await analyticsSection.passThroughAnalytics();
                await onboardingPage.firmware.continueThroughFirmware();
                await onboardingPage.recoverWalletButton.click();
                await recoveryModal.selectWordCount(24);
                await recoveryModal.selectRecoveryButton('standard').click();
                await devicePrompt.confirmOnDevicePromptIsShown();
                await device.pressYes();
            });

            await test.step('Disconnect the device', async () => {
                await device.powerOff();
                await devicePrompt.connectDevicePromptIsShown();
                await device.powerOn();
            });

            await test.step('Retry recovery process', async () => {
                await onboardingPage.retryRecoveryButton.click();
                await recoveryModal.selectWordCount(24);
                await recoveryModal.selectRecoveryButton('standard').click();
                await devicePrompt.confirmOnDevicePromptIsShown();
            });
        },
    );
});
