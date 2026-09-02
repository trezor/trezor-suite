import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Transaction list and detail',
        {
            testCase:
                'The transaction list and transaction detail sheets show complete information',
            prerequisites: ['connected device', 'seed with transaction history on it'],
            steps: [
                'Navigate to an account with transaction history',
                'Verify transaction items display type (sent/received/self/wrap/unwrap/approve...), date and crypto/fiat amounts',
                'Send a small transaction and verify it is displayed as pending until confirmed',
                'Scroll through the history and verify older transactions keep loading',
                'Open a transaction detail and verify the overview (status, date, amount) is correct',
                'Open the inputs & outputs sheet and verify all addresses and amounts are listed',
                'Open the parameters sheet and verify txid, fee and other parameters are correct',
                'Open the compare values and verify crypto and historical fiat values are displayed',
                'For an EVM transaction with data, verify the transaction data is displayed',
                'Verify the block explorer link opens the transaction in the explorer',
            ],
            category: TestCategory.Accounts,
            priority: TestPriority.Critical,
            stream: TestStream.Wallet,
        },
        async () => {},
    );
});
