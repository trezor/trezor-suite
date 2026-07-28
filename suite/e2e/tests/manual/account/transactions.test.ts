import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Account transactions', { tag: ['@group=manual'] }, () => {
    test(
        'Transaction list - items, pending transactions, pagination, search',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that the transaction list renders items correctly, including pending transactions, pagination, search, and dust limit.',
                prerequisites: [
                    'Seeded Trezor device with a long transaction history (e.g. "all" seed)',
                    'Connected Trezor Suite',
                ],
                steps: [
                    'Navigate to an account with a long transaction history',
                    'Confirm transaction items display type (sent/received/self), date, address, crypto and fiat amount',
                    'Confirm specialized transaction types are labeled correctly (e.g. Deposit, Withdraw, Stake, Unstake, Contract, Approve, Swap)',
                    'Navigate to the account with suspected phishing transactions',
                    'Confirm the phishing button/notice explains why the transactions are hidden',
                    'Click the button to reveal the hidden transactions',
                    'Confirm the transactions are displayed with a phishing warning',
                    'Send a small transaction from the account',
                    'Confirm the pending transaction is displayed on top with a pending indicator until mined',
                    'Scroll/paginate through the history and confirm all pages load correctly',
                    'Use the transaction search field to search by address, txid and amount',
                    'Confirm only matching transactions are displayed and clearing the search restores the list',
                    'Confirm the dust limit (dust phishing protection) is applied and transactions below the dust limit are blurred',
                    'Set a manual dust limit value and confirm the transaction list updates to respect the new threshold',
                ],
                category: TestCategory.Accounts,
                priority: TestPriority.Critical,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );

    test(
        'Transaction export - PDF, CSV, JSON',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that transaction history can be exported to PDF, CSV and JSON.',
                prerequisites: ['Seeded Trezor device with transactions', 'Connected Trezor Suite'],
                steps: [
                    'Navigate to an account with transaction history',
                    'Open the export menu in the transactions section',
                    'Export to PDF and confirm the file downloads and contains the transactions',
                    'Export to CSV and confirm the file downloads and the data matches the history',
                    'Export to JSON and confirm the file downloads and the data matches the history',
                ],
                category: TestCategory.Accounts,
                priority: TestPriority.Medium,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );

    test(
        'Transaction detail',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that the transaction detail modal shows complete information across its sections.',
                prerequisites: [
                    'Seeded Trezor device with transactions (including an EVM transaction with data and an internal transaction)',
                    'Connected Trezor Suite',
                ],
                steps: [
                    'Navigate to an account with transaction history and open a transaction detail',
                    'Confirm the "Transaction info" section (txid, confirmations, time, fee, block) is correct',
                    'Confirm the "Amount" section shows crypto and historical fiat values',
                    'Confirm the "Inputs and outputs" section lists all inputs/outputs with addresses and amounts',
                    'For an EVM transaction with data, confirm the "Data" section shows the input data',
                    'For an EVM transaction with internal transfers, confirm internal transactions are displayed',
                    'Confirm the block explorer link opens the transaction in the explorer',
                ],
                category: TestCategory.Accounts,
                priority: TestPriority.High,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );

    test(
        'Speed up and cancel a pending transaction',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a pending transaction can be sped up (fee bump) or cancelled from its detail.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'Funded account supporting fee bump (BTC or ETH)',
                ],
                steps: [
                    'Send a transaction with a low fee',
                    'Open the pending transaction detail',
                    'Click "Speed up" / "Bump fee"',
                    'Increase the fee and confirm the replacement on the Trezor device',
                    'Confirm a success notification and that the replaced transaction is updated in the list',
                    'For ETH: repeat with the "Cancel" option and confirm the cancel transaction replaces the original',
                    'Confirm the final (replacement) transaction is eventually mined',
                ],
                category: TestCategory.Accounts,
                priority: TestPriority.Critical,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );
});
