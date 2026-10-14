import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import * as fixtures from './__fixtures__/transactionsReducer';
import { transactionsActions } from './transactionsActions';
import { prepareTransactionsReducer, transactionsInitialState } from './transactionsReducer';
import type { TransactionsState } from './transactionsReducerTypes';

const transactionsReducer = prepareTransactionsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadTransactions: mockReducer() },
});

const account = mockWalletAccount({ symbol: asNetworkSymbol('btc') });

describe(transactionsReducer.name, () => {
    describe('addTransaction', () => {
        it('returns the same state when no tx changes', () => {
            const state: TransactionsState = {
                ...transactionsInitialState,
                transactions: { [account.key]: [testMocks.getWalletTransaction()] },
            };

            const result = transactionsReducer(state, {
                type: transactionsActions.addTransaction.type,
                payload: { account, transactions: [testMocks.getWalletTransaction()] },
            });

            expect(result).toBe(state);
        });

        it('deep-freezes added txs', () => {
            const result = transactionsReducer(transactionsInitialState, {
                type: transactionsActions.addTransaction.type,
                payload: { account, transactions: [testMocks.getWalletTransaction()] },
            });

            expect(Object.isFrozen(result.transactions[account.key]?.[0]?.details.vin[0])).toBe(
                true,
            );
        });

        it('deep-freezes updated txs', () => {
            const state: TransactionsState = {
                ...transactionsInitialState,
                transactions: {
                    [account.key]: [testMocks.getWalletTransaction({ blockHeight: 0 })],
                },
            };

            const result = transactionsReducer(state, {
                type: transactionsActions.addTransaction.type,
                payload: { account, transactions: [testMocks.getWalletTransaction()] },
            });

            expect(Object.isFrozen(result.transactions[account.key]?.[0]?.details.vin[0])).toBe(
                true,
            );
        });

        it('keeps unchanged txs by reference', () => {
            const a = testMocks.getWalletTransaction({ txid: 'a' });
            const c = testMocks.getWalletTransaction({ txid: 'c' });
            const state: TransactionsState = {
                ...transactionsInitialState,
                transactions: {
                    [account.key]: [
                        a,
                        testMocks.getWalletTransaction({ txid: 'b', blockHeight: 0 }),
                        c,
                    ],
                },
            };

            const result = transactionsReducer(state, {
                type: transactionsActions.addTransaction.type,
                payload: {
                    account,
                    transactions: [
                        testMocks.getWalletTransaction({ txid: 'new' }),
                        testMocks.getWalletTransaction({ txid: 'b' }),
                    ],
                },
            });

            expect(result.transactions[account.key]?.[1]).toBe(a);
            expect(result.transactions[account.key]?.[3]).toBe(c);
        });

        fixtures.addTransaction.forEach(f => {
            it(f.description, () => {
                const result = transactionsReducer(
                    {
                        ...transactionsInitialState,
                        ...f.initialState,
                    },
                    {
                        type: transactionsActions.addTransaction.type,
                        payload: f.actionPayload,
                    },
                );

                expect(result.transactions).toStrictEqual(f.result);
            });
        });
    });

    describe('removeTransaction', () => {
        fixtures.removeTransaction.forEach(f => {
            it(f.description, () => {
                const result = transactionsReducer(
                    {
                        ...transactionsInitialState,
                        ...f.initialState,
                    },
                    {
                        type: transactionsActions.removeTransaction.type,
                        payload: f.actionPayload,
                    },
                );

                expect(result.transactions).toStrictEqual(f.result);
            });
        });
    });
});
