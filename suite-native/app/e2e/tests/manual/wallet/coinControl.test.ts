import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Coin control in BTC send',
        {
            testCase: 'UTXOs can be manually selected in the BTC send form (coin control)',
            prerequisites: ['connected device', 'seed with a BTC account with multiple UTXOs'],
            steps: [
                'Navigate to the BTC account and open the send form',
                'Open the coin control section',
                'Verify all UTXOs are listed with address and amount',
                'Select specific UTXOs for spending',
                'Verify the spendable amount is limited to the selected UTXOs',
                'Fill in the recipient and amount, review and sign the transaction on the device',
                'Verify only the selected UTXOs were used as inputs in the transaction detail',
            ],
            category: TestCategory.Accounts,
            priority: TestPriority.Medium,
            stream: TestStream.Wallet,
        },
        async () => {},
    );
});
