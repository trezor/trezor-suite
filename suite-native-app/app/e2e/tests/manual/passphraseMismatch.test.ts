import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Passphrase mismatch',
        {
            testCase: 'Passphrase mismatch',
            prerequisites: ['connected device'],
            steps: [
                'Connect device and perform initial wallet discovery',
                'Open wallet drop-down and select Open passphrase',
                'Enter a random passphrase and confirm on device; verify This passphrase wallet is empty modal',
                'Click Yes, open and then enter a completely different passphrase',
                'Verify Passphrase mismatch warning is shown',
            ],
            category: TestCategory.Device,
            priority: TestPriority.Critical,
            stream: TestStream.Wallet,
        },
        async () => {},
    );
});
