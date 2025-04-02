import { TestAnnotationType, TestCategory, TestPriority, TestStream } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Firmware switch', { tag: ['@group=manual'] }, () => {
    test(
        'Switch to Bitcoin-only firmware',
        {
            annotation: [
                {
                    type: TestAnnotationType.TestCase,
                    description:
                        'Verifies that a user can switch to Bitcoin-only firmware on a Trezor device.',
                },
                {
                    type: TestAnnotationType.Prerequisites,
                    description: formatTestSteps([
                        'Trezor device with Universal firmware',
                        'Connected Trezor Suite',
                    ]),
                },
                {
                    type: TestAnnotationType.Steps,
                    description: formatTestSteps([
                        'Navigate to "Settings/Device"',
                        'In firmware section "Switch to Bitcoin" button is located',
                        'Press it and proceed with "Firmware installation"',
                        'After installation and restart of device "Your firmware type is" "Bitcoin-only" is displayed',
                    ]),
                },
                {
                    type: TestAnnotationType.Category,
                    description: TestCategory.Firmware,
                },
                {
                    type: TestAnnotationType.Priority,
                    description: TestPriority.Medium,
                },
                {
                    type: TestAnnotationType.Stream,
                    description: TestStream.Firmware,
                },
            ],
        },
        async () => {},
    );
});
