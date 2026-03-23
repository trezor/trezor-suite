import { testMocks } from '@suite-common/test-utils';

const { getWalletTransaction } = testMocks;

export const findAnchorTransactionPage = [
    {
        testName: 'no anchor',
        transactions: [
            getWalletTransaction({
                txid: 'txid1',
                symbol: 'btc',
            }),
            getWalletTransaction({
                txid: 'txid2',
                symbol: 'btc',
            }),
        ],
        transactionsPerPage: 1,
        result: 1,
    },
    {
        testName: 'tx on page 2',
        transactions: [
            getWalletTransaction({
                txid: 'txid1',
                symbol: 'btc',
            }),
            getWalletTransaction({
                txid: 'txid2',
                symbol: 'btc',
            }),
        ],
        transactionsPerPage: 1,
        anchor: '@account/transaction/txid2',
        result: 2,
    },
    {
        testName: 'tx not found',
        transactions: [
            getWalletTransaction({
                txid: 'txid1',
                symbol: 'btc',
            }),
            getWalletTransaction({
                txid: 'txid2',
                symbol: 'btc',
            }),
        ],
        transactionsPerPage: 1,
        anchor: '@account/transaction/txid3',
        result: 1,
    },
];
