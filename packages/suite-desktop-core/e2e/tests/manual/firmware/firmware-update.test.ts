import {
    TestAnnotationType,
    TestCategory,
    TestPriority,
    TestStream,
} from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Firmware update', { tag: ['@group=manual'] }, () => {
    test(
        'Perform firmware update',
        {
            annotation: [
                {
                    type: TestAnnotationType.TestCase,
                    description: 'Verifies that a user can update the firmware on a Trezor device.',
                },
                {
                    type: TestAnnotationType.Prerequisites,
                    description: formatTestSteps([
                        'Seeded Trezor device with transactions (eg. with "all" seed"',
                        'Connected Trezor Suite',
                        'Previous version of firmware - i.e. not 2.8.9 to 2.8.9 update',
                    ]),
                },
                {
                    type: TestAnnotationType.Steps,
                    description: formatTestSteps([
                        'Navigate to "Settings"/"Device"',
                        'Click on "Update available" button',
                        'Install Firmware modal is displayed',
                        'Click on "Install firmware"',
                        'Check the box and click on "Continue"',
                        'Follow instructions on device and proceed with the firmware update',
                        'Go to "Accounts" or to "Dashboard" and see if the discovery finishes',
                    ]),
                },
                {
                    type: TestAnnotationType.Category,
                    description: TestCategory.Firmware,
                },
                {
                    type: TestAnnotationType.Priority,
                    description: TestPriority.High,
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
