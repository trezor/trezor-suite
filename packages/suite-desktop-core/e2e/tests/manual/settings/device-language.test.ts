import { TestAnnotation } from '../../../support/enums/testAnnotation';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Device language', { tag: ['@group=manual'] }, () => {
    test(
        'Change device language',
        {
            annotation: [
                {
                    type: TestAnnotation.TestCase,
                    description:
                        'Verifies that a user can change the language on a Trezor device.',
                },
                { 
                    type: TestAnnotation.Prerequisites, 
                    description: formatTestSteps([
                        'Seeded Trezor device with transactions (eg. with "all" seed)',
                        'Connected Trezor Suite',
                    ]), 
                },
                {
                    type: TestAnnotation.Steps,
                    description: formatTestSteps([
                        'Navigate to "Settings/Device"',
                        'In "Firmware/Language" section select different language than English and different than currently installed in device.',
                    ]),
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
                    type: TestAnnotation.TestCase,
                    description:
                        'Verifies that a user can change the language on a Trezor device during a firmware upgrade.',
                },
                { 
                    type: TestAnnotation.Prerequisites, 
                    description: formatTestSteps([
                        'Seeded Trezor device with transactions (eg. with "all" seed)',
                        'Connected Trezor Suite',
                    ]), 
                },
                {
                    type: TestAnnotation.Steps,
                    description: formatTestSteps([
                        'Navigate to "Settings/Device"',
                        'In "Firmware/Language" section select different language than English and different than currently installed in device.',
                        'Perform firmware upgrade',
                    ]),
                },
            ],
        },
        async () => {},
    );
});
