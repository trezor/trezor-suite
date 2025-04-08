import { formatTestSteps } from '../../../support/annotations';
import {
    TestAnnotationType,
    TestCategory,
    TestPriority,
} from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';

test.describe.skip('Receive transaction', { tag: ['@group=manual'] }, () => {
    test(
        'Receive a bitcoin transaction',
        {
            annotation: [
                {
                    type: TestAnnotationType.TestCase,
                    description: 'Verifies that a user can receive a bitcoin transaction.',
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
                {
                    type: TestAnnotationType.Category,
                    description: TestCategory.BTC,
                },
                {
                    type: TestAnnotationType.Priority,
                    description: TestPriority.Critical,
                },
                {
                    type: TestAnnotationType.Stream,
                    description: 'TODO',
                },
            ],
        },
        async () => {},
    );
});
