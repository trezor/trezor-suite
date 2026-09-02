import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Cancel pending EVM transaction',
        {
            testCase:
                'A pending Ethereum transaction can be cancelled by a replacement transaction',
            prerequisites: ['connected device', 'seed with ETH funds on it'],
            steps: [
                'Navigate to an ETH account, send a transaction with a fee low enough to stay pending',
                'Open the pending transaction detail and verify the cancel option is available',
                'Start the cancel flow and verify the replacement fee is displayed and is higher than the original fee',
                'Review the cancel transaction data and sign it on the device',
                'Verify the original transaction is marked as cancelled once the replacement confirms',
                'Verify the cancelled transaction is labelled as failed/cancelled in the account history',
                'Verify the cancel option is not offered on an already confirmed transaction',
            ],
            category: TestCategory.ETH,
            priority: TestPriority.High,
            stream: TestStream.Wallet,
        },
        async () => {},
    );
});
