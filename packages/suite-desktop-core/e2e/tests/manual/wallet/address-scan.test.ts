import { TestCategory, TestPriority } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Address scan', { tag: ['@group=manual'] }, () => {
    test(
        'Scan send address via camera',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can scan a QR code to autofill the recipient address when sending BTC.',
                prerequisites: ['Seeded Trezor device', 'Connected Trezor Suite'],
                steps: [
                    'Click on "Accounts"',
                    'Select a BTC account if it’s not selected',
                    'Click "Send"',
                    'Press "Scan" button that is available only after hovering over address field',
                    'Scan QR code',
                    'Check that expected string was decoded from QR code',
                ],
                category: TestCategory.Wallets,
                priority: TestPriority.Critical,
            }),
        },
        async () => {},
    );
});
