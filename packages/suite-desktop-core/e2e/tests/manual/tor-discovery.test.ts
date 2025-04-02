import { TestAnnotationType, TestCategory, TestPriority, TestStream } from '../../support/enums/testAnnotations';
import { test } from '../../support/fixtures';
import { formatTestSteps } from '../../support/stepsFormat';

test.describe.skip('Tor discovery', { tag: ['@group=manual'] }, () => {
    test(
        'Check discovery with Tor ON',
        {
            annotation: [
                {
                    type: TestAnnotationType.TestCase,
                    description:
                        'Verifies that a user can enable Tor and check that discovery works correctly.',
                },
                {
                    type: TestAnnotationType.Prerequisites,
                    description: formatTestSteps([
                        'BTC only firmware on Trezor device',
                        'Connected Trezor Suite',
                    ]),
                },
                {
                    type: TestAnnotationType.Steps,
                    description: formatTestSteps([
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
                    ]),
                },
                {
                    type: TestAnnotationType.Category,
                    description: TestCategory.Settings,
                },
                {
                    type: TestAnnotationType.Priority,
                    description: TestPriority.Critical,
                },
                {
                    type: TestAnnotationType.Stream,
                    description: TestStream.Foundation,
                },
            ],
        },
        async () => {},
    );
});
