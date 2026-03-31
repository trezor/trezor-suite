import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Briskett Tezos wallet', { tag: ['@group=manual'] }, () => {
    test(
        'Connect Trezor to Briskett and sign transactions',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can use Briskett wallet with Trezor',
                prerequisites: [
                    'Seeded Trezor device with funded wallet',
                    'Trezor Suite with a funded wallet connected',
                ],
                steps: [
                    'open https://briskett.app/',
                    'click Connect Trezor',
                    'Grant permissions in Trezor Suite popup',
                    'Export accounts and confirm on Trezor',
                    'validate that account is successfully imported',
                    'validate that Trezor is in Connected status is top left corner',
                    'send transaction',
                    'Grant permissions, review transaction and confirm on the device',
                    'validate that transaction is successful in Briskett and transaction details are correct in Trezor Suite',
                ],
                category: TestCategory.TrezorConnect,
                priority: TestPriority.Low,
                stream: TestStream.Connect,
            }),
        },
        async () => {},
    );
});
