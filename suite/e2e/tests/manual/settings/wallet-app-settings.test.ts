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
                    'Send the transaction and confirm the actual routing changes: cross-check in blinklabs whether the transaction can be found',
                    'Disable the setting in Settings',
                    'Send another transaction with the setting disabled and confirm in blinklabs that the transaction cannot be found',
                ],
                category: TestCategory.Settings,
                priority: TestPriority.High,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );
});
