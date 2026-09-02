import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Send form TRX',
        {
            testCase: 'Send form TRX',
            prerequisites: ['connected device', 'seed with TRX funds on it'],
            steps: [
                'Navigate to TRX assets and select an account with funds',
                'Click Send to open the send form',
                'Enter a valid address and an amount; verify crypto/fiat values and switching between fields',
                'Send to a fresh (not yet activated) address and verify the account activation info is shown',
                'Continue to Review and sign; approve steps and verify prompt to continue on device',
                'Approve address, amount and total including fee on the device',
                'Click Send transaction and verify the transaction detail shows Pending',
            ],
            category: TestCategory.Device,
            priority: TestPriority.High,
            stream: TestStream.Wallet,
        },
        async () => {},
    );
});
