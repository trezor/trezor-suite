import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Ronin Chrome extension', { tag: ['@group=manual'] }, () => {
    test(
        'Connect Trezor to Ronin and sign transactions',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can use Ronin Chrome extension with Trezor',
                prerequisites: ['Seeded Trezor device with funded wallet'],
                steps: [
                    'open Ronin Chrome extension',
                    'click burger menu in top right corner',
                    'click Manage Wallet',
                    'click Import with Hardware Wallet',
                    'Select Trezor, click Connect Wallet',
                    'Authenticate to open Trezor Suite',
                    'in Trezor Suite connect new TS7 or select already connected TS7',
                    'finish THP pairing',
                    'enter passphrase',
                    'Grant permissions and confirm "Export accounts"',
                    'select accounts in "Wallets ready to Import" Ronin modal',
                    'click "View wallets" and validate that accounts with correct balance are present',
                    'send transaction',
                    'go to https://metamask.github.io/test-dapp/',
                    'connect Ronin wallet',
                    'sign Typed Data V4 transaction and confirm on the device',
                ],
                category: TestCategory.TrezorConnect,
                priority: TestPriority.Low,
                stream: TestStream.Connect,
            }),
        },
        async () => {},
    );
});
