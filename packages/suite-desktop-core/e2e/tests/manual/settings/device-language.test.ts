import { TestCategory, TestPriority, TestStream } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Device language', { tag: ['@group=manual'] }, () => {
    test(
        'Change device language',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can change the language on a Trezor device.',
                prerequisites: [
                    'Seeded Trezor device with transactions (eg. with "all" seed)',
                    'Connected Trezor Suite',
                ],
                steps: [
                    'Navigate to "Settings/Device"',
                    'In "Firmware/Language" section select different language than English and different than currently installed in device.',
                ],
                category: TestCategory.Settings,
                priority: TestPriority.High,
            }),
        },
        async () => {},
    );

    test(
        'Device language firmware upgrade',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can upgrade device firmware when device translation is installed.',
                prerequisites: [
                    'Seeded Trezor device with transactions (eg. with "all" seed)',
                    'Connected Trezor Suite',
                ],
                steps: [
                    'Navigate to "Settings/Device"',
                    'In "Firmware/Language" section select different language than English and different than currently installed in device.',
                    'Perform firmware upgrade',
                ],
                category: TestCategory.Firmware,
                priority: TestPriority.High,
                stream: TestStream.Firmware,
            }),
        },
        async () => {},
    );
});
