import {
    TestCategory,
    TestOsMatrix,
    TestPriority,
    TestStream,
} from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Firmware switch', { tag: ['@group=manual'] }, () => {
    test(
        'Switch to Bitcoin-only firmware',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can switch to Bitcoin-only firmware on a Trezor device.',
                prerequisites: ['Trezor device with Universal firmware', 'Connected Trezor Suite'],
                steps: [
                    'Navigate to "Settings/Device"',
                    'In firmware section "Switch to Bitcoin" button is located',
                    'Press it and proceed with "Firmware installation"',
                    'After installation and restart of device "Your firmware type is" "Bitcoin-only" is displayed',
                ],
                category: TestCategory.Firmware,
                priority: TestPriority.Medium,
                stream: TestStream.Firmware,
                osMatrix: [
                    TestOsMatrix.Linux,
                    TestOsMatrix.Windows,
                    TestOsMatrix.MacOSArm,
                    TestOsMatrix.MacOSIntel,
                ],
            }),
        },
        async () => {},
    );
});
