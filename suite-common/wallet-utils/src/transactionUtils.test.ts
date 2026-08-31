import { testMocks } from '@suite-common/test-utils';
import { type NetworkFeature, asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type FormState,
    type GeneralPrecomposedTransactionFinal,
    type WalletAccountTransaction,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import * as fixtures from './__fixtures__/transactionUtils';
import {
    type MonthKey,
    analyzeTransactions,
    enhanceTransaction,
    findChainedTransactions,
    generateTransactionMonthKey,
    getAccountTransactions,
    getDecreaseOutputId,
    getEvmNonceInfo,
    getEvmNonceInfoFromConfirmedNonce,
    getEvmNonceStatus,
    getEvmPrivatePendingHint,
    getPendingEvmNonceStatus,
    getRbfParams,
    getTargetAmount,
    getTransactionWithLowestNonce,
    groupJointTransactions,
    groupTokensTransactionsByContractAddress,
    groupTransactionsByDate,
    isPending,
    isSignedByAccount,
    isTransactionBumpable,
    isTransactionCancellable,
    parseTransactionDateKey,
    parseTransactionMonthKey,
} from './transactionUtils';

const ethSymbol = asNetworkSymbol('eth');
const btcSymbol = asNetworkSymbol('btc');

const { getWalletTransaction } = testMocks;

const ACCOUNT_DESCRIPTOR = '0x37567E60ab231b7D7f26B5b34FDD719098E4Ee1b';
const RBF_ACCOUNT_DESCRIPTOR = '0x1111111111111111111111111111111111111111';
const CONTRACT_ADDRESS = '0x2222222222222222222222222222222222222222';
const TOKEN_RECIPIENT = '0x3333333333333333333333333333333333333333';
const TOKEN_CONTRACT = '0x4444444444444444444444444444444444444444';
const TRANSFER_FROM_DATA =
    '0x23b872dd' +
    '0000000000000000000000001111111111111111111111111111111111111111' +
    '0000000000000000000000003333333333333333333333333333333333333333' +
    '000000000000000000000000000000000000000000000000000000001dcd6500';
const ERC4626_DEPOSIT_DATA =
    '0x6e553f65' +
    '00000000000000000000000000000000000000000000000000000000000f4240' +
    '0000000000000000000000001111111111111111111111111111111111111111';
// A stranger who signed (and paid for) a transaction that blockbook indexes against the account
// because one of its token transfers names the account as the sender.
const FOREIGN_SIGNER = '0x0F6666bC699aec39b846E898473e9CAec5a6b821';

const ethereumAccount = mockWalletAccount({
    symbol: ethSymbol,
    descriptor: asAccountDescriptor(RBF_ACCOUNT_DESCRIPTOR),
});

const getPendingTokenMovingContractTransaction = ({
    data,
    nativeValue,
    tokenAmount,
}: {
    data: string;
    nativeValue: string;
    tokenAmount: string;
}) =>
    getWalletTransaction({
        descriptor: asAccountDescriptor(RBF_ACCOUNT_DESCRIPTOR),
        symbol: ethSymbol,
        type: 'sent',
        txid: '0xpending-contract-call',
        blockHeight: -1,
        amount: nativeValue,
        rbf: true,
        ethereumSpecific: {
            status: -1,
            nonce: 45,
            gasLimit: 100_000,
            gasPrice: '1000000000',
            data,
        },
        details: {
            ...getWalletTransaction().details,
            vin: [
                {
                    n: 0,
                    addresses: [RBF_ACCOUNT_DESCRIPTOR],
                    isAddress: true,
                    isOwn: true,
                    isAccountOwned: true,
                },
            ],
            vout: [
                {
                    n: 0,
                    addresses: [CONTRACT_ADDRESS],
                    isAddress: true,
                    value: nativeValue,
                },
            ],
            totalOutput: nativeValue,
        },
        tokens: [
            {
                type: 'sent',
                standard: 'ERC20',
                amount: tokenAmount,
                from: RBF_ACCOUNT_DESCRIPTOR,
                to: TOKEN_RECIPIENT,
                contract: TOKEN_CONTRACT,
                name: 'USD Coin',
                symbol: 'USDC',
                decimals: 6,
            },
        ],
    });

type EvmTransactionParams = {
    nonce: number;
    blockHeight?: number;
    type?: WalletAccountTransaction['type'];
    txid?: string;
};

// Nonce derivation keys off authorship, so an EVM fixture has to say who signed it. `isAccountOwned`
// is set exactly as enhanceVinVout would set it at transform time.
const getEvmTransaction = (
    signer: string,
    { nonce, blockHeight = 100, type = 'sent', txid }: EvmTransactionParams,
) =>
    getWalletTransaction({
        descriptor: asAccountDescriptor(ACCOUNT_DESCRIPTOR),
        symbol: ethSymbol,
        type,
        blockHeight,
        ...(txid ? { txid } : {}),
        ethereumSpecific: { nonce } as any,
        details: {
            ...getWalletTransaction().details,
            vin: [
                {
                    n: 0,
                    isAddress: true,
                    addresses: [signer],
                    isAccountOwned: signer === ACCOUNT_DESCRIPTOR || undefined,
                },
            ],
        },
    });

const getOwnEvmTransaction = (params: EvmTransactionParams) =>
    getEvmTransaction(ACCOUNT_DESCRIPTOR, params);

const getForeignEvmTransaction = (params: EvmTransactionParams) =>
    getEvmTransaction(FOREIGN_SIGNER, params);

// isTransactionCancellable/isTransactionBumpable only check for the presence of rbfParams, not
// their shape, so any valid value serves for the positive cases.
const rbfParams: WalletAccountTransaction['rbfParams'] = {
    type: 'bitcoin',
    txid: 'txid',
    utxo: [],
    outputs: [],
    feeRate: '1',
    baseFee: 144,
};

const buildBumpFeeRbfTx = (useNativeRbf: boolean): GeneralPrecomposedTransactionFinal =>
    ({
        rbfType: 'bump-fee',
        useNativeRbf,
    }) as unknown as GeneralPrecomposedTransactionFinal;

const buildCancelRbfTx = (): GeneralPrecomposedTransactionFinal =>
    ({
        rbfType: 'cancel',
    }) as unknown as GeneralPrecomposedTransactionFinal;

const buildNonRbfTx = (): GeneralPrecomposedTransactionFinal =>
    ({}) as unknown as GeneralPrecomposedTransactionFinal;

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

    describe('isTransactionCancellable', () => {
        it('is cancellable for a pending sent tx with rbfParams on an rbf network', () => {
            const tx = getWalletTransaction({ type: 'sent', rbfParams });
            expect(isTransactionCancellable(tx, true, ['rbf', 'sign-verify'])).toBe(true);
        });

        it('is not cancellable for a received tx (never has rbfParams)', () => {
            const tx = getWalletTransaction({ type: 'recv', rbfParams: undefined });
            expect(isTransactionCancellable(tx, true, ['rbf'])).toBe(false);
        });

        it('is not cancellable for a pending tx without rbfParams (e.g. a non-replaceable swap)', () => {
            const tx = getWalletTransaction({ type: 'sent', rbfParams: undefined });
            expect(isTransactionCancellable(tx, true, ['rbf'])).toBe(false);
        });

        it('is not cancellable when the tx is not pending', () => {
            const tx = getWalletTransaction({ type: 'sent', rbfParams });
            expect(isTransactionCancellable(tx, false, ['rbf'])).toBe(false);
        });

        it('is not cancellable for a self tx', () => {
            const tx = getWalletTransaction({ type: 'self', rbfParams });
            expect(isTransactionCancellable(tx, true, ['rbf'])).toBe(false);
        });

        it('is not cancellable for a joint (coinjoin) tx', () => {
            const tx = getWalletTransaction({ type: 'joint', rbfParams });
            expect(isTransactionCancellable(tx, true, ['rbf'])).toBe(false);
        });

        it('is not cancellable on a network without the rbf feature (e.g. LTC, ETC)', () => {
            const tx = getWalletTransaction({ type: 'sent', rbfParams });
            expect(isTransactionCancellable(tx, true, ['sign-verify', 'graph'])).toBe(false);
        });

        it('is not cancellable when the network has no features', () => {
            const tx = getWalletTransaction({ type: 'sent', rbfParams });
            expect(isTransactionCancellable(tx, true, undefined)).toBe(false);
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
                '2019-10-3': [getOwnEvmTransaction({ nonce: 1 })],
                '2019-10-4': [getOwnEvmTransaction({ nonce: 0 })],
                '2019-8-14': [
                    getOwnEvmTransaction({ nonce: 2 }),
                    getOwnEvmTransaction({ nonce: 3 }),
                ],
            };

            const transactionWithLowestNonce: WalletAccountTransaction | null =
                getTransactionWithLowestNonce(transactionGroups);

            expect(transactionWithLowestNonce).toStrictEqual(getOwnEvmTransaction({ nonce: 0 }));
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

        it('returns the own tx with the lowest nonce across multiple dates, ignoring txs the account did not sign', () => {
            const recvTx = getForeignEvmTransaction({ nonce: 0, type: 'recv' });
            // A stranger's transfer *out of* the account: labelled 'sent', but its nonce is the
            // stranger's, so it must not steal the bump-fee slot from our own lowest-nonce tx.
            const foreignSentTx = getForeignEvmTransaction({ nonce: 0 });

            const sentTxLow = getOwnEvmTransaction({ nonce: 1 });
            const sentTxHigh = getOwnEvmTransaction({ nonce: 5 });
            const sentTxMid = getOwnEvmTransaction({ nonce: 3 });

            const transactionGroups = {
                '2019-10-2': [recvTx, foreignSentTx], // nonce = 0 (should be ignored)
                '2019-10-3': [sentTxHigh], // nonce = 5
                '2019-10-4': [sentTxMid, sentTxLow], // nonce = 3 and 1 (should return 1)
            };

            const result = getTransactionWithLowestNonce(transactionGroups);

            expect(result).toBe(sentTxLow);
        });

        it('returns null when the account signed none of the transactions', () => {
            const transactionGroups = {
                '2019-10-04': [
                    getForeignEvmTransaction({ nonce: 1, type: 'recv' }),
                    getForeignEvmTransaction({ nonce: 2 }),
                ],
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
                getWalletTransaction({ symbol: ethSymbol }),
                getWalletTransaction({ symbol: ethSymbol }),
                getWalletTransaction({ symbol: ethSymbol }),
                getWalletTransaction({
                    symbol: ethSymbol,
                    tokens: [
                        {
                            ...fixtures.token,
                            contract: '0x01',
                        },
                    ],
                }),
                getWalletTransaction({
                    symbol: ethSymbol,
                    tokens: [
                        {
                            ...fixtures.token,
                            contract: '0x02',
                        },
                    ],
                }),
                getWalletTransaction({
                    symbol: ethSymbol,
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
                        symbol: ethSymbol,
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
                        symbol: ethSymbol,
                        tokens: [
                            {
                                ...fixtures.token,
                                contract: '0x02',
                            },
                        ],
                    }),
                    getWalletTransaction({
                        symbol: ethSymbol,
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

        // The stored list is written by index (see transactionsReducer `addTransaction`), so a
        // partially paginated account holds empty slots. `getAccountTransactions` passes that array
        // through unfiltered.
        it('confirms a pre-pending tx even when the known list has empty slots', () => {
            const known = [
                { blockHeight: undefined, blockHash: '1', txid: '1', deadline: 5 },
                { blockHeight: 3, blockHash: '3', txid: '3' },
                undefined,
                { blockHeight: 2, blockHash: '2', txid: '2' },
            ];

            const fresh = [
                { blockHeight: 4, blockHash: '1', txid: '1' },
                { blockHeight: 3, blockHash: '3', txid: '3' },
                { blockHeight: 2, blockHash: '2', txid: '2' },
            ];

            expect(analyzeTransactions(fresh as any, known as any, { blockHeight: 4 })).toEqual({
                newTransactions: [{ blockHeight: 4, blockHash: '1', txid: '1' }],
                add: [{ blockHeight: 4, blockHash: '1', txid: '1' }],
                remove: [{ blockHeight: undefined, blockHash: '1', txid: '1', deadline: 5 }],
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

        it('preserves zero native value for a token-moving transferFrom call', () => {
            const transaction = getPendingTokenMovingContractTransaction({
                data: TRANSFER_FROM_DATA,
                nativeValue: '0',
                tokenAmount: '500000000',
            });

            expect(getRbfParams(transaction, ethereumAccount)).toEqual({
                type: 'ethereum',
                txid: transaction.txid,
                outputs: [
                    {
                        type: 'payment',
                        address: CONTRACT_ADDRESS,
                        amount: '0',
                        formattedAmount: '0',
                    },
                ],
                ethereumNonce: 45,
                transactionData: TRANSFER_FROM_DATA,
                gasPrice: '1',
                maxFeePerGas: '',
                maxPriorityFeePerGas: '',
            });
        });

        it('keeps the token amount for an ERC-4626 deposit call', () => {
            const transaction = getPendingTokenMovingContractTransaction({
                data: ERC4626_DEPOSIT_DATA,
                nativeValue: '0',
                tokenAmount: '1000000',
            });

            expect(getRbfParams(transaction, ethereumAccount)?.outputs).toEqual([
                {
                    type: 'payment',
                    address: CONTRACT_ADDRESS,
                    token: TOKEN_CONTRACT,
                    amount: '1000000',
                    formattedAmount: '1',
                },
            ]);
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

    describe('isSignedByAccount', () => {
        const withVin = (vin: WalletAccountTransaction['details']['vin']) =>
            getWalletTransaction({
                descriptor: asAccountDescriptor(ACCOUNT_DESCRIPTOR),
                details: { ...getWalletTransaction().details, vin },
            });

        it('an input flagged as owned by the account means the account signed it', () => {
            expect(
                isSignedByAccount(withVin([{ n: 0, isAddress: true, isAccountOwned: true }])),
            ).toBe(true);
        });

        it('matches the descriptor regardless of EIP-55 casing', () => {
            expect(
                isSignedByAccount(
                    withVin([
                        {
                            n: 0,
                            isAddress: true,
                            addresses: [ACCOUNT_DESCRIPTOR.toLowerCase()],
                        },
                    ]),
                ),
            ).toBe(true);
        });

        it('matches when only one of several inputs belongs to the account', () => {
            expect(
                isSignedByAccount(
                    withVin([
                        { n: 0, isAddress: true, addresses: [FOREIGN_SIGNER] },
                        { n: 1, isAddress: true, addresses: [ACCOUNT_DESCRIPTOR] },
                    ]),
                ),
            ).toBe(true);
        });

        it('a transaction signed by somebody else does not belong to the account', () => {
            const foreignVin = [{ n: 0, isAddress: true, addresses: [FOREIGN_SIGNER] }];
            expect(isSignedByAccount(withVin(foreignVin))).toBe(false);
        });

        it('no inputs means no proof of authorship', () => {
            expect(isSignedByAccount(withVin([]))).toBe(false);
        });
    });

    describe('getEvmNonceInfo', () => {
        const pendingSentTx = (nonce: number) => getOwnEvmTransaction({ nonce, blockHeight: -1 });

        it('no pending txs: nextNonce = accountNonce', () => {
            expect(getEvmNonceInfo(41, [])).toEqual({
                confirmedNonce: 41,
                nextNonce: 41,
                pendingNonces: [],
                confirmedNonces: [],
            });
        });

        it('contiguous pending txs: nextNonce advances past all of them', () => {
            const pending = [pendingSentTx(41), pendingSentTx(42), pendingSentTx(43)];
            expect(getEvmNonceInfo(41, pending)).toEqual({
                confirmedNonce: 41,
                nextNonce: 44,
                pendingNonces: [41, 42, 43],
                confirmedNonces: [],
            });
        });

        it('gap in pending: nextNonce stops at the gap, confirmedNonce at the lowest pending nonce', () => {
            const pending = [pendingSentTx(41), pendingSentTx(43)];
            expect(getEvmNonceInfo(41, pending)).toEqual({
                confirmedNonce: 41,
                nextNonce: 42,
                pendingNonces: [41, 43],
                confirmedNonces: [],
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
                confirmedNonces: [],
            });
        });

        it('accountNonce is blockbook pending count with no gap: nextNonce equals accountNonce', () => {
            // misc.nonce = 44 (all of 41-43 are in the mempool, all locally known too)
            const pending = [pendingSentTx(41), pendingSentTx(42), pendingSentTx(43)];
            expect(getEvmNonceInfo(44, pending)).toEqual({
                confirmedNonce: 41,
                nextNonce: 44,
                pendingNonces: [41, 42, 43],
                confirmedNonces: [],
            });
        });

        it('single pending tx above accountNonce (gap at the bottom): nextNonce = accountNonce', () => {
            // Pending tx at 43 but confirmed nonce is 41 — gap at 41 and 42
            const pending = [pendingSentTx(43)];
            expect(getEvmNonceInfo(41, pending)).toEqual({
                confirmedNonce: 41,
                nextNonce: 41,
                pendingNonces: [43],
                confirmedNonces: [],
            });
        });

        it('stale pending record superseded by a locally-confirmed tx at the same nonce is ignored', () => {
            // nonce 41's replacement (e.g. a speed-up) confirmed locally, but the original pending
            // record for 41 was never swept — it must not count toward the pending nonce pool.
            const confirmedTx41 = getOwnEvmTransaction({ nonce: 41 });
            const transactions = [confirmedTx41, pendingSentTx(41), pendingSentTx(42)];
            expect(getEvmNonceInfo(41, transactions)).toEqual({
                confirmedNonce: 42,
                nextNonce: 43,
                pendingNonces: [42],
                confirmedNonces: [41],
            });
        });

        it('locally-confirmed nonces raise the floor only contiguously', () => {
            // 41 and 42 are ours and confirmed, so the true nonce is at least 43. An own tx at 90 is
            // not contiguous with them (a corrupted record, or the list is missing 43-89), so the
            // floor must stop at 43 instead of jumping to the maximum.
            const transactions = [
                getOwnEvmTransaction({ nonce: 41 }),
                getOwnEvmTransaction({ nonce: 42 }),
                getOwnEvmTransaction({ nonce: 90 }),
            ];
            expect(getEvmNonceInfo(41, transactions)).toMatchObject({
                confirmedNonce: 43,
                nextNonce: 43,
            });
        });

        it("a foreign signer's nonce cannot inflate the fallback nonce", () => {
            // The 2026-08-02 incident on the fallback path: a fake-token airdrop signed by a
            // stranger at their nonce 288130 emits a transfer *out of* the account, so it is
            // labelled 'sent' and indexed against the account. Keying off the label offered
            // nonce 288131, which can never be mined.
            const transactions = [
                getForeignEvmTransaction({ nonce: 288130 }),
                getForeignEvmTransaction({ nonce: 45 }),
            ];
            expect(getEvmNonceInfo(45, transactions)).toEqual({
                confirmedNonce: 45,
                nextNonce: 45,
                pendingNonces: [],
                confirmedNonces: [],
            });
        });
    });

    describe('getEvmPrivatePendingHint', () => {
        const pendingTx = (nonce: number, { txid = `0x${nonce}` }: { txid?: string } = {}) =>
            getOwnEvmTransaction({ nonce, blockHeight: -1, txid });

        it('returns undefined when there is no pending own-nonce tx', () => {
            expect(getEvmPrivatePendingHint([])).toBeUndefined();
            // an incoming pending tx does not consume our nonce and must not be declared
            const incoming = getForeignEvmTransaction({ nonce: 41, blockHeight: -1, type: 'recv' });
            expect(getEvmPrivatePendingHint([incoming])).toBeUndefined();
        });

        it('declares a local pending nonce and its txid', () => {
            expect(getEvmPrivatePendingHint([pendingTx(41)])).toEqual({
                nonces: [41],
                txids: ['0x41'],
            });
        });

        it('declares every pending nonce the account signed, whatever the tx is labelled', () => {
            const transactions = [
                getOwnEvmTransaction({
                    nonce: 43,
                    blockHeight: -1,
                    txid: '0x43',
                    type: 'contract',
                }),
                pendingTx(41),
                getOwnEvmTransaction({ nonce: 42, blockHeight: -1, txid: '0x42', type: 'self' }),
                pendingTx(44),
            ];
            expect(getEvmPrivatePendingHint(transactions)).toEqual({
                nonces: [41, 42, 43, 44],
                txids: ['0x41', '0x42', '0x43', '0x44'],
            });
        });

        it('never declares a pending tx the account did not sign', () => {
            // A stranger's mempool transferFrom(account, …) is labelled 'sent' and indexed against
            // the account. Declaring its nonce would have blockbook report a pending nonce the
            // account never used, and its txid is not ours to declare either.
            const transactions = [
                getForeignEvmTransaction({ nonce: 40, blockHeight: -1, txid: '0x40' }),
                getForeignEvmTransaction({ nonce: 45, blockHeight: -1, txid: '0x45' }),
            ];
            expect(getEvmPrivatePendingHint(transactions)).toBeUndefined();
        });

        it('excludes the nonce and txid of a tx that is already locally confirmed', () => {
            const confirmedTx41 = getOwnEvmTransaction({ nonce: 41, txid: '0x41-confirmed' });
            const transactions = [confirmedTx41, pendingTx(41), pendingTx(42)];
            expect(getEvmPrivatePendingHint(transactions)).toEqual({
                nonces: [42],
                txids: ['0x42'],
            });
        });

        it('dedupes the shared nonce of an RBF replacement but declares both txids', () => {
            // speed-up/cancel keeps the same nonce, only the txid changes — one nonce, both hashes
            const transactions = [
                pendingTx(41, { txid: '0xnew' }),
                pendingTx(41, { txid: '0xold' }),
            ];
            expect(getEvmPrivatePendingHint(transactions)).toEqual({
                nonces: [41],
                txids: ['0xnew', '0xold'],
            });
        });
    });

    describe('getEvmNonceInfoFromConfirmedNonce', () => {
        const pendingSentTx = (nonce: number) => getOwnEvmTransaction({ nonce, blockHeight: -1 });

        it('no pending txs: nextNonce = confirmedNonce', () => {
            expect(getEvmNonceInfoFromConfirmedNonce(1418, [])).toEqual({
                confirmedNonce: 1418,
                nextNonce: 1418,
                pendingNonces: [],
                confirmedNonces: [],
            });
        });

        it('contiguous pending txs: nextNonce advances past all of them', () => {
            const pending = [pendingSentTx(1418), pendingSentTx(1419)];
            expect(getEvmNonceInfoFromConfirmedNonce(1418, pending)).toEqual({
                confirmedNonce: 1418,
                nextNonce: 1420,
                pendingNonces: [1418, 1419],
                confirmedNonces: [],
            });
        });

        it('gap in pending: nextNonce stops at the gap', () => {
            const pending = [pendingSentTx(1421)];
            expect(getEvmNonceInfoFromConfirmedNonce(1418, pending)).toEqual({
                confirmedNonce: 1418,
                nextNonce: 1418,
                pendingNonces: [1421],
                confirmedNonces: [],
            });
        });

        it('a bogus/corrupted locally-confirmed nonce does not override the trusted confirmedNonce', () => {
            // Regression: getEvmNonceInfo's local-data reconciliation (a floor derived from the
            // highest locally-confirmed nonce) must NOT apply here — a single malformed/corrupted
            // local tx record with a huge nonce must not push a trusted, backend-fetched
            // confirmedNonce upward.
            const corruptedConfirmedTx = getOwnEvmTransaction({ nonce: 335753 });
            expect(getEvmNonceInfoFromConfirmedNonce(1418, [corruptedConfirmedTx])).toEqual({
                confirmedNonce: 1418,
                nextNonce: 1418,
                pendingNonces: [],
                confirmedNonces: [335753],
            });
        });

        it('stale pending record superseded by a locally-confirmed tx at the same nonce is ignored', () => {
            const confirmedTx1418 = getOwnEvmTransaction({ nonce: 1418 });
            const transactions = [confirmedTx1418, pendingSentTx(1418), pendingSentTx(1419)];
            expect(getEvmNonceInfoFromConfirmedNonce(1419, transactions)).toEqual({
                confirmedNonce: 1419,
                nextNonce: 1420,
                pendingNonces: [1419],
                confirmedNonces: [1418],
            });
        });

        it('a locally-confirmed tx contiguous with a stale confirmedNonce bridges the just-confirmed slot', () => {
            // Transient while a tx confirms: fetchAndUpdateAccountThunk records the lowest pending tx
            // (nonce 1418) as confirmed in the tx list before it re-fetches account.misc.nonce, so the
            // backend confirmedNonce still lags at 1418. The just-confirmed slot must still advance
            // nextNonce past the contiguous pending 1419/1420, otherwise those higher pending txs
            // would momentarily read as a nonce gap and flash a false warning in the tx list.
            const confirmedTx1418 = getOwnEvmTransaction({ nonce: 1418 });
            const transactions = [confirmedTx1418, pendingSentTx(1419), pendingSentTx(1420)];
            expect(getEvmNonceInfoFromConfirmedNonce(1418, transactions)).toEqual({
                confirmedNonce: 1418,
                nextNonce: 1421,
                pendingNonces: [1419, 1420],
                confirmedNonces: [1418],
            });
        });

        it('a confirmed tx signed by somebody else does not occupy a nonce slot', () => {
            // The 2026-08-02 incident: a fake-USDC airdrop signed by a stranger at *their* nonce 45
            // emits a transfer out of the account, so blockbook indexes it against the account and
            // Suite labels it 'sent'. Counting it made Suite offer 46 while 45 was free, stranding
            // the send in a permanent nonce gap.
            const foreignTxAtNonce45 = getForeignEvmTransaction({ nonce: 45 });
            expect(getEvmNonceInfoFromConfirmedNonce(45, [foreignTxAtNonce45])).toEqual({
                confirmedNonce: 45,
                nextNonce: 45,
                pendingNonces: [],
                confirmedNonces: [],
            });
        });

        it('a pending tx signed by somebody else does not occupy a nonce slot', () => {
            // Same vector from the mempool: a transferFrom(account, …) call whose `from` argument
            // blockbook takes at face value, indexed against the account with the caller's nonce.
            const foreignPendingTx = getForeignEvmTransaction({ nonce: 45, blockHeight: -1 });
            expect(getEvmNonceInfoFromConfirmedNonce(45, [foreignPendingTx])).toEqual({
                confirmedNonce: 45,
                nextNonce: 45,
                pendingNonces: [],
                confirmedNonces: [],
            });
        });

        it("the account's own failed tx occupies its nonce", () => {
            // isTxFailed rewrites type to 'failed', which the old type-based filter dropped — but a
            // reverted tx consumes its nonce like any other.
            const ownFailedTx = getOwnEvmTransaction({ nonce: 45, type: 'failed' });
            expect(getEvmNonceInfoFromConfirmedNonce(45, [ownFailedTx])).toEqual({
                confirmedNonce: 45,
                nextNonce: 46,
                pendingNonces: [],
                confirmedNonces: [45],
            });
        });

        it("the account's own contract deployment occupies its nonce", () => {
            const ownContractTx = getOwnEvmTransaction({ nonce: 45, type: 'contract' });
            expect(getEvmNonceInfoFromConfirmedNonce(45, [ownContractTx])).toEqual({
                confirmedNonce: 45,
                nextNonce: 46,
                pendingNonces: [],
                confirmedNonces: [45],
            });
        });
    });

    describe('getPendingEvmNonceStatus', () => {
        it('nonce below confirmedNonce with a confirmed tx at that nonce is superseded', () => {
            // A different confirmed tx occupies 1470, so it is present in confirmedNonces.
            const bounds = {
                confirmedNonce: 1471,
                nextNonce: 1472,
                pendingNonces: [1471],
                confirmedNonces: [1470],
            };
            expect(getPendingEvmNonceStatus(1470, bounds)).toBe('superseded');
        });

        it('nonce below confirmedNonce but with no confirmed tx there is ok (just-sent, list not caught up)', () => {
            // Regression: right after sending, the live confirmed-nonce fetch already counts the nonce
            // as confirmed while the just-broadcast tx has not landed in selectAccountTransactions yet,
            // so nothing is confirmed at 1470 locally. Must NOT flash 'superseded' at a healthy tx.
            const bounds = {
                confirmedNonce: 1471,
                nextNonce: 1471,
                pendingNonces: [],
                confirmedNonces: [],
            };
            expect(getPendingEvmNonceStatus(1470, bounds)).toBe('ok');
        });

        it('nonce above nextNonce is a gap', () => {
            const bounds = {
                confirmedNonce: 41,
                nextNonce: 42,
                pendingNonces: [],
                confirmedNonces: [],
            };
            expect(getPendingEvmNonceStatus(44, bounds)).toBe('gap');
        });

        it('nonce within the pending range is ok', () => {
            const bounds = {
                confirmedNonce: 41,
                nextNonce: 44,
                pendingNonces: [41, 42, 43],
                confirmedNonces: [],
            };
            expect(getPendingEvmNonceStatus(42, bounds)).toBe('ok');
        });
    });

    describe('getEvmNonceStatus', () => {
        const bounds = {
            confirmedNonce: 41,
            nextNonce: 43,
            pendingNonces: [41, 42],
            confirmedNonces: [],
        };

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

    describe('isTransactionBumpable', () => {
        const rbfFeatures: NetworkFeature[] = ['rbf'];
        const bumpableTx = (overrides?: Partial<WalletAccountTransaction>) =>
            getWalletTransaction({ type: 'sent', rbfParams, ...overrides });

        it('is true with rbfParams, the rbf network feature, no deadline and a non-joint tx', () => {
            expect(isTransactionBumpable(bumpableTx(), rbfFeatures)).toBe(true);
        });

        it('is false without rbfParams', () => {
            expect(isTransactionBumpable(bumpableTx({ rbfParams: undefined }), rbfFeatures)).toBe(
                false,
            );
        });

        it('is false when the network has no rbf feature', () => {
            expect(isTransactionBumpable(bumpableTx(), [])).toBe(false);
            expect(isTransactionBumpable(bumpableTx(), undefined)).toBe(false);
        });

        it('is false when the tx has a deadline (e.g. a time-boxed swap)', () => {
            expect(isTransactionBumpable(bumpableTx({ deadline: 123456 }), rbfFeatures)).toBe(
                false,
            );
        });

        it("is false for a 'joint' (coinjoin) tx", () => {
            expect(isTransactionBumpable(bumpableTx({ type: 'joint' }), rbfFeatures)).toBe(false);
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
            const transaction = getWalletTransaction({
                symbol: btcSymbol,
                amount: '1000',
            });

            expect(getTargetAmount(undefined, transaction)).toBe('0.00001');
        });

        it('returns the formatted target amount for a non "sent to self" target', () => {
            const target = buildTarget({ amount: '2000', isAccountTarget: true });
            const transaction = getWalletTransaction({
                symbol: btcSymbol,
                type: 'recv',
                amount: '1000',
                targets: [target],
            });

            expect(getTargetAmount(target, transaction)).toBe('0.00002');
        });

        it('returns the formatted amount of an external target in a sent transaction', () => {
            const externalTarget = buildTarget({ amount: '500', isAccountTarget: false });
            const transaction = getWalletTransaction({
                symbol: btcSymbol,
                type: 'sent',
                amount: '1000',
                targets: [externalTarget],
            });

            expect(getTargetAmount(externalTarget, transaction)).toBe('0.000005');
        });

        it('returns the transaction amount for a "sent to self" target when there is no external target', () => {
            const selfTarget = buildTarget({ amount: '1000', isAccountTarget: true, n: 1 });
            const transaction = getWalletTransaction({
                symbol: btcSymbol,
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
                symbol: btcSymbol,
                type: 'sent',
                amount: '1000',
                targets: [selfTarget, externalTarget],
            });

            expect(getTargetAmount(selfTarget, transaction)).toBeNull();
        });
    });

    describe('getDecreaseOutputId', () => {
        const precomposedForm = { setMaxOutputId: 2 } as unknown as FormState;

        it('returns the form setMaxOutputId for a native RBF bump-fee transaction', () => {
            expect(getDecreaseOutputId(buildBumpFeeRbfTx(true), precomposedForm)).toBe(2);
        });

        it('returns undefined when the transaction is undefined', () => {
            expect(getDecreaseOutputId(undefined, precomposedForm)).toBeUndefined();
        });

        it('returns undefined for a bump-fee transaction that is not native RBF', () => {
            expect(getDecreaseOutputId(buildBumpFeeRbfTx(false), precomposedForm)).toBeUndefined();
        });

        it('returns undefined for a cancel RBF transaction', () => {
            expect(getDecreaseOutputId(buildCancelRbfTx(), precomposedForm)).toBeUndefined();
        });

        it('returns undefined for a non-RBF transaction', () => {
            expect(getDecreaseOutputId(buildNonRbfTx(), precomposedForm)).toBeUndefined();
        });

        it('returns undefined when the form is missing', () => {
            expect(getDecreaseOutputId(buildBumpFeeRbfTx(true), undefined)).toBeUndefined();
        });
    });
});
