import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

// WalletConnect - 1inch

test.describe.skip('WalletConnect with 1inch', { tag: ['@group=manual'] }, () => {
    test(
        'Connect Trezor to 1inch with WalletConnect and sign transactions',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can use WalletConnect with 1inch',
                prerequisites: [
                    'Seeded Trezor device',
                    'Trezor Suite with a funded wallet connected',
                    'Ethereum and EVM accounts activated in Trezor Suite',
                ],
                steps: [
                    'navigate to the "https://1inch.com/swap"',
                    'in top right corner click "Connect Wallet"',
                    'Select "WalletConnect" from the list and copy the WalletConnect link',
                    'open Trezor Suite, go to Settings, Connected apps and click +Add with WalletConnect',
                    'paste WalletConnect link from 1inch to Trezor Suite and click "Confirm"',
                    'validate that correct wallet is connected in 1inch',
                    'perform any transaction in 1inch (eg. stablecoin swap)',
                    'confirm transaction details in Trezor Suite and confirm on the device',
                    'validate that transaction is successful in 1inch and transaction details are correct in Trezor Suite',
                ],
                category: TestCategory.WalletConnect,
                priority: TestPriority.High,
                stream: TestStream.Connect,
            }),
        },
        async () => {},
    );
});
