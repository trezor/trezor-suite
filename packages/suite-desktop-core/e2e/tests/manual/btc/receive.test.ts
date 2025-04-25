import { TestCategory, TestPriority } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Receive transaction', { tag: ['@group=manual'] }, () => {
    test(
        'Receive a bitcoin transaction',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can receive a bitcoin transaction.',
                prerequisites: [
                    'Seeded Trezor device with transactions (eg. with "all" seed)',
                    'Connected Trezor Suite',
                ],
                steps: [
                    'Click on "Accounts"',
                    "Select a BTC account if it's not selected",
                    'Click "receive"',
                    'Click "Show full address"',
                    'Confirm on device',
                    'Copy address',
                    'Copied to clipboard notification is displayed',
                    'Close modal via clicking on x or outside of modal',
                ],
                category: TestCategory.BTC,
                priority: TestPriority.Critical,
            }),
        },
        async () => {},
    );
});
