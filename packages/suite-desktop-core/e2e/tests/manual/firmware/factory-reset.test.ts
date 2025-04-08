import { formatTestSteps } from '../../../support/annotations';
import {
    TestAnnotationType,
    TestCategory,
    TestPriority,
    TestStream,
} from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';

test.describe.skip('Factory reset', { tag: ['@group=manual'] }, () => {
    test(
        'Perform full factory reset',
        {
            annotation: [
                {
                    type: TestAnnotationType.TestCase,
                    description:
                        'Verifies that a user can perform a full factory reset on a Trezor device.',
                },
                {
                    type: TestAnnotationType.Prerequisites,
                    description: formatTestSteps(['Trezor device', 'Connected Trezor Suite']),
                },
                {
                    type: TestAnnotationType.Steps,
                    description: formatTestSteps([
                        'Connect Trezor in bootloader mode',
                        'Navigate to "Settings/Device"',
                        'Click on "Factory reset"',
                        'Factory reset modal opens up with 2 tick boxes',
                        'Continue on the device',
                        'Device will reset',
                        'Suite should tell you to reconnect device and no "Unacquired device" should be present',
                    ]),
                },
                {
                    type: TestAnnotationType.Category,
                    description: TestCategory.Settings,
                },
                {
                    type: TestAnnotationType.Priority,
                    description: TestPriority.Critical,
                },
                {
                    type: TestAnnotationType.Stream,
                    description: TestStream.Foundation,
                },
            ],
        },
        async () => {},
    );
});
