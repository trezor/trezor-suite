import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

// WalletConnect - Morpho

test.describe.skip('WalletConnect with Morpho', { tag: ['@group=manual'] }, () => {
    test(
        'Connect Trezor to Morpho with WalletConnect and sign transactions',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can use WalletConnect with Morpho',
                prerequisites: [
                    'Seeded Trezor device',
                    'Trezor Suite with a funded wallet connected',
                    'Ethereum and EVM accounts activated in Trezor Suite',
                ],
                steps: [
                    'navigate to the "https://app.morpho.org/vaults"',
                    'in top right corner click "Connect Wallet"',
                    'Select "Trezor Suite" from the list and copy WalletConnect link',
                    'open Trezor Suite, go to Settings, Connected apps and click +Add with WalletConnect',
                    'paste WalletConnect link from Morpho to Trezor Suite and click "Confirm"',
                    'validate that correct wallet (address) is connected in Morpho',
                    'perform transaction in Morpho (eg. deposite, withdraw USDC from vault)',
                    'confirm transaction details in Trezor Suite and confirm on the device',
                    'validate that transaction is successful in Morpho and transaction details are correct in Trezor Suite',
                ],
                category: TestCategory.WalletConnect,
                priority: TestPriority.Critical,
                stream: TestStream.Connect,
            }),
        },
        async () => {},
    );
});
