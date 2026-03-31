import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Cake Wallet iOS app', { tag: ['@group=manual'] }, () => {
    test(
        'Connect Trezor to Cake Wallet on iOS and sign transactions',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can use Cake Wallet mobile app with Trezor on iOS',
                prerequisites: [
                    'Seeded Trezor device with funded wallet',
                    'Cake Wallet mobile app',
                    'Trezor Suite with a funded wallet connected',
                ],
                steps: [
                    'open Cake Wallet mobile app',
                    'select Restore Wallet',
                    'select Restore from hardware wallet',
                    'select Trezor',
                    'select Ethereum and click Next',
                    'observe Trezor Suite opened and validate that Trezor is in Connected status',
                    'Grant permissions in Trezor Suite and confirm on the device',
                    'Export accounts',
                    'in Cake Wallet, select account to import',
                    'validate that account with correct balance is present in Cake Wallet',
                    'send transaction (ETH, BTC, TRX) in Cake Wallet',
                    'Grant permissions, review transaction and confirm on the device',
                    'Swipe to send in Cake Wallet',
                    'validate that transaction is successful in Cake Wallet and transaction details are correct in Trezor Suite',
                ],
                category: TestCategory.TrezorConnect,
                priority: TestPriority.High,
                stream: TestStream.Connect,
            }),
        },
        async () => {},
    );
});
