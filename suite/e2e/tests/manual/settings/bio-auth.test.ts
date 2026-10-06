import { TestCategory, TestOsMatrix, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Biometric authentication', { tag: ['@group=manual'] }, () => {
    test(
        'Enable and disable biometric authentication',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that Touch ID / Windows Hello can be enabled and disabled, and that the biometric prompt gates access to Trezor Suite.',
                prerequisites: [
                    'Trezor Suite desktop app',
                    'Computer with Touch ID (macOS) or Windows Hello (Windows) enrolled',
                    'Seeded Trezor device',
                ],
                steps: [
                    'Navigate to "Settings/Application"',
                    'Find the "Biometric authentication" section',
                    'Enable the switch and confirm the OS biometric prompt appears',
                    'Complete the biometric check and confirm the switch stays enabled',
                    'Restart Suite and confirm the biometric prompt is shown before the app is accessible',
                    'Cancel the biometric prompt and confirm Suite does not become accessible',
                    'Restart Suite, complete the biometric check and confirm the app opens normally',
                    'Disable the switch and confirm the OS biometric prompt appears again',
                    'Restart Suite and confirm no biometric prompt is shown',
                ],
                category: TestCategory.Security,
                priority: TestPriority.High,
                stream: TestStream.Wallet,
                osMatrix: [TestOsMatrix.Windows, TestOsMatrix.MacOSArm],
            }),
        },
        async () => {},
    );

    test(
        'Biometric authentication unavailable states',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that the biometric switch is disabled with an explanatory tooltip when biometrics are unavailable or their state cannot be determined.',
                prerequisites: [
                    'Trezor Suite desktop app',
                    'Computer without enrolled biometrics, or with biometrics turned off in the OS',
                ],
                steps: [
                    'Navigate to "Settings/Application"',
                    'Find the "Biometric authentication" section',
                    'Confirm the switch is disabled and cannot be toggled',
                    'Hover over the switch and confirm a tooltip explains that biometrics are unavailable',
                    'Enrol biometrics in the OS, restart Suite and confirm the switch becomes available',
                    'On Linux, confirm the section is not offered at all',
                ],
                category: TestCategory.Security,
                priority: TestPriority.Medium,
                stream: TestStream.Wallet,
                osMatrix: [TestOsMatrix.Linux, TestOsMatrix.Windows, TestOsMatrix.MacOSArm],
            }),
        },
        async () => {},
    );
});
