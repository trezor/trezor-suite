import { createTestAnnotation } from '../../support/annotations';
import { TestCategory, TestPriority, TestStream } from '../../support/enums/testAnnotations';
import { test } from '../../support/fixtures';

test.describe.skip('Tor discovery', { tag: ['@group=manual'] }, () => {
    test(
        'Check discovery with Tor ON',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can enable Tor and check that discovery works correctly.',
                prerequisites: ['BTC only firmware on Trezor device', 'Connected Trezor Suite'],
                steps: [
                    'Connect seeded device and let discovery run through',
                    'Click on the "Tor" button at the top right corner to enable "Tor"',
                    'You should be transferred to "Settings/Application"',
                    'Click on "Tor" switch input',
                    'A green tick appears next to Tor switch after loading icon',
                    'Navigate to "Accounts"',
                    'Discovery should start and finish correctly',
                    'Check "Transaction history"',
                    'Transactions should still be present',
                    'Send a transaction',
                    'Observe new transaction will appear correctly',
                    'Disable "Tor"',
                    'Return to Dashboard and observe that discovery finishes correctly',
                ],
                category: TestCategory.Settings,
                priority: TestPriority.Critical,
                stream: TestStream.Foundation,
            }),
        },
        async () => {},
    );
});
