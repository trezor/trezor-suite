import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Account receive', { tag: ['@group=manual'] }, () => {
    test(
        'Get address',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can generate and confirm a receive address on the device.',
                prerequisites: ['Seeded Trezor device with transactions', 'Connected Trezor Suite'],
                steps: [
                    'Navigate to an account (ETH, XRP, ADA and SOL) and open the "Receive" tab',
                    'Confirm the fresh address and previously used addresses are listed',
                    'Click "Show full address"',
                    'Confirm the full address and QR code are displayed in Suite',
                    'Confirm the address shown on the Trezor device matches the one in Suite',
                    'Confirm the address on the device',
                    'Copy the address and confirm the copied value is complete',
                ],
                category: TestCategory.Accounts,
                priority: TestPriority.Critical,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );

    test(
        'UTXO table',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that UTXOs are listed for a BTC account and can be used for coin control.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'BTC account with multiple UTXOs',
                ],
                steps: [
                    'Navigate to the BTC account',
                    'Go to the send flow and open coin control view',
                    'Confirm all UTXOs are listed with address, amount and originating transaction',
                    'Select specific UTXOs for spending in the Send form (coin control)',
                    'Confirm the send amount is limited to the selected UTXOs',
                    'Sign the transaction and confirm only the selected UTXOs were used as inputs',
                ],
                category: TestCategory.Accounts,
                priority: TestPriority.Medium,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );
});
