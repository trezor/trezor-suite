import { testMocks } from '@suite-common/test-utils';
import { WalletAccountTransaction } from '@suite-common/wallet-types';

import stMock from '../__fixtures__/searchTransactions.json';
import * as fixtures from '../__fixtures__/transactionUtils';
import {
    MonthKey,
    advancedSearchTransactions,
    analyzeTransactions,
    enhanceTransaction,
    findChainedTransactions,
    generateTransactionMonthKey,
    getAccountTransactions,
    getRbfParams,
    getTransactionWithLowestNonce,
    groupJointTransactions,
    groupTokensTransactionsByContractAddress,
    groupTransactionsByDate,
    isPending,
    parseTransactionDateKey,
    parseTransactionMonthKey,
} from '../transactionUtils';

const { getWalletTransaction } = testMocks;

describe('transaction utils', () => {
    describe('parseTransactionDateKey', () => {
        it('parses date key correctly', () => {
            expect(parseTransactionDateKey('2019-10-05')).toEqual(new Date(2019, 9, 5));
        });
    });

    describe('parseTransactionMonthKey', () => {
        it('parses month key correctly', () => {
            expect(parseTransactionMonthKey('2023-01-01T00:00:00.000Z' as MonthKey)).toEqual(
                new Date('2023-01'),
            );
        });
    });

    describe('isPending', () => {
        Object.keys(fixtures.isPending).forEach(f => {
            it(f, () => {
                const transaction = fixtures.isPending[f];
                const { blockHeight } = transaction;
                expect(isPending(transaction)).toEqual(!blockHeight || blockHeight < 0);
            });
        });
    });

    describe('groupTransactionsByDate', () => {
        it('groups by day', () => {
            const groupedTxs = groupTransactionsByDate([
                getWalletTransaction({ blockTime: 1565792979, blockHeight: undefined }),
                getWalletTransaction({ blockTime: 1565792979, blockHeight: 5 }),
                getWalletTransaction({ blockTime: 1565792379, blockHeight: 4 }),
                getWalletTransaction({ blockHeight: 0, blockTime: 0 }),
                getWalletTransaction({ blockTime: 1570147200, blockHeight: 2 }),
                getWalletTransaction({ blockTime: 1570127200, blockHeight: 3 }),
                getWalletTransaction({ blockHeight: 0, blockTime: undefined }),
            ]);
            expect(groupedTxs).toEqual({
                'no-blocktime': [
                    getWalletTransaction({ blockHeight: 0, blockTime: 0 }),
                    getWalletTransaction({ blockHeight: 0, blockTime: undefined }),
                ],
                '2019-10-4': [getWalletTransaction({ blockTime: 1570147200, blockHeight: 2 })],
                '2019-10-3': [getWalletTransaction({ blockTime: 1570127200, blockHeight: 3 })],
                '2019-8-14': [
                    getWalletTransaction({ blockTime: 1565792979, blockHeight: undefined }),
                    getWalletTransaction({ blockTime: 1565792979, blockHeight: 5 }),
                    getWalletTransaction({ blockTime: 1565792379, blockHeight: 4 }),
                ],
            });
        });

        it('groups by month', () => {
            const groupedTxs = groupTransactionsByDate(
                [
                    getWalletTransaction({ blockTime: 1565792979, blockHeight: undefined }),
                    getWalletTransaction({ blockTime: 1565792979, blockHeight: 5 }),
                    getWalletTransaction({ blockTime: 1565792379, blockHeight: 4 }),
                    getWalletTransaction({ blockHeight: 0, blockTime: 0 }),
                    getWalletTransaction({ blockTime: 1570147200, blockHeight: 2 }),
                    getWalletTransaction({ blockTime: 1570127200, blockHeight: 3 }),
                    getWalletTransaction({ blockHeight: 0, blockTime: undefined }),
                ],
                'month',
            );

            const firstBlocktime = 1570127200;
            const secondBlocktime = 1565792979;
            const firstMonth = generateTransactionMonthKey(new Date(firstBlocktime * 1000));
            const secondMonth = generateTransactionMonthKey(new Date(secondBlocktime * 1000));
            expect(groupedTxs).toEqual({
                'no-blocktime': [
                    getWalletTransaction({ blockHeight: 0, blockTime: 0 }),
                    getWalletTransaction({ blockHeight: 0, blockTime: undefined }),
                ],
                [firstMonth]: [
                    getWalletTransaction({ blockTime: firstBlocktime, blockHeight: 3 }),
                    getWalletTransaction({ blockTime: 1570147200, blockHeight: 2 }),
                ],
                [secondMonth]: [
                    getWalletTransaction({ blockTime: secondBlocktime, blockHeight: undefined }),
                    getWalletTransaction({ blockTime: secondBlocktime, blockHeight: 5 }),
                    getWalletTransaction({ blockTime: 1565792379, blockHeight: 4 }),
                ],
            });
        });
    });

    describe('getTransactionWithLowestNonce', () => {
        it('ethereum network', () => {
            const transactionGroups = {
                '2019-10-3': [getWalletTransaction({ ethereumSpecific: { nonce: 1 } as any })],
                '2019-10-4': [
                    getWalletTransaction({
                        ethereumSpecific: { nonce: 0 },
                    } as any),
                ],
                '2019-8-14': [
                    getWalletTransaction({ ethereumSpecific: { nonce: 2 } as any }),
                    getWalletTransaction({ ethereumSpecific: { nonce: 3 } as any }),
                ],
            };

            const transactionWithLowestNonce: WalletAccountTransaction | null =
                getTransactionWithLowestNonce(transactionGroups);

            expect(transactionWithLowestNonce).toStrictEqual(
                getWalletTransaction({ ethereumSpecific: { nonce: 0 } as any }),
            );
        });

        it('non ethereum network', () => {
            const transactionGroups = {
                '2019-10-4': [getWalletTransaction()],
                '2019-10-3': [getWalletTransaction()],
                '2019-8-14': [getWalletTransaction(), getWalletTransaction()],
            };

            const transactionWithLowestNonce: WalletAccountTransaction | null =
                getTransactionWithLowestNonce(transactionGroups);

            expect(transactionWithLowestNonce).toStrictEqual(null);
        });

        it('returns sent tx with the lowest nonce across multiple dates, ignoring recv txs', () => {
            const recvTx = getWalletTransaction({
                type: 'recv',
                ethereumSpecific: { nonce: 0 } as any,
            });

            const sentTxLow = getWalletTransaction({
                type: 'sent',
                ethereumSpecific: { nonce: 1 } as any,
            });

            const sentTxHigh = getWalletTransaction({
                type: 'sent',
                ethereumSpecific: { nonce: 5 } as any,
            });

            const sentTxMid = getWalletTransaction({
                type: 'sent',
                ethereumSpecific: { nonce: 3 } as any,
            });

            const transactionGroups = {
                '2019-10-2': [recvTx], // nonce = 0 (should be ignored)
                '2019-10-3': [sentTxHigh], // nonce = 5
                '2019-10-4': [sentTxMid, sentTxLow], // nonce = 3 and 1 (should return 1)
            };

            const result = getTransactionWithLowestNonce(transactionGroups);

            expect(result).toBe(sentTxLow);
        });

        it('returns null when all transactions are of type recv', () => {
            const recvTx1 = getWalletTransaction({
                type: 'recv',
                ethereumSpecific: { nonce: 1 } as any,
            });
            const recvTx2 = getWalletTransaction({
                type: 'recv',
                ethereumSpecific: { nonce: 2 } as any,
            });

            const transactionGroups = {
                '2019-10-04': [recvTx1, recvTx2],
            };

            const result = getTransactionWithLowestNonce(transactionGroups);

            expect(result).toBeNull();
        });
    });

    describe('groupJointTransactions', () => {
        it('groups joint transactions', () => {
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
            const groupedTxs = groupJointTransactions([
                j1,
                r2,
                j3,
                j4,
                s5,
                s6,
                j7,
                f8,
                j9,
                j10,
                j11,
            ]);
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
    });

    describe('groupTokensTransactionsByContractAddress', () => {
        it('groups tokens by contract address', () => {
            const groupedTokensTxs = groupTokensTransactionsByContractAddress([
                getWalletTransaction({ symbol: 'eth' }),
                getWalletTransaction({ symbol: 'eth' }),
                getWalletTransaction({ symbol: 'eth' }),
                getWalletTransaction({
                    symbol: 'eth',
                    tokens: [
                        {
                            ...fixtures.token,
                            contract: '0x01',
                        },
                    ],
                }),
                getWalletTransaction({
                    symbol: 'eth',
                    tokens: [
                        {
                            ...fixtures.token,
                            contract: '0x02',
                        },
                    ],
                }),
                getWalletTransaction({
                    symbol: 'eth',
                    tokens: [
                        {
                            ...fixtures.token,
                            contract: '0x02',
                        },
                    ],
                }),
            ]);
            expect(groupedTokensTxs).toEqual({
                '0x01': [
                    getWalletTransaction({
                        symbol: 'eth',
                        tokens: [
                            {
                                ...fixtures.token,
                                contract: '0x01',
                            },
                        ],
                    }),
                ],
                '0x02': [
                    getWalletTransaction({
                        symbol: 'eth',
                        tokens: [
                            {
                                ...fixtures.token,
                                contract: '0x02',
                            },
                        ],
                    }),
                    getWalletTransaction({
                        symbol: 'eth',
                        tokens: [
                            {
                                ...fixtures.token,
                                contract: '0x02',
                            },
                        ],
                    }),
                ],
            });
        });
    });

    describe('analyzeTransactions', () => {
        fixtures.analyzeTransactions.forEach(f => {
            it(f.description, () => {
                expect(
                    analyzeTransactions(f.fresh as any, f.known as any, { blockHeight: 0 }),
                ).toEqual(f.result);
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
    });

    describe('enhanceTransaction', () => {
        fixtures.enhanceTransaction.forEach(f => {
            it('enhances transaction', () => {
                expect(enhanceTransaction(f.tx as any, f.account)).toEqual(f.result);
            });
        });
    });

    describe('getRbfParams', () => {
        fixtures.getRbfParams.forEach(f => {
            it(f.description, () => {
                expect(getRbfParams(f.tx as any, f.account as any)).toEqual(f.result);
            });
        });
    });

    describe('findChainedTransactions', () => {
        fixtures.findChainedTransactions.forEach(f => {
            it(f.description, () => {
                const chained = findChainedTransactions(
                    f.descriptor,
                    f.txid,
                    f.transactions as any,
                );
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
    });

    describe('advancedSearchTransactions', () => {
        const transactions = stMock.transactions as WalletAccountTransaction[];
        const metadata = stMock.labels;
        fixtures.searchTransactions.forEach(f => {
            it(f.description, () => {
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
    });

    describe('getAccountTransactions', () => {
        fixtures.getAccountTransactions.forEach(f => {
            it(f.testName, () => {
                expect(getAccountTransactions(f.account.key, f.transactions as any)).toEqual(
                    f.result,
                );
            });
        });
    });
});
