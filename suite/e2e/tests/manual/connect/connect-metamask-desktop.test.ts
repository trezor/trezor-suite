import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('MetaMask Chrome extension', { tag: ['@group=manual'] }, () => {
    test(
        'Connect Trezor to MetaMask and sign transactions',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can use MetaMask with Trezor',
                prerequisites: [
                    'Seeded Trezor device',
                    'Trezor Suite with a funded wallet connected',
                    'Ethereum and EVM accounts activated in Trezor Suite',
                ],
                steps: [
                    'open MetaMask Chrome extension',
                    'Add wallet, Add a hardware wallet, select Trezor and click Continue',
                    'Grant permissions in Trezor Suite popup, export accounts and confirm on the device',
                    'validate that correct wallet is connected in MetaMask',
                    'perform any transaction in MetaMask (eg. send transaction to another own address)',
                    'confirm transaction details in Trezor Suite and confirm on the device',
                    'validate that transaction is successful in MetaMask and transaction details are correct in Trezor Suite',
                ],
                category: TestCategory.TrezorConnect,
                priority: TestPriority.Critical,
                stream: TestStream.Connect,
            }),
        },
        async () => {},
    );
});
