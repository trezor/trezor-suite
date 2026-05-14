import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

// WalletConnect - SafeWallet

test.describe.skip('WalletConnect with SafeWallet', { tag: ['@group=manual'] }, () => {
    test(
        'Connect Trezor to SafeWallet and sign transactions',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can use Trezor Connect with SafeWallet',
                prerequisites: [
                    'Seeded Trezor device',
                    'Trezor Suite with a funded wallet connected',
                    'Ethereum and EVM accounts activated in Trezor Suite',
                ],
                steps: [
                    'open https://app.safe.global/',
                    'click Connect wallet',
                    'Select WalletConnect from the list and copy the WalletConnect link',
                    'open Trezor Suite, go to Settings, Connected apps and click +Add with WalletConnect',
                    'paste WalletConnect link from SafeWallet to Trezor Suite and click "Confirm"',
                    'validate that correct wallet is connected in SafeWallet',
                    'send transaction in SafeWallet',
                    'confirm transaction details in Trezor Suite and confirm on the device',
                    'validate that transaction is successful in SafeWallet and transaction details are correct in Trezor Suite',
                ],
                category: TestCategory.WalletConnect,
                priority: TestPriority.Critical,
                stream: TestStream.Connect,
            }),
        },
        async () => {},
    );
});
