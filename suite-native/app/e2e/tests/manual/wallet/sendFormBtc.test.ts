import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Send form BTC',
        {
            testCase: 'Send form BTC',
            prerequisites: ['connected device', 'seed with funds on it'],
            steps: [
                'Navigate to BTC assets and select a different account than the one with most funds',
                'From that account click Receive, copy the address and confirm on device',
                'Select an account with most funds and click Send to open send form',
                'Enter the copied address and a reasonable amount; verify crypto/fiat values and switching between fields',
                'Continue to fee selection and verify low/medium/high options, values, recipient and totals shown',
                'Continue to Review and sign; approve steps and verify prompt to continue on device',
                'Approve address on device (optionally switch apps while address shown) and verify recipient ticked',
                'Approve amount and total including fee, click Send transaction and verify transaction detail shows Pending',
            ],
            category: TestCategory.Device,
            priority: TestPriority.Critical,
            stream: TestStream.Wallet,
        },
        async () => {},
    );
});
