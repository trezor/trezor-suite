import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('MEV protection', { tag: ['@group=manual'] }, () => {
    test(
        'MEV protection',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that MEV protection can be toggled and is applied to Ethereum transactions.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'Funded Ethereum account',
                ],
                steps: [
                    'Navigate to "Settings" > "Application" > "Security"',
                    'Locate the "MEV protection" toggle and enable it',
                    'Navigate to a funded Ethereum account and open the "Send" form',
                    'Fill in a valid recipient and amount',
                    'Confirm the MEV protection indication is present in the send flow',
                    'Disable the setting in Settings and confirm the indication is no longer present',
                ],
                category: TestCategory.Settings,
                priority: TestPriority.High,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );
});
