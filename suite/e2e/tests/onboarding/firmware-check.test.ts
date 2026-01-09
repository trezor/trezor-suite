import { TestCategory, TestPriority } from '@trezor/e2e-utils';

import { test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe(
    'Firmware - check readiness',
    { tag: ['@firmware-ready', '@T1B1', '@T2T1', '@T3B1', '@T3T1', '@smoke'] },
    () => {
        test.use({
            setupEmulator: false,
        });

        test(
            'Suite detects that firmware is ready',
            {
                annotation: createTestAnnotation({
                    testCase: 'Verify Suite detects that firmware is ready.',
                    category: TestCategory.Onboarding,
                    priority: TestPriority.Critical,
                }),
            },
            async ({ analyticsSection, onboardingPage }) => {
                await onboardingPage.disableNecessaryFirmwareChecks();
                await analyticsSection.passThroughAnalytics();
                await onboardingPage.firmware.expectFirmwareToBeReady();
            },
        );
    },
);
