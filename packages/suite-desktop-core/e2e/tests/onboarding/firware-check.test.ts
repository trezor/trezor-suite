import { Model } from '@trezor/trezor-user-env-link';

import { TestCategory, TestPriority } from '../../support/enums/testAnnotations';
import { test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

const models: Model[] = ['T1B1', 'T2T1', 'T3B1', 'T3T1'];

test.describe(
    'Firmware - check readiness',
    { tag: ['@group=device-management', '@firmware-ready'] },
    () => {
        for (const model of models) {
            test.use({
                emulatorStartConf: { model, wipe: true },
                setupEmulator: false,
            });

            test(
                `${model} Suite detects that firmware is ready`,
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
        }
    },
);
