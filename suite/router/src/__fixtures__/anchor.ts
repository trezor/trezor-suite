import { testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';

const { getWalletTransaction } = testMocks;
const btcSymbol = asNetworkSymbol('btc');

export const findAnchorTransactionPage = [
    {
        testName: 'no anchor',
        transactions: [
            getWalletTransaction({
                txid: 'txid1',
                symbol: btcSymbol,
            }),
            getWalletTransaction({
                txid: 'txid2',
                symbol: btcSymbol,
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
                symbol: btcSymbol,
            }),
            getWalletTransaction({
                txid: 'txid2',
                symbol: btcSymbol,
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
                symbol: btcSymbol,
            }),
            getWalletTransaction({
                txid: 'txid2',
                symbol: btcSymbol,
            }),
        ],
        transactionsPerPage: 1,
        anchor: '@account/transaction/txid3',
        result: 1,
    },
];
