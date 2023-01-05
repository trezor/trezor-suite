import { testMocks } from '@suite-common/test-utils';

export const findAnchorTransactionPage = [
    {
        testName: 'no anchor',
        transactions: [
            testMocks.getWalletTransaction({
                txid: 'txid1',
                symbol: 'btc',
            }),
            testMocks.getWalletTransaction({
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
            testMocks.getWalletTransaction({
                txid: 'txid1',
                symbol: 'btc',
            }),
            testMocks.getWalletTransaction({
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
            testMocks.getWalletTransaction({
                txid: 'txid1',
                symbol: 'btc',
            }),
            testMocks.getWalletTransaction({
                txid: 'txid2',
                symbol: 'btc',
            }),
        ],
        transactionsPerPage: 1,
        anchor: '@account/transaction/txid3',
        result: 1,
    },
];
