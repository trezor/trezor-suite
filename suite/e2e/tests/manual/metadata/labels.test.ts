import { TestCategory, TestOsMatrix, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Metadata - labels on non-Linux systems', { tag: ['@group=manual'] }, () => {
    test(
        'Labels on non-Linux systems',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Re-runs the Suite Sync labelling coverage on Windows and macOS, where the automated suite does not run.',
                prerequisites: [
                    'Seeded Trezor device with transactions',
                    'Connected Trezor Suite on Windows or macOS',
                    'Suite Sync enabled for the device',
                ],
                steps: [
                    'Create a wallet label and confirm it is displayed in the device selector',
                    'Create an account label and confirm it is displayed in the accounts sidebar',
                    'Create an address label on a receive address and confirm it is displayed in the address list',
                    'Create an output label on a transaction and confirm it is displayed in the transaction list',
                    'Update all four labels and confirm the new values are displayed',
                    'Export the account and output labels and confirm the exported file contains them',
                    'Remove all four labels and confirm the default values are displayed again',
                    'Restart Suite and confirm the labels are still in the state left by the previous steps',
                ],
                category: TestCategory.NotCategorized,
                priority: TestPriority.Medium,
                stream: TestStream.Wallet,
                osMatrix: [TestOsMatrix.Windows, TestOsMatrix.MacOSArm],
            }),
        },
        async () => {},
    );
});
