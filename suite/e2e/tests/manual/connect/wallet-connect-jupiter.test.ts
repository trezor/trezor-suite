import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

// WalletConnect - Jupiter

test.describe.skip('WalletConnect with Jupiter', { tag: ['@group=manual'] }, () => {
    test(
        'Connect Trezor to Jupiter with WalletConnect and sign transactions',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can use WalletConnect with Jupiter',
                prerequisites: [
                    'Seeded Trezor device',
                    'Trezor Suite with a funded wallet connected',
                    'Solana accounts activated in Trezor Suite',
                ],
                steps: [
                    'navigate to the "https://jup.ag/"',
                    'in top right corner click "Connect"',
                    'Select "QR (WalletConnect)" from the list and copy the WalletConnect link',
                    'open Trezor Suite, go to Settings, Connected apps and click +Add with WalletConnect',
                    'paste WalletConnect link from Jupiter to Trezor Suite and click "Confirm"',
                    'validate that correct wallet is connected in Jupiter',
                    'perform any transaction in Jupiter (eg. swap tokens)',
                    'confirm transaction details in Trezor Suite and confirm on the device',
                    'validate that transaction is successful in Jupiter and transaction details are correct in Trezor Suite',
                ],
                category: TestCategory.WalletConnect,
                priority: TestPriority.High,
                stream: TestStream.Connect,
            }),
        },
        async () => {},
    );
});
