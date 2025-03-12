import { TestAnnotation } from '../../../support/enums/testAnnotation';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Receive transaction', { tag: ['@group=manual'] }, () => {
    test(
        'Receive a bitcoin transaction',
        {
            annotation: [
                {
                    type: TestAnnotation.TestCase,
                    description:
                        'Verifies that a user can receive a bitcoin transaction.',
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
                        'Click on "Accounts"',
                        'Select a BTC account if it’s not selected',
                        'Click "receive"',
                        'Click "Show full address"',
                        'Confirm on device',
                        'Copy address',
                        'Copied to clipboard notification is displayed',
                        'Close modal via clicking on x or outside of modal',
                    ]),
                },
            ],
        },
        async () => {},
    );
});
