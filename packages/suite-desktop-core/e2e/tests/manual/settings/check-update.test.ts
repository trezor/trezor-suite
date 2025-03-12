import { TestAnnotation } from '../../../support/enums/testAnnotation';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Check for update', { tag: ['@group=manual'] }, () => {
    test(
        'Check for updates modal',
        {
            annotation: [
                {
                    type: TestAnnotation.TestCase,
                    description:
                        'Verifies that a user can check for updates in the Trezor Suite.',
                },
                { 
                    type: TestAnnotation.Prerequisites, 
                    description: formatTestSteps([
                        'BTC only firmware on Trezor device',
                        'Connected Trezor Suite',
                    ]), 
                },
                {
                    type: TestAnnotation.Steps,
                    description: formatTestSteps([
                        'Go to "Settings/Application"',
                        'In "Suite version" click on Check for updates',
                        'Check for updates modal appears',
                    ]),
                },
            ],
        },
        async () => {},
    );
});
