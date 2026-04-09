import { combineReducers } from '@reduxjs/toolkit';

import {
    act,
    configureMockStore,
    renderHookWithStoreProvider,
    testMocks,
} from '@suite-common/test-utils';
import { type AccountKey } from '@suite-common/wallet-types';

import { useAllowanceTxTracking } from '../useAllowanceTxTracking';

const ACCOUNT_KEY = 'test-account-key' as AccountKey;
const TXID = 'test-txid-abc123';

const createPreloadedState = (transactions: any[] = []) => ({
    wallet: {
        transactions: {
            transactions: { [ACCOUNT_KEY]: transactions },
            phishing: {},
            fetchStatusDetail: {},
        },
        accounts: [],
    },
});

const renderUseAllowanceTxTracking = (preloadedState = createPreloadedState()) => {
    const store = configureMockStore({
        reducer: combineReducers({
            wallet: combineReducers({
                transactions: (state = preloadedState.wallet.transactions) => state,
                accounts: (state = []) => state,
            }),
        }),
        preloadedState,
    });

    return {
        ...renderHookWithStoreProvider(() => useAllowanceTxTracking({ accountKey: ACCOUNT_KEY }), {
            store,
        }),
        store,
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

    describe('when approvalTxid is set but no matching transaction exists in store', () => {
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
