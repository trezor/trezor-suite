import { WalletAccountTransaction } from '@suite-common/wallet-types';
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
    parseTransactionDateKey,
    parseTransactionMonthKey,
    MonthKey,
    generateTransactionMonthKey,
} from '../transactionUtils';

const { getWalletTransaction } = testMocks;

describe('transaction utils', () => {
    it('parseTransactionDateKey', () => {
        expect(parseTransactionDateKey('2019-10-05')).toEqual(new Date(2019, 9, 5));
    });

    it('parseTransactionMonthKey', () => {
        expect(parseTransactionMonthKey('2023-01-01T00:00:00.000Z' as MonthKey)).toEqual(
            new Date('2023-01'),
        );
    });

    Object.keys(fixtures.isPending).forEach(f => {
        it(`isPending: ${f}`, () => {
            const transaction = fixtures.isPending[f];
            const { blockHeight } = transaction;
            expect(isPending(transaction)).toEqual(!blockHeight || blockHeight < 0);
        });
    });

    it('groupTransactionsByDate - groupBy day', () => {
        const groupedTxs = groupTransactionsByDate([
            getWalletTransaction({ blockTime: 1565792979, blockHeight: 5 }),
            getWalletTransaction({ blockTime: 1565792379, blockHeight: 4 }),
            getWalletTransaction({ blockHeight: 0 }),
            getWalletTransaction({ blockTime: 1570147200, blockHeight: 2 }),
            getWalletTransaction({ blockTime: 1570127200, blockHeight: 3 }),
            getWalletTransaction({ blockHeight: undefined }),
        ]);
        expect(groupedTxs).toEqual({
            pending: [
                getWalletTransaction({ blockHeight: 0 }),
                getWalletTransaction({ blockHeight: undefined }),
            ],
            '2019-10-4': [getWalletTransaction({ blockTime: 1570147200, blockHeight: 2 })],
            '2019-10-3': [getWalletTransaction({ blockTime: 1570127200, blockHeight: 3 })],
            '2019-8-14': [
                getWalletTransaction({ blockTime: 1565792979, blockHeight: 5 }),
                getWalletTransaction({ blockTime: 1565792379, blockHeight: 4 }),
            ],
        });
    });

    it('groupTransactionsByDate - groupBy month', () => {
        const groupedTxs = groupTransactionsByDate(
            [
                getWalletTransaction({ blockTime: 1565792979, blockHeight: 5 }),
                getWalletTransaction({ blockTime: 1565792379, blockHeight: 4 }),
                getWalletTransaction({ blockHeight: 0 }),
                getWalletTransaction({ blockTime: 1570147200, blockHeight: 2 }),
                getWalletTransaction({ blockTime: 1570127200, blockHeight: 3 }),
                getWalletTransaction({ blockHeight: undefined }),
            ],
            'month',
        );

        const firstBlocktime = 1570127200;
        const secondBlocktime = 1565792979;
        const firstMonth = generateTransactionMonthKey(new Date(firstBlocktime * 1000));
        const secondMonth = generateTransactionMonthKey(new Date(secondBlocktime * 1000));
        expect(groupedTxs).toEqual({
            pending: [
                getWalletTransaction({ blockHeight: 0 }),
                getWalletTransaction({ blockHeight: undefined }),
            ],
            [firstMonth]: [
                getWalletTransaction({ blockTime: firstBlocktime, blockHeight: 3 }),
                getWalletTransaction({ blockTime: 1570147200, blockHeight: 2 }),
            ],
            [secondMonth]: [
                getWalletTransaction({ blockTime: secondBlocktime, blockHeight: 5 }),
                getWalletTransaction({ blockTime: 1565792379, blockHeight: 4 }),
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
        ).map((type, blockHeight) => getWalletTransaction({ type, blockHeight }));
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
            expect(analyzeTransactions(f.fresh as any, f.known as any, { blockHeight: 0 })).toEqual(
                f.result,
            );
        });
    });

    fixtures.analyzeTransactionsPrepending.forEach(f => {
        it(`analyzeTransactions: ${f.description}`, () => {
            expect(
                analyzeTransactions(f.fresh as any, f.known as any, {
                    blockHeight: f.blockHeight,
                }),
            ).toEqual(f.result);
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
            const chained = findChainedTransactions(f.descriptor, f.txid, f.transactions as any);
            if (!chained || !f.result) {
                expect(chained).toEqual(f.result);
                return;
            }

            expect(
                chained.own.map(t => ({
                    txid: t.txid,
                })),
            ).toEqual(f.result.own);
            expect(
                chained.others.map(t => ({
                    txid: t.txid,
                })),
            ).toEqual(f.result.others);
        });
    });

    const transactions = stMock.transactions as WalletAccountTransaction[];
    const metadata = stMock.labels;
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
