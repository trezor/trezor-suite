import { testMocks } from '@suite-common/test-utils';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import * as fixtures from '../__fixtures__/transactionUtils';
import {
    type MonthKey,
    analyzeTransactions,
    enhanceTransaction,
    findChainedTransactions,
    generateTransactionMonthKey,
    getAccountTransactions,
    getEvmNonceInfo,
    getEvmNonceInfoFromConfirmedNonce,
    getEvmNonceStatus,
    getRbfParams,
    getTargetAmount,
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
                const { isPending: pendingFixtures } = fixtures;
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                const transaction: (typeof pendingFixtures)[string] = pendingFixtures[f];
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
            type Tx = ReturnType<typeof getWalletTransaction>;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const [j1, r2, j3, j4, s5, s6, j7, f8, j9, j10, j11]: [
                Tx,
                Tx,
                Tx,
                Tx,
                Tx,
                Tx,
                Tx,
                Tx,
                Tx,
                Tx,
                Tx,
            ] = (
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

    describe('getEvmNonceInfo', () => {
        const pendingSentTx = (nonce: number) =>
            getWalletTransaction({
                blockHeight: -1,
                type: 'sent',
                ethereumSpecific: { nonce } as any,
            });

        it('no pending txs: nextNonce = accountNonce', () => {
            expect(getEvmNonceInfo(41, [])).toEqual({
                confirmedNonce: 41,
                nextNonce: 41,
                pendingNonces: [],
            });
        });

        it('contiguous pending txs: nextNonce advances past all of them', () => {
            const pending = [pendingSentTx(41), pendingSentTx(42), pendingSentTx(43)];
            expect(getEvmNonceInfo(41, pending)).toEqual({
                confirmedNonce: 41,
                nextNonce: 44,
                pendingNonces: [41, 42, 43],
            });
        });

        it('gap in pending: nextNonce stops at the gap, confirmedNonce at the lowest pending nonce', () => {
            const pending = [pendingSentTx(41), pendingSentTx(43)];
            expect(getEvmNonceInfo(41, pending)).toEqual({
                confirmedNonce: 41,
                nextNonce: 42,
                pendingNonces: [41, 43],
            });
        });

        it('accountNonce is blockbook pending count (higher than actual confirmed): uses lowest local pending nonce as confirmedNonce', () => {
            // misc.nonce = 44 (node saw txs 41-43 in mempool), but locally only 41 and 43 are known.
            // confirmedNonce must be 41 (the lowest locally-known pending nonce), not 44.
            const pending = [pendingSentTx(41), pendingSentTx(43)];
            expect(getEvmNonceInfo(44, pending)).toEqual({
                confirmedNonce: 41,
                nextNonce: 42,
                pendingNonces: [41, 43],
            });
        });

        it('accountNonce is blockbook pending count with no gap: nextNonce equals accountNonce', () => {
            // misc.nonce = 44 (all of 41-43 are in the mempool, all locally known too)
            const pending = [pendingSentTx(41), pendingSentTx(42), pendingSentTx(43)];
            expect(getEvmNonceInfo(44, pending)).toEqual({
                confirmedNonce: 41,
                nextNonce: 44,
                pendingNonces: [41, 42, 43],
            });
        });

        it('single pending tx above accountNonce (gap at the bottom): nextNonce = accountNonce', () => {
            // Pending tx at 43 but confirmed nonce is 41 — gap at 41 and 42
            const pending = [pendingSentTx(43)];
            expect(getEvmNonceInfo(41, pending)).toEqual({
                confirmedNonce: 41,
                nextNonce: 41,
                pendingNonces: [43],
            });
        });

        it('stale pending record superseded by a locally-confirmed tx at the same nonce is ignored', () => {
            // nonce 41's replacement (e.g. a speed-up) confirmed locally, but the original pending
            // record for 41 was never swept — it must not count toward the pending nonce pool.
            const confirmedTx41 = getWalletTransaction({
                blockHeight: 100,
                type: 'sent',
                ethereumSpecific: { nonce: 41 } as any,
            });
            const transactions = [confirmedTx41, pendingSentTx(41), pendingSentTx(42)];
            expect(getEvmNonceInfo(41, transactions)).toEqual({
                confirmedNonce: 42,
                nextNonce: 43,
                pendingNonces: [42],
            });
        });
    });

    describe('getEvmNonceInfoFromConfirmedNonce', () => {
        const pendingSentTx = (nonce: number) =>
            getWalletTransaction({
                blockHeight: -1,
                type: 'sent',
                ethereumSpecific: { nonce } as any,
            });

        it('no pending txs: nextNonce = confirmedNonce', () => {
            expect(getEvmNonceInfoFromConfirmedNonce(1418, [])).toEqual({
                confirmedNonce: 1418,
                nextNonce: 1418,
                pendingNonces: [],
            });
        });

        it('contiguous pending txs: nextNonce advances past all of them', () => {
            const pending = [pendingSentTx(1418), pendingSentTx(1419)];
            expect(getEvmNonceInfoFromConfirmedNonce(1418, pending)).toEqual({
                confirmedNonce: 1418,
                nextNonce: 1420,
                pendingNonces: [1418, 1419],
            });
        });

        it('gap in pending: nextNonce stops at the gap', () => {
            const pending = [pendingSentTx(1421)];
            expect(getEvmNonceInfoFromConfirmedNonce(1418, pending)).toEqual({
                confirmedNonce: 1418,
                nextNonce: 1418,
                pendingNonces: [1421],
            });
        });

        it('a bogus/corrupted locally-confirmed nonce does not override the trusted confirmedNonce', () => {
            // Regression: getEvmNonceInfo's local-data reconciliation (a floor derived from the
            // highest locally-confirmed nonce) must NOT apply here — a single malformed/corrupted
            // local tx record with a huge nonce must not push a trusted, backend-fetched
            // confirmedNonce upward.
            const corruptedConfirmedTx = getWalletTransaction({
                blockHeight: 100,
                type: 'sent',
                ethereumSpecific: { nonce: 335753 } as any,
            });
            expect(getEvmNonceInfoFromConfirmedNonce(1418, [corruptedConfirmedTx])).toEqual({
                confirmedNonce: 1418,
                nextNonce: 1418,
                pendingNonces: [],
            });
        });

        it('stale pending record superseded by a locally-confirmed tx at the same nonce is ignored', () => {
            const confirmedTx1418 = getWalletTransaction({
                blockHeight: 100,
                type: 'sent',
                ethereumSpecific: { nonce: 1418 } as any,
            });
            const transactions = [confirmedTx1418, pendingSentTx(1418), pendingSentTx(1419)];
            expect(getEvmNonceInfoFromConfirmedNonce(1419, transactions)).toEqual({
                confirmedNonce: 1419,
                nextNonce: 1420,
                pendingNonces: [1419],
            });
        });
    });

    describe('getEvmNonceStatus', () => {
        const bounds = { confirmedNonce: 41, nextNonce: 43, pendingNonces: [41, 42] };

        it('below confirmedNonce is superseded', () => {
            expect(getEvmNonceStatus(40, bounds)).toBe('superseded');
        });

        it('matching an own pending nonce is a replacement', () => {
            expect(getEvmNonceStatus(41, bounds)).toBe('replacement');
            expect(getEvmNonceStatus(42, bounds)).toBe('replacement');
        });

        it('above nextNonce is a gap', () => {
            expect(getEvmNonceStatus(44, bounds)).toBe('gap');
        });

        it('below nextNonce but not a known pending nonce is still a replacement', () => {
            // e.g. displayNonce/pendingNonces resolved from slightly different snapshots of the
            // local tx list — the range itself is authoritative, not just the known nonce set.
            expect(getEvmNonceStatus(42, { ...bounds, pendingNonces: [] })).toBe('replacement');
        });

        it('equal to nextNonce with no colliding pending tx is ok', () => {
            expect(getEvmNonceStatus(43, bounds)).toBe('ok');
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

    describe('getTargetAmount', () => {
        type Target = WalletAccountTransaction['targets'][number];

        const buildTarget = (target: Partial<Target>): Target => ({
            addresses: ['mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q'],
            isAddress: true,
            n: 0,
            ...target,
        });

        it('returns null when there is no target and the transaction amount is zero', () => {
            const transaction = getWalletTransaction({ amount: '0' });

            expect(getTargetAmount(undefined, transaction)).toBeNull();
        });

        it('returns the formatted transaction amount when there is no target', () => {
            const transaction = getWalletTransaction({ symbol: 'btc', amount: '1000' });

            expect(getTargetAmount(undefined, transaction)).toBe('0.00001');
        });

        it('returns the formatted target amount for a non "sent to self" target', () => {
            const target = buildTarget({ amount: '2000', isAccountTarget: true });
            const transaction = getWalletTransaction({
                symbol: 'btc',
                type: 'recv',
                amount: '1000',
                targets: [target],
            });

            expect(getTargetAmount(target, transaction)).toBe('0.00002');
        });

        it('returns the formatted amount of an external target in a sent transaction', () => {
            const externalTarget = buildTarget({ amount: '500', isAccountTarget: false });
            const transaction = getWalletTransaction({
                symbol: 'btc',
                type: 'sent',
                amount: '1000',
                targets: [externalTarget],
            });

            expect(getTargetAmount(externalTarget, transaction)).toBe('0.000005');
        });

        it('returns the transaction amount for a "sent to self" target when there is no external target', () => {
            const selfTarget = buildTarget({ amount: '1000', isAccountTarget: true, n: 1 });
            const transaction = getWalletTransaction({
                symbol: 'btc',
                type: 'sent',
                amount: '1000',
                targets: [selfTarget],
            });

            expect(getTargetAmount(selfTarget, transaction)).toBe('0.00001');
        });

        it('returns null for a "sent to self" target when an external target is also present', () => {
            const selfTarget = buildTarget({ amount: '1000', isAccountTarget: true, n: 1 });
            const externalTarget = buildTarget({ amount: '500', isAccountTarget: false, n: 0 });
            const transaction = getWalletTransaction({
                symbol: 'btc',
                type: 'sent',
                amount: '1000',
                targets: [selfTarget, externalTarget],
            });

            expect(getTargetAmount(selfTarget, transaction)).toBeNull();
        });
    });
});
