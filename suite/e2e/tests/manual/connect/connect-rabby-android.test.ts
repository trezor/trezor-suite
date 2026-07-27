import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Rabby Android app', { tag: ['@group=manual'] }, () => {
    test(
        'Connect Trezor to Rabby Android app and sign transactions',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can use Rabby Android app with Trezor',
                prerequisites: ['Seeded Trezor device with funded wallet'],
                steps: [
                    'open Rabby Android app',
                    'click wallet icon in top right corner',
                    'click Hardware Wallet',
                    'click Trezor',
                    'Authenticate to open Trezor Suite',
                    'in Trezor Suite connect new TS7 or select already connected TS7',
                    'finish THP pairing',
                    'enter passphrase',
                    'confirm "Export accounts"',
                    'select accounts in "Import more wallets" Rabby modal',
                    'click "View wallets" and validate that accounts with correct balance are present',
                    'send transaction',
                ],
                category: TestCategory.TrezorConnect,
                priority: TestPriority.Critical,
                stream: TestStream.Connect,
            }),
        },
        async () => {},
    );
});
