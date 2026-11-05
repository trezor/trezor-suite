import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Send form ETH',
        {
            testCase: 'Send form ETH',
            prerequisites: ['connected device', 'seed with funds on it'],
            steps: [
                'Navigate to ETH assets and select another account than the one with most funds',
                'Click Receive, copy address and confirm on device',
                'Select account with most funds and click Send',
                'Enter address and amount, verify fiat/ETH values and switching between fields',
                'Continue to fee selection (one fee shown) and verify recipient and totals',
                'Continue to Review and sign, approve on device and verify recipient ticked',
                'Approve and send transaction; verify transaction detail shows Pending',
                'Repeat procedure for tokens',
            ],
            category: TestCategory.Device,
            priority: TestPriority.Critical,
            stream: TestStream.Wallet,
        },
        async () => {},
    );
});
