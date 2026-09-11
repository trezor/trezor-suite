import { type UnknownAction } from '@reduxjs/toolkit';

import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import {
    type Account,
    type AccountDescriptor,
    type AccountKey,
    type WalletAccountTransaction,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import type { StaticSessionId } from '@trezor/device-utils';

import { transactionsActions } from './transactionsActions';
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
import { prepareTransactionsReducer, transactionsInitialState } from './transactionsReducer';
import { type TransactionsRootState, type TransactionsState } from './transactionsReducerTypes';

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

describe('keeping up with what the reducer does to an account', () => {
    const aliceId = (txid: string) => getTransactionId(aliceKey, txid);
    const bobId = (txid: string) => getTransactionId(bobKey, txid);

    it('holds a transaction that was added', () => {
        withSubscription(() => {
            const existing = mockTransaction(ALICE, 'txA');
            const arrived = mockTransaction(ALICE, 'txA2');
            transactionsIndex.read(createState({ [aliceKey]: [existing] }));

            const state = createState({ [aliceKey]: [existing, arrived] });

            expect(transactionsIndex.getById(state, aliceId('txA2'))).toBe(arrived);
            expect(selectAccountTransactionsFromIndex(state, aliceKey)).toEqual([
                existing,
                arrived,
            ]);
            expect(selectTransactionsByTxid(state, 'txA2')).toEqual([arrived]);
            expect(transactionsIndex.read(state).changes).toEqual({
                added: [aliceId('txA2')],
                removed: [],
                updated: [],
            });
        });
    });

    it('lets go of a transaction that was removed', () => {
        withSubscription(() => {
            const kept = mockTransaction(ALICE, 'txA');
            const dropped = mockTransaction(ALICE, 'txA2');
            transactionsIndex.read(createState({ [aliceKey]: [kept, dropped] }));

            const state = createState({ [aliceKey]: [kept] });

            expect(transactionsIndex.getById(state, aliceId('txA2'))).toBeUndefined();
            expect(selectAccountTransactionsFromIndex(state, aliceKey)).toEqual([kept]);
            expect(selectTransactionsByTxid(state, 'txA2')).toEqual([]);
            expect(transactionsIndex.read(state).changes).toEqual({
                added: [],
                removed: [aliceId('txA2')],
                updated: [],
            });
        });
    });

    it('shows the new object when a transaction was replaced', () => {
        withSubscription(() => {
            const pending = mockTransaction(ALICE, 'txA', '1');
            const confirmed = mockTransaction(ALICE, 'txA', '2');
            transactionsIndex.read(createState({ [aliceKey]: [pending] }));

            const state = createState({ [aliceKey]: [confirmed] });

            expect(transactionsIndex.getById(state, aliceId('txA'))).toBe(confirmed);
            expect(selectAccountTransactionsFromIndex(state, aliceKey)).toEqual([confirmed]);
            expect(selectTransactionsByTxid(state, 'txA')).toEqual([confirmed]);
            // The membership did not change, so a list keyed by id has no reason to be woken.
            expect(selectAccountTransactionIdsFromIndex(state, aliceKey)).toEqual([aliceId('txA')]);
        });
    });

    it('empties every lookup when a whole account is forgotten', () => {
        withSubscription(() => {
            const aliceTransactions = [mockTransaction(ALICE, 'txA')];
            const bobTransaction = mockTransaction(BOB, 'txB');
            transactionsIndex.read(
                createState({ [aliceKey]: aliceTransactions, [bobKey]: [bobTransaction] }),
            );

            const state = createState({ [aliceKey]: aliceTransactions });

            expect(selectAccountTransactionsFromIndex(state, bobKey)).toEqual([]);
            expect(selectTransactionsByTxid(state, 'txB')).toEqual([]);
            expect(transactionsIndex.getById(state, bobId('txB'))).toBeUndefined();
            expect(transactionsIndex.read(state).changes).toEqual({
                added: [],
                removed: [bobId('txB')],
                updated: [],
            });
        });
    });

    it('picks up an account that appeared', () => {
        withSubscription(() => {
            const aliceTransactions = [mockTransaction(ALICE, 'txA')];
            const bobTransaction = mockTransaction(BOB, 'txB');
            transactionsIndex.read(createState({ [aliceKey]: aliceTransactions }));

            const state = createState({
                [aliceKey]: aliceTransactions,
                [bobKey]: [bobTransaction],
            });

            expect(selectAccountTransactionsFromIndex(state, bobKey)).toEqual([bobTransaction]);
            expect(transactionsIndex.read(state).changes).toEqual({
                added: [bobId('txB')],
                removed: [],
                updated: [],
            });
        });
    });

    it('leaves the other side of a shared txid alone when one side goes', () => {
        // Both accounts filed the same transfer. Forgetting one account must not take the other
        // account's copy out of the txid lookup with it.
        withSubscription(() => {
            const sent = mockTransaction(ALICE, 'txShared', '-1');
            const received = mockTransaction(BOB, 'txShared', '1');
            transactionsIndex.read(createState({ [aliceKey]: [sent], [bobKey]: [received] }));

            const state = createState({ [bobKey]: [received] });

            expect(selectTransactionsByTxid(state, 'txShared')).toEqual([received]);
            expect(transactionsIndex.getById(state, aliceId('txShared'))).toBeUndefined();
            expect(transactionsIndex.getById(state, bobId('txShared'))).toBe(received);
        });
    });

    it('leaves an untouched account’s lookups identical through all of it', () => {
        withSubscription(() => {
            const aliceTransactions = [mockTransaction(ALICE, 'txA')];
            const bobTransaction = mockTransaction(BOB, 'txB');
            const before = createState({
                [aliceKey]: aliceTransactions,
                [bobKey]: [bobTransaction],
            });
            const aliceEntities = selectAccountTransactionsFromIndex(before, aliceKey);
            const aliceIds = selectAccountTransactionIdsFromIndex(before, aliceKey);

            const after = createState({
                [aliceKey]: aliceTransactions,
                [bobKey]: [mockTransaction(BOB, 'txB2')],
            });

            expect(selectAccountTransactionsFromIndex(after, aliceKey)).toBe(aliceEntities);
            expect(selectAccountTransactionIdsFromIndex(after, aliceKey)).toBe(aliceIds);
        });
    });
});

describe('keeping up with the real reducer', () => {
    // Everything above drives the index with hand-built states. This drives it with the actions
    // the app dispatches, through the reducer the app runs — which is also what proves the premise
    // `getParts` rests on: that Immer leaves an account the action did not touch identical.
    const transactionsReducer = prepareTransactionsReducer({
        actionTypes: { storageLoad: mockActionType('storageLoad') },
        reducers: { storageLoadTransactions: mockReducer() },
    });

    const aliceAccount = { key: aliceKey } as Account;
    const bobAccount = { key: bobKey } as Account;

    const toState = (transactions: TransactionsState): TransactionsRootState =>
        ({ wallet: { transactions } }) as unknown as TransactionsRootState;

    const dispatch = (state: TransactionsState, action: UnknownAction) =>
        transactionsReducer(state, action);

    const withBothAccounts = () =>
        dispatch(
            dispatch(transactionsInitialState, {
                type: transactionsActions.addTransaction.type,
                payload: { transactions: [mockTransaction(ALICE, 'txA')], account: aliceAccount },
            }),
            {
                type: transactionsActions.addTransaction.type,
                payload: { transactions: [mockTransaction(BOB, 'txB')], account: bobAccount },
            },
        );

    it('sees a transaction the reducer added', () => {
        withSubscription(() => {
            const before = withBothAccounts();
            transactionsIndex.read(toState(before));

            const after = dispatch(before, {
                type: transactionsActions.addTransaction.type,
                payload: { transactions: [mockTransaction(ALICE, 'txA2')], account: aliceAccount },
            });

            expect(
                selectTransactionByAccountKeyAndTxidFromIndex(toState(after), aliceKey, 'txA2'),
            ).toBeDefined();
            expect(transactionsIndex.read(toState(after)).changes.added).toEqual([
                getTransactionId(aliceKey, 'txA2'),
            ]);
        });
    });

    it('sees a transaction the reducer removed', () => {
        withSubscription(() => {
            const before = withBothAccounts();
            transactionsIndex.read(toState(before));

            const after = dispatch(before, {
                type: transactionsActions.removeTransaction.type,
                payload: { account: aliceAccount, txs: [mockTransaction(ALICE, 'txA')] },
            });

            expect(selectAccountTransactionsFromIndex(toState(after), aliceKey)).toEqual([]);
            expect(transactionsIndex.read(toState(after)).changes.removed).toEqual([
                getTransactionId(aliceKey, 'txA'),
            ]);
        });
    });

    it('sees a transaction the reducer replaced', () => {
        withSubscription(() => {
            const before = withBothAccounts();
            transactionsIndex.read(toState(before));
            const confirmed = mockTransaction(ALICE, 'txA', '2');

            const after = dispatch(before, {
                type: transactionsActions.replaceTransaction.type,
                payload: { key: aliceKey, txid: 'txA', tx: confirmed },
            });

            expect(
                selectTransactionByAccountKeyAndTxidFromIndex(toState(after), aliceKey, 'txA'),
            ).toBe(confirmed);
            expect(transactionsIndex.read(toState(after)).changes.updated).toEqual([
                getTransactionId(aliceKey, 'txA'),
            ]);
        });
    });

    it('sees an account the reducer reset', () => {
        withSubscription(() => {
            const before = withBothAccounts();
            transactionsIndex.read(toState(before));

            const after = dispatch(before, {
                type: transactionsActions.resetTransaction.type,
                payload: { account: bobAccount },
            });

            expect(selectAccountTransactionsFromIndex(toState(after), bobKey)).toEqual([]);
            expect(transactionsIndex.read(toState(after)).changes.removed).toEqual([
                getTransactionId(bobKey, 'txB'),
            ]);
        });
    });

    it('leaves the accounts the action did not touch identical', () => {
        // The premise of `getParts`. If this ever stops holding, the index is still correct — it
        // just stops being cheap, silently.
        const before = withBothAccounts();

        const after = dispatch(before, {
            type: transactionsActions.addTransaction.type,
            payload: { transactions: [mockTransaction(ALICE, 'txA2')], account: aliceAccount },
        });

        expect(after.transactions[bobKey]).toBe(before.transactions[bobKey]);
        expect(after.transactions[aliceKey]).not.toBe(before.transactions[aliceKey]);
    });
});
