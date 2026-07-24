import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Top navigation - global Send and Receive', { tag: ['@group=manual'] }, () => {
    test(
        'Global Send',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that the global Send button in the top navigation opens the send flow with account selection.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite with multiple funded accounts',
                ],
                steps: [
                    'From the Dashboard, click the "Send" button in the top navigation',
                    'Confirm an account/asset picker opens',
                    'Search for an asset by name and confirm the list is filtered',
                    'Select a funded account',
                    'Confirm the Send form of the selected account opens',
                    'Repeat from an account page and confirm the picker preselects/offers the current account',
                ],
                category: TestCategory.Wallets,
                priority: TestPriority.High,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );

    test(
        'Global Receive',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that the global Receive button in the top navigation opens the receive flow with account selection.',
                prerequisites: ['Seeded Trezor device', 'Connected Trezor Suite'],
                steps: [
                    'From the Dashboard, click the "Receive" button in the top navigation',
                    'Confirm an account/asset picker opens',
                    'Select an account',
                    'Confirm the Receive view of the selected account opens',
                    'Reveal an address and confirm it on the device',
                ],
                category: TestCategory.Wallets,
                priority: TestPriority.High,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );
});
