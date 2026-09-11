import {
    type AccountDescriptor,
    type AccountKey,
    type WalletAccountTransaction,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import type { StaticSessionId } from '@trezor/device-utils';

import {
    getTransactionId,
    getTransactionIdFromTransaction,
    selectAccountTransactionIdsFromIndex,
    selectAccountTransactionsFromIndex,
    selectTransactionByAccountKeyAndTxidFromIndex,
    selectTransactionIdsByTxid,
    selectTransactionsByTxid,
    transactionsIndex,
} from './transactionsIndex';
import { type TransactionsRootState } from './transactionsReducerTypes';

const DEVICE_STATE =
    'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@448CCE89D32A733A1632F345:0' as StaticSessionId;

const ALICE = asAccountDescriptor('aliceDescriptor');
const BOB = asAccountDescriptor('bobDescriptor');

const aliceKey = mockAccountKey({ descriptor: ALICE });
const bobKey = mockAccountKey({ descriptor: BOB });

const mockTransaction = (
    descriptor: AccountDescriptor,
    txid: string,
    amount = '1',
): WalletAccountTransaction =>
    ({
        descriptor,
        symbol: 'btc',
        deviceState: DEVICE_STATE,
        txid,
        amount,
    }) as WalletAccountTransaction;

const createState = (
    transactions: Record<string, (WalletAccountTransaction | null | undefined)[]>,
): TransactionsRootState =>
    ({ wallet: { transactions: { transactions } } }) as unknown as TransactionsRootState;

// The index is one shared instance, so a test that holds it has to leave it as it found it.
const withSubscription = (run: () => void) => {
    const release = transactionsIndex.retain();
    try {
        run();
    } finally {
        release();
    }
};

describe('transactionsIndex', () => {
    afterEach(() => {
        if (transactionsIndex.getSubscriberCount() !== 0) {
            throw new Error('a test left the shared index held');
        }
    });

    it('finds a transaction by its account and txid', () => {
        const transaction = mockTransaction(ALICE, 'txA');
        const state = createState({ [aliceKey]: [transaction] });

        expect(selectTransactionByAccountKeyAndTxidFromIndex(state, aliceKey, 'txA')).toBe(
            transaction,
        );
    });

    it('answers with nothing for a txid the account does not have', () => {
        const state = createState({ [aliceKey]: [mockTransaction(ALICE, 'txA')] });

        expect(
            selectTransactionByAccountKeyAndTxidFromIndex(state, aliceKey, 'txB'),
        ).toBeUndefined();
    });

    it('keeps the two sides of a transfer between the user’s own accounts apart', () => {
        // Same `txid`, filed under both accounts, each describing the transfer from its own side.
        // An index keyed on `txid` alone would lose one of them.
        const sent = mockTransaction(ALICE, 'txShared', '-1');
        const received = mockTransaction(BOB, 'txShared', '1');
        const state = createState({ [aliceKey]: [sent], [bobKey]: [received] });

        expect(selectTransactionByAccountKeyAndTxidFromIndex(state, aliceKey, 'txShared')).toBe(
            sent,
        );
        expect(selectTransactionByAccountKeyAndTxidFromIndex(state, bobKey, 'txShared')).toBe(
            received,
        );
    });

    it('skips the holes pagination leaves in an account', () => {
        const transaction = mockTransaction(ALICE, 'txA');
        const state = createState({ [aliceKey]: [undefined, transaction, null] });

        expect(transactionsIndex.getIds(state)).toEqual([getTransactionId(aliceKey, 'txA')]);
    });

    it('holds transactions from every account', () => {
        const state = createState({
            [aliceKey]: [mockTransaction(ALICE, 'txA')],
            [bobKey]: [mockTransaction(BOB, 'txB')],
        });

        expect(transactionsIndex.getIds(state)).toEqual([
            getTransactionId(aliceKey, 'txA'),
            getTransactionId(bobKey, 'txB'),
        ]);
    });

    it('is empty for a store with no transactions', () => {
        expect(transactionsIndex.getIds(createState({}))).toEqual([]);
    });

    it('derives the same id from a transaction as from its account and txid', () => {
        // The two ways of naming a transaction have to agree, or a caller holding one would look
        // up the other and miss.
        expect(getTransactionIdFromTransaction(mockTransaction(ALICE, 'txA'))).toBe(
            getTransactionId(aliceKey, 'txA'),
        );
    });

    it('reuses its build while the reducer has not written', () => {
        withSubscription(() => {
            const state = createState({ [aliceKey]: [mockTransaction(ALICE, 'txA')] });

            expect(transactionsIndex.read(state)).toBe(transactionsIndex.read(state));
        });
    });

    it('rebuilds once the reducer replaces the transactions it holds', () => {
        withSubscription(() => {
            const before = mockTransaction(ALICE, 'txA', '1');
            const after = mockTransaction(ALICE, 'txA', '2');

            expect(
                selectTransactionByAccountKeyAndTxidFromIndex(
                    createState({ [aliceKey]: [before] }),
                    aliceKey,
                    'txA',
                ),
            ).toBe(before);
            expect(
                selectTransactionByAccountKeyAndTxidFromIndex(
                    createState({ [aliceKey]: [after] }),
                    aliceKey,
                    'txA',
                ),
            ).toBe(after);
        });
    });
});

describe('getTransactionId', () => {
    it('is the account key and the txid', () => {
        expect(getTransactionId('someKey' as AccountKey, 'txA')).toBe('someKey:txA');
    });
});

describe('a write to one account', () => {
    it('leaves the other accounts’ transactions untouched', () => {
        // The reducer writes one account's array at a time, so Immer keeps the rest identical and
        // the index carries them over instead of walking them again — the transactions of every
        // other account are in none of the three lists.
        withSubscription(() => {
            const aliceTransaction = mockTransaction(ALICE, 'txA');
            const bobTransactions = [mockTransaction(BOB, 'txB')];
            const arrived = mockTransaction(ALICE, 'txA2');

            transactionsIndex.read(
                createState({ [aliceKey]: [aliceTransaction], [bobKey]: bobTransactions }),
            );

            expect(
                transactionsIndex.read(
                    createState({
                        [aliceKey]: [aliceTransaction, arrived],
                        [bobKey]: bobTransactions,
                    }),
                ).changes,
            ).toEqual({
                added: [getTransactionId(aliceKey, 'txA2')],
                removed: [],
                updated: [],
            });
        });
    });

    it('reports a replaced transaction as updated', () => {
        // What `replaceTransaction` does when a pending transaction confirms.
        withSubscription(() => {
            const pending = mockTransaction(ALICE, 'txA', '1');
            const confirmed = mockTransaction(ALICE, 'txA', '2');

            transactionsIndex.read(createState({ [aliceKey]: [pending] }));

            expect(
                transactionsIndex.read(createState({ [aliceKey]: [confirmed] })).changes,
            ).toEqual({
                added: [],
                removed: [],
                updated: [getTransactionId(aliceKey, 'txA')],
            });
        });
    });

    it('reports the transactions of a forgotten account as removed', () => {
        withSubscription(() => {
            const aliceTransactions = [mockTransaction(ALICE, 'txA')];

            transactionsIndex.read(
                createState({
                    [aliceKey]: aliceTransactions,
                    [bobKey]: [mockTransaction(BOB, 'txB')],
                }),
            );

            expect(
                transactionsIndex.read(createState({ [aliceKey]: aliceTransactions })).changes,
            ).toEqual({
                added: [],
                removed: [getTransactionId(bobKey, 'txB')],
                updated: [],
            });
        });
    });
});

describe('looking transactions up by something other than their id', () => {
    it('gives an account its own transactions', () => {
        const state = createState({
            [aliceKey]: [mockTransaction(ALICE, 'txA'), mockTransaction(ALICE, 'txA2')],
            [bobKey]: [mockTransaction(BOB, 'txB')],
        });

        expect(selectAccountTransactionIdsFromIndex(state, aliceKey)).toEqual([
            getTransactionId(aliceKey, 'txA'),
            getTransactionId(aliceKey, 'txA2'),
        ]);
    });

    it('gives an account with no transactions nothing', () => {
        expect(selectAccountTransactionIdsFromIndex(createState({}), aliceKey)).toEqual([]);
    });

    it('finds both sides of a transfer between the user’s own accounts', () => {
        // What `findTransactions` answers by scanning every account in the store.
        const state = createState({
            [aliceKey]: [mockTransaction(ALICE, 'txShared', '-1')],
            [bobKey]: [mockTransaction(BOB, 'txShared', '1'), mockTransaction(BOB, 'txB')],
        });

        expect(selectTransactionIdsByTxid(state, 'txShared')).toEqual([
            getTransactionId(aliceKey, 'txShared'),
            getTransactionId(bobKey, 'txShared'),
        ]);
    });

    it('gives an unknown txid nothing', () => {
        const state = createState({ [aliceKey]: [mockTransaction(ALICE, 'txA')] });

        expect(selectTransactionIdsByTxid(state, 'txNope')).toEqual([]);
    });

    it('leaves one account’s list identical when another account receives a transaction', () => {
        // A screen showing Alice's history is not re-rendered because Bob got paid.
        withSubscription(() => {
            const aliceTransactions = [mockTransaction(ALICE, 'txA')];
            const bobTransaction = mockTransaction(BOB, 'txB');

            const before = selectAccountTransactionIdsFromIndex(
                createState({ [aliceKey]: aliceTransactions, [bobKey]: [bobTransaction] }),
                aliceKey,
            );
            const after = selectAccountTransactionIdsFromIndex(
                createState({
                    [aliceKey]: aliceTransactions,
                    [bobKey]: [bobTransaction, mockTransaction(BOB, 'txB2')],
                }),
                aliceKey,
            );

            expect(after).toBe(before);
        });
    });
});

describe('reading a group as transactions', () => {
    it('gives an account its own transactions', () => {
        const aliceFirst = mockTransaction(ALICE, 'txA');
        const aliceSecond = mockTransaction(ALICE, 'txA2');
        const state = createState({
            [aliceKey]: [aliceFirst, aliceSecond],
            [bobKey]: [mockTransaction(BOB, 'txB')],
        });

        expect(selectAccountTransactionsFromIndex(state, aliceKey)).toEqual([
            aliceFirst,
            aliceSecond,
        ]);
    });

    it('gives both sides of a transfer between the user’s own accounts', () => {
        const sent = mockTransaction(ALICE, 'txShared', '-1');
        const received = mockTransaction(BOB, 'txShared', '1');
        const state = createState({ [aliceKey]: [sent], [bobKey]: [received] });

        expect(selectTransactionsByTxid(state, 'txShared')).toEqual([sent, received]);
    });

    it('leaves one account’s transactions identical when another account receives one', () => {
        withSubscription(() => {
            const aliceTransactions = [mockTransaction(ALICE, 'txA')];
            const bobTransaction = mockTransaction(BOB, 'txB');

            const before = selectAccountTransactionsFromIndex(
                createState({ [aliceKey]: aliceTransactions, [bobKey]: [bobTransaction] }),
                aliceKey,
            );

            expect(
                selectAccountTransactionsFromIndex(
                    createState({
                        [aliceKey]: aliceTransactions,
                        [bobKey]: [bobTransaction, mockTransaction(BOB, 'txB2')],
                    }),
                    aliceKey,
                ),
            ).toBe(before);
        });
    });
});
