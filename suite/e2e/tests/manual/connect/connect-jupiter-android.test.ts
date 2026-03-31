import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Jupiter Android app', { tag: ['@group=manual'] }, () => {
    test(
        'Connect Trezor to Jupiter Android app and sign transactions',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can use Jupiter Android app with Trezor',
                prerequisites: [
                    'Seeded Trezor device with funded wallet',
                    'Jupiter Android app with created software wallet',
                    'Trezor Suite with a funded wallet connected',
                    'Ethereum and EVM accounts activated in Trezor Suite',
                ],
                steps: [
                    'open Jupiter Android app',
                    'click Add/Connect Account',
                    'select Other options (Ledger, Trezor & Watch Account)',
                    'select Trezor',
                    'Grant permissions in Trezor Suite popup, export accounts and confirm on the device',
                    'validate that correct wallet is connected in Jupiter app',
                    'perform any transaction in Jupiter app (eg. swap or send SOL to another own address)',
                    'confirm transaction details in Trezor Suite and confirm on the device',
                    'validate that transaction is successful in Jupiter app and transaction details are correct in Trezor Suite',
                ],
                category: TestCategory.TrezorConnect,
                priority: TestPriority.High,
                stream: TestStream.Connect,
            }),
        },
        async () => {},
    );
});
