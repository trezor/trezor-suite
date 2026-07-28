import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Account details', { tag: ['@group=manual'] }, () => {
    test(
        'Account type, derivation path and xpub',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that the account details tab displays the account type, derivation path and xpub.',
                prerequisites: ['Seeded Trezor device', 'Connected Trezor Suite'],
                steps: [
                    'Navigate to a BTC account and open the "Details" tab',
                    'Confirm the account type is displayed correctly (e.g. Taproot, SegWit, Legacy)',
                    'Confirm the derivation path matches the account type and index',
                    'Click "Show xpub"',
                    'Confirm the xpub with QR code is displayed and matches the device confirmation',
                    'Copy the xpub and confirm the copied value is complete',
                ],
                category: TestCategory.Accounts,
                priority: TestPriority.Medium,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );

    test(
        'EVM account details - nonce',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that an EVM account details tab shows the account nonce.',
                prerequisites: ['Seeded Trezor device', 'Connected Trezor Suite', 'EVM account'],
                steps: [
                    'Navigate to an EVM account and open the "Details" tab',
                    'Confirm no "Show xpub" is displayed for the EVM account',
                    'Confirm the account nonce is displayed',
                    'Confirm the nonce matches the on-chain state (cross-check with an explorer)',
                ],
                category: TestCategory.Accounts,
                priority: TestPriority.Medium,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );
});
