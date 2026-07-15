import { TestCategory, TestPriority } from '@trezor/e2e-utils';

import { test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

// TODO: expand to T3W1 https://github.com/trezor/trezor-suite/issues/22765
test.describe('Device authenticity check', { tag: ['@T3B1', '@T3T1'] }, () => {
    test.beforeEach(async ({ onboardingPage, device }) => {
        await onboardingPage.disableFirmwareHashCheck();
        if (device.hasCanaryFirmware) {
            await onboardingPage.disableFirmwareRevisionCheck();
        }
        await onboardingPage.enableDebugMode();
        await onboardingPage.disableDisconnectPrompt();
        await onboardingPage.optionallyDismissFwHashCheckError();
    });

    test(
        'Suite completes device authenticity check',
        {
            annotation: createTestAnnotation({
                testCase: 'Verify Suite completes device authenticity check.',
                category: TestCategory.Onboarding,
                priority: TestPriority.Critical,
            }),
        },
        async ({ analyticsSection, onboardingPage }) => {
            await analyticsSection.continueButton.click();
            await onboardingPage.completeOnboardingButton.click();
            await onboardingPage.passThroughAuthenticityCheck();
            await onboardingPage.page.discoveryShouldFinish();
        },
    );
});
