import { formatTestSteps } from '../../../support/annotations';
import {
    TestAnnotationType,
    TestCategory,
    TestPriority,
    TestStream,
} from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';

test.describe.skip('Device language', { tag: ['@group=manual'] }, () => {
    test(
        'Change device language',
        {
            annotation: [
                {
                    type: TestAnnotationType.TestCase,
                    description: 'Verifies that a user can change the language on a Trezor device.',
                },
                {
                    type: TestAnnotationType.Prerequisites,
                    description: formatTestSteps([
                        'Seeded Trezor device with transactions (eg. with "all" seed)',
                        'Connected Trezor Suite',
                    ]),
                },
                {
                    type: TestAnnotationType.Steps,
                    description: formatTestSteps([
                        'Navigate to "Settings/Device"',
                        'In "Firmware/Language" section select different language than English and different than currently installed in device.',
                    ]),
                },
                {
                    type: TestAnnotationType.Category,
                    description: TestCategory.Settings,
                },
                {
                    type: TestAnnotationType.Priority,
                    description: TestPriority.High,
                },
                {
                    type: TestAnnotationType.Stream,
                    description: 'TODO',
                },
            ],
        },
        async () => {},
    );

    test(
        'Device language firmware upgrade',
        {
            annotation: [
                {
                    type: TestAnnotationType.TestCase,
                    description:
                        'Verifies that a user can change the language on a Trezor device during a firmware upgrade.',
                },
                {
                    type: TestAnnotationType.Prerequisites,
                    description: formatTestSteps([
                        'Seeded Trezor device with transactions (eg. with "all" seed)',
                        'Connected Trezor Suite',
                    ]),
                },
                {
                    type: TestAnnotationType.Steps,
                    description: formatTestSteps([
                        'Navigate to "Settings/Device"',
                        'In "Firmware/Language" section select different language than English and different than currently installed in device.',
                        'Perform firmware upgrade',
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
