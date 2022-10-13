import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { AccountMetadata } from '@suite-common/metadata-types';
import { testMocks } from '@suite-common/test-utils';

import * as fixtures from '../__fixtures__/transactionUtils';
import stMock from '../__fixtures__/searchTransactions.json';
import {
    advancedSearchTransactions,
    analyzeTransactions,
    enhanceTransaction,
    findChainedTransactions,
    getAccountTransactions,
    getRbfParams,
    groupTransactionsByDate,
    groupJointTransactions,
    isPending,
    parseDateKey,
} from '../transactionUtils';

describe('transaction utils', () => {
    it('parseKey', () => {
        expect(parseDateKey('2019-10-05')).toEqual(new Date(2019, 9, 5));
    });

    Object.keys(fixtures.isPending).forEach(f => {
        it(`isPending: ${f}`, () => {
            const transaction = fixtures.isPending[f];
            const { blockHeight } = transaction;
            expect(isPending(transaction)).toEqual(!blockHeight || blockHeight < 0);
        });
    });

    it('groupTransactionsByDate', () => {
        const groupedTxs = groupTransactionsByDate([
            testMocks.getWalletTransaction({ blockTime: 1565792979, blockHeight: 5 }),
            testMocks.getWalletTransaction({ blockTime: 1565792379, blockHeight: 4 }),
            testMocks.getWalletTransaction({ blockHeight: 0 }),
            testMocks.getWalletTransaction({ blockTime: 1570147200, blockHeight: 2 }),
            testMocks.getWalletTransaction({ blockTime: 1570127200, blockHeight: 3 }),
            testMocks.getWalletTransaction({ blockHeight: undefined }),
        ]);
        expect(groupedTxs).toEqual({
            pending: [
                testMocks.getWalletTransaction({ blockHeight: 0 }),
                testMocks.getWalletTransaction({ blockHeight: undefined }),
            ],
            '2019-10-4': [
                testMocks.getWalletTransaction({ blockTime: 1570147200, blockHeight: 2 }),
            ],
            '2019-10-3': [
                testMocks.getWalletTransaction({ blockTime: 1570127200, blockHeight: 3 }),
            ],
            '2019-8-14': [
                testMocks.getWalletTransaction({ blockTime: 1565792979, blockHeight: 5 }),
                testMocks.getWalletTransaction({ blockTime: 1565792379, blockHeight: 4 }),
            ],
        });
    });

    it('groupJointTransactions', () => {
        const [j1, r2, j3, j4, s5, s6, j7, f8, j9, j10, j11] = (
            [
                'joint',
                'recv',
                'joint',
                'joint',
                'sent',
                'sent',
                'joint',
                'failed',
                'joint',
                'joint',
                'joint',
            ] as const
        ).map((type, blockHeight) => testMocks.getWalletTransaction({ type, blockHeight }));
        const groupedTxs = groupJointTransactions([j1, r2, j3, j4, s5, s6, j7, f8, j9, j10, j11]);
        expect(groupedTxs).toEqual([
            { type: 'single-tx', tx: j1 },
            { type: 'single-tx', tx: r2 },
            { type: 'joint-batch', rounds: [j3, j4] },
            { type: 'single-tx', tx: s5 },
            { type: 'single-tx', tx: s6 },
            { type: 'single-tx', tx: j7 },
            { type: 'single-tx', tx: f8 },
            { type: 'joint-batch', rounds: [j9, j10, j11] },
        ]);
    });

    fixtures.analyzeTransactions.forEach(f => {
        it(`analyzeTransactions: ${f.description}`, () => {
            expect(analyzeTransactions(f.fresh as any, f.known as any)).toEqual(f.result);
        });
    });

    fixtures.enhanceTransaction.forEach(f => {
        it('enhanceTransaction', () => {
            expect(enhanceTransaction(f.tx as any, f.account)).toEqual(f.result);
        });
    });

    fixtures.getRbfParams.forEach(f => {
        it(`getRbfParams: ${f.description}`, () => {
            expect(getRbfParams(f.tx as any, f.account as any)).toEqual(f.result);
        });
    });

    fixtures.findChainedTransactions.forEach(f => {
        it(`findChainedTransactions: ${f.description}`, () => {
            expect(findChainedTransactions(f.txid, f.transactions as any)).toEqual(f.result);
        });
    });

    const transactions = stMock.transactions as WalletAccountTransaction[];
    const metadata = stMock.metadata as AccountMetadata;
    fixtures.searchTransactions.forEach(f => {
        it(`searchTransactions - ${f.description}`, () => {
            const search = advancedSearchTransactions(transactions, metadata, f.search);

            if (f.result) {
                // expect(search.length).toBe(f.result.length);
                search.forEach((t, i) => {
                    expect(t.txid).toBe(f.result[i]);
                });
            }

            if (f.notResult) {
                search.forEach((t, i) => {
                    expect(t.txid).not.toBe(f.notResult[i]);
                });
            }
        });
    });

    fixtures.getAccountTransactions.forEach(f => {
        it(`getAccountTransactions${f.testName}`, () => {
            expect(getAccountTransactions(f.account.key, f.transactions as any)).toEqual(f.result);
        });
    });
});
