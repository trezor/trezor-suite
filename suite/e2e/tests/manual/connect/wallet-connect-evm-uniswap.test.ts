import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

// WalletConnect - Uniswap

test.describe.skip('WalletConnect with Uniswap', { tag: ['@group=manual'] }, () => {
    test(
        'Connect Trezor to Uniswap with WalletConnect and sign transactions',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can use WalletConnect with Uniswap',
                prerequisites: [
                    'Seeded Trezor device',
                    'Trezor Suite with a funded wallet connected',
                    'Ethereum and EVM accounts activated in Trezor Suite',
                ],
                steps: [
                    'navigate to the "https://app.uniswap.org/"',
                    'in top right corner click "Connect"',
                    'Select "WalletConnect" from the list and copy the WalletConnect link',
                    'open Trezor Suite, go to Settings, Connected apps and click +Add with WalletConnect',
                    'paste WalletConnect link from Uniswap to Trezor Suite and click "Confirm"',
                    'validate that correct wallet is connected in Uniswap',
                    'perform any transaction in Uniswap (eg. send transaction to another own address)',
                    'confirm transaction details in Trezor Suite and confirm on the device',
                    'validate that transaction is successful in Uniswap and transaction details are correct in Trezor Suite',
                ],
                category: TestCategory.WalletConnect,
                priority: TestPriority.Critical,
                stream: TestStream.Connect,
            }),
        },
        async () => {},
    );
});
