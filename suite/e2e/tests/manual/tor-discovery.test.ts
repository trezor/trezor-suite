import { TestCategory, TestOsMatrix, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe.skip('Tor discovery', { tag: ['@group=manual'] }, () => {
    test(
        'Check discovery with Tor ON',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can enable Tor and check that discovery works correctly.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Trezor Suite desktop app - the Tor quick action is not available on web',
                ],
                steps: [
                    'Connect seeded device and let discovery run through',
                    'Click on the "Tor" quick action button in the bottom part of the left sidebar',
                    'You should be transferred to "Settings/Application" with the "Tor" section highlighted',
                    'Click on "Tor" switch input',
                    'A green tick appears next to Tor switch after loading icon',
                    'The Tor quick action in the sidebar shows the enabled state in its tooltip',
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
                stream: TestStream.Connect,
                osMatrix: [TestOsMatrix.Linux, TestOsMatrix.Windows, TestOsMatrix.MacOSArm],
            }),
        },
        async () => {},
    );
});
