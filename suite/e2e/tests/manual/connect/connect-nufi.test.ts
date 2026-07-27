import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

// WalletConnect - Uniswap

test.describe.skip('Nu.fi wallet in Chrome', { tag: ['@group=manual'] }, () => {
    test(
        'Connect Trezor to nu.fi wallet and sign transactions',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can use Trezor Connect with nu.fi wallet',
                prerequisites: [
                    'Seeded Trezor device',
                    'Trezor Suite with a funded wallet connected',
                    'Ethereum and EVM accounts activated in Trezor Suite',
                ],
                steps: [
                    'open nu.fi Chrome extension',
                    'add new Trezor device or use saved wallet',
                    'select Solana account and send transaction to yourself',
                    'Grant permissions in Trezor Suite and confirm transaction on the device',
                    'validate that transaction is successful in nu.fi and transaction details are correct in Trezor Suite',
                    'select Cardano account and send transaction to yourself',
                    'Grant permissions in Trezor Suite and confirm transaction on the device',
                    'validate that transaction is successful in nu.fi and transaction details are correct in Trezor Suite',
                    'select Tron account and send transaction to yourself',
                    'Grant permissions in Trezor Suite and confirm transaction on the device',
                    'validate that transaction is successful in nu.fi and transaction details are correct in Trezor Suite',
                ],
                category: TestCategory.TrezorConnect,
                priority: TestPriority.Critical,
                stream: TestStream.Connect,
            }),
        },
        async () => {},
    );
});
