import { createTestAnnotation } from '../../../support/annotations';
import { TestCategory, TestPriority, TestStream } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';

test.describe.skip('Factory reset', { tag: ['@group=manual'] }, () => {
    test(
        'Perform full factory reset',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can perform a full factory reset on a Trezor device.',
                prerequisites: ['Trezor device', 'Connected Trezor Suite'],
                steps: [
                    'Connect Trezor in bootloader mode',
                    'Navigate to "Settings/Device"',
                    'Click on "Factory reset"',
                    'Factory reset modal opens up with 2 tick boxes',
                    'Continue on the device',
                    'Device will reset',
                    'Suite should tell you to reconnect device and no "Unacquired device" should be present',
                ],
                category: TestCategory.Settings,
                priority: TestPriority.Critical,
                stream: TestStream.Foundation,
            }),
        },
        async () => {},
    );
});
