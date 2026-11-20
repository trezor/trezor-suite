/**
 * @jest-environment jsdom
 */
import { type UnknownAction, combineReducers } from '@reduxjs/toolkit';

import {
    act,
    createTestCompositionRoot,
    renderHookWithStoreProvider,
    testMocks,
} from '@suite-common/test-utils';
import type { WalletAccountTransaction } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';

import { useAllowanceTxTracking } from './useAllowanceTxTracking';
import { type TransactionsState } from '../transactions/transactionsReducerTypes';

const ACCOUNT_KEY = mockAccountKey({ descriptor: 'testAccountKey' });
const TXID = 'test-txid-abc123';

type State = { wallet: { transactions: TransactionsState; accounts: never[] } };

const createPreloadedState = (transactions: WalletAccountTransaction[] = []) => ({
    wallet: {
        transactions: {
            transactions: { [ACCOUNT_KEY]: transactions },
            phishing: {},
            fetchStatusDetail: {},
        },
        accounts: [],
    },
});

const SET_TRANSACTIONS = 'test/setTransactions';

const setTransactions = (transactions: WalletAccountTransaction[]) => ({
    type: SET_TRANSACTIONS,
    payload: transactions,
});

type SetTransactionsAction = ReturnType<typeof setTransactions>;

const transactionsReducer = (
    state: TransactionsState,
    action: UnknownAction | SetTransactionsAction,
): TransactionsState =>
    action.type === SET_TRANSACTIONS
        ? { ...state, transactions: { [ACCOUNT_KEY]: (action as SetTransactionsAction).payload } }
        : state;

const renderUseAllowanceTxTracking = (preloadedState = createPreloadedState()) => {
    const { services } = createTestCompositionRoot<void, State>({
        reducer: combineReducers({
            wallet: combineReducers({
                transactions: (state = preloadedState.wallet.transactions, action: UnknownAction) =>
                    transactionsReducer(state, action),
                accounts: (state = []) => state,
            }),
        }),
        preloadedState,
    });

    return {
        ...renderHookWithStoreProvider(() => useAllowanceTxTracking({ accountKey: ACCOUNT_KEY }), {
            services,
        }),
        services,
    };
};

describe('useAllowanceTxTracking', () => {
    describe('initial state', () => {
        it('should return null approvalTxid and idle status before txid is set', () => {
            const { result } = renderUseAllowanceTxTracking();

            expect(result.current.approvalTxid).toBeNull();
            expect(result.current.status).toEqual({
                isPending: false,
                isConfirmed: false,
                isFailed: false,
            });
        });
    });

    describe('when approvalTxid is set but no matching transaction exists in root', () => {
        it('should return idle status', () => {
            const { result } = renderUseAllowanceTxTracking(createPreloadedState([]));

            act(() => {
                result.current.setApprovalTxid(TXID);
            });

            expect(result.current.approvalTxid).toBe(TXID);
            expect(result.current.status).toEqual({
                isPending: false,
                isConfirmed: false,
                isFailed: false,
            });
        });
    });

    describe('replaced transaction', () => {
        const NONCE = 7;
        const REPLACEMENT_TXID = 'replacement-txid';
        const getEvmTransaction = (tx: Partial<WalletAccountTransaction>) =>
            testMocks.getWalletTransaction({
                ethereumSpecific: { status: 1, nonce: NONCE, gasLimit: 21000 },
                ...tx,
            });

        it('follows a pending replacement with the same nonce', () => {
            const { result, services } = renderUseAllowanceTxTracking(
                createPreloadedState([getEvmTransaction({ txid: TXID, blockHeight: 0 })]),
            );

            act(() => {
                result.current.setApprovalTxid(TXID);
            });
            act(() => {
                services.store.dispatch(
                    setTransactions([
                        getEvmTransaction({ txid: REPLACEMENT_TXID, blockHeight: 0 }),
                    ]),
                );
            });

            expect(result.current.approvalTxid).toBe(REPLACEMENT_TXID);
            expect(result.current.status.isPending).toBe(true);

            act(() => {
                services.store.dispatch(
                    setTransactions([
                        getEvmTransaction({ txid: REPLACEMENT_TXID, blockHeight: 700000 }),
                    ]),
                );
            });

            expect(result.current.status.isConfirmed).toBe(true);
        });

        it('does not follow a transaction with another nonce', () => {
            const { result, services } = renderUseAllowanceTxTracking(
                createPreloadedState([getEvmTransaction({ txid: TXID, blockHeight: 0 })]),
            );

            act(() => {
                result.current.setApprovalTxid(TXID);
            });
            act(() => {
                services.store.dispatch(
                    setTransactions([
                        getEvmTransaction({
                            txid: REPLACEMENT_TXID,
                            blockHeight: 0,
                            ethereumSpecific: { status: 1, nonce: NONCE + 1, gasLimit: 21000 },
                        }),
                    ]),
                );
            });

            expect(result.current.approvalTxid).toBe(TXID);
            expect(result.current.status).toEqual({
                isPending: false,
                isConfirmed: false,
                isFailed: false,
            });
        });
    });

    describe('transaction status derivation', () => {
        it('should return isPending true for a transaction with no blockHeight', () => {
            const pendingTx = testMocks.getWalletTransaction({
                txid: TXID,
                blockHeight: 0,
            });
            const { result } = renderUseAllowanceTxTracking(createPreloadedState([pendingTx]));

            act(() => {
                result.current.setApprovalTxid(TXID);
            });

            expect(result.current.status).toEqual({
                isPending: true,
                isConfirmed: false,
                isFailed: false,
            });
        });

        it('should return isFailed true for a transaction with type "failed"', () => {
            const failedTx = testMocks.getWalletTransaction({
                txid: TXID,
                blockHeight: 700000,
                type: 'failed',
            });
            const { result } = renderUseAllowanceTxTracking(createPreloadedState([failedTx]));

            act(() => {
                result.current.setApprovalTxid(TXID);
            });

            expect(result.current.status).toEqual({
                isPending: false,
                isConfirmed: false,
                isFailed: true,
            });
        });

        it('should return isConfirmed true for a confirmed transaction', () => {
            const confirmedTx = testMocks.getWalletTransaction({
                txid: TXID,
                blockHeight: 700000,
                type: 'sent',
            });
            const { result } = renderUseAllowanceTxTracking(createPreloadedState([confirmedTx]));

            act(() => {
                result.current.setApprovalTxid(TXID);
            });

            expect(result.current.status).toEqual({
                isPending: false,
                isConfirmed: true,
                isFailed: false,
            });
        });
    });
});
