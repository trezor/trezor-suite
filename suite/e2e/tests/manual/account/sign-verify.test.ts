import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Sign and verify', { tag: ['@group=manual'] }, () => {
    test(
        'Sign and verify a message',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies message signing and verification, including address picker, hex mode, Electrum format and Cardano COSE key.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite with BTC, ETH and ADA accounts',
                ],
                steps: [
                    'Navigate to a BTC account and open "Sign & Verify"',
                    'Use the address picker to select a signing address and confirm it matches the account addresses',
                    'Type a message, sign it and confirm the message on the device',
                    'Confirm the signature is produced and can be copied',
                    'Switch to the "Verify" tab, paste the address, message and signature and confirm verification succeeds',
                    'Alter the message and confirm verification fails',
                    'Navigate to a Cardano account "Sign & Verify"',
                    'Sign a message and confirm the COSE public key is displayed alongside the signature',
                ],
                category: TestCategory.Accounts,
                priority: TestPriority.Low,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );
});
