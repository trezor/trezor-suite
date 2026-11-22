import { combineReducers } from '@reduxjs/toolkit';
import { getDefaultStore } from 'jotai';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type YieldPendingTransactionState,
    initialWalletSettingsState,
    prepareTransactionsReducer,
    transactionsActions,
} from '@suite-common/wallet-core';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { alertAtom, hideAlertAtom } from '@suite-native/alerts';
import { localeReducer } from '@suite-native/intl';
import { act, createLightStore, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { mockTransaction } from '@suite-native/tokens';
import { mock } from '@trezor/dependency-injection';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import { useYieldPendingTransaction } from './useYieldPendingTransaction';

const mockOpenSheet = mock<() => void>();
const mockCloseSheet = mock<() => void>();
const mockOpenInBlockchain = mock<() => void>();
const mockBottomSheetRef = { current: null };

jest.mock('@suite-native/atoms', () => ({
    ...jest.requireActual('@suite-native/atoms'),
    useBottomSheetModal: () => ({
        bottomSheetRef: mockBottomSheetRef,
        openModal: mockOpenSheet,
        closeModal: mockCloseSheet,
    }),
}));

jest.mock('./useYieldPendingTransactionDetails', () => ({
    useYieldPendingTransactionDetails: () => ({
        explorerUrl: undefined,
        openInBlockchain: mockOpenInBlockchain,
    }),
}));

const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const gracePeriod = 120_000;
const submittedAt = 1_700_000_000_000;
const pendingTransaction: YieldPendingTransactionState = {
    type: 'deposit',
    submittedAt,
    txid: 'original',
    amount: '1',
    nonce: 7,
};

const startTracking = async (
    transaction: YieldPendingTransactionState,
    transactions: WalletAccountTransaction[] = [],
) => {
    const transactionsReducer = prepareTransactionsReducer({
        actionTypes: { storageLoad: mockActionType('storageLoad') },
        reducers: { storageLoadTransactions: mockReducer() },
    });
    const store = createLightStore({
        reducer: {
            locale: localeReducer,
            wallet: combineReducers({
                transactions: transactionsReducer,
                settings: (state = initialWalletSettingsState) => state,
            }),
        },
    });
    const addTransactions = (values: WalletAccountTransaction[]) =>
        store.dispatch(transactionsActions.addTransaction({ account, transactions: values }));
    addTransactions(transactions);

    const view = await renderHookWithStoreProvider(useYieldPendingTransaction, {
        initialProps: {
            accountKey: account.key,
            isFocused: true,
            pendingTransaction: transaction,
            transactionType: transaction.type,
        },
        services: { store },
    });

    return { ...view, addTransactions };
};

const makeAccountTransaction = (txid: string): WalletAccountTransaction => ({
    ...mockTransaction,
    symbol: account.symbol,
    descriptor: account.descriptor,
    txid,
    blockHeight: 0,
    type: 'sent',
    ethereumSpecific: { nonce: 7, status: -1, gasLimit: 21_000 },
    details: {
        ...mockTransaction.details,
        vin: [{ n: 0, isAddress: true, addresses: [account.descriptor] }],
    },
});

describe('Yield pending transaction sheet', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        jest.setSystemTime(submittedAt);
        getDefaultStore().set(hideAlertAtom);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it.each(['deposit', 'withdraw', 'revoke'] as const)(
        'closes the missing %s sheet but keeps tracking and guarding the same transaction',
        async type => {
            const transaction = { ...pendingTransaction, type };
            const { result, addTransactions } = await startTracking(transaction);
            expect(mockOpenSheet).toHaveBeenCalledTimes(1);

            await act(() => jest.advanceTimersByTime(gracePeriod - 1));
            expect(getDefaultStore().get(alertAtom)).toBeNull();
            expect(mockCloseSheet).not.toHaveBeenCalled();

            await act(() => jest.advanceTimersByTime(1));
            expect(mockCloseSheet).toHaveBeenCalledTimes(1);
            expect(getDefaultStore().get(alertAtom)?.type).toBe('earnTransactionNotConfirmed');
            expect(result.current.pendingTransaction).toBe(transaction);
            expect(result.current.displayedPendingTransaction).toBe(transaction);

            // The same transaction can still appear after the warning.
            await act(() => {
                addTransactions([makeAccountTransaction(transaction.txid)]);
            });
            expect(result.current.pendingTransaction).toBe(transaction);
            expect(getDefaultStore().get(alertAtom)).toBeNull();
        },
    );

    it('waits for sheet dismissal after returning to the pending transaction', async () => {
        const { result, rerender } = await startTracking(pendingTransaction);
        const props = {
            accountKey: account.key,
            isFocused: true,
            pendingTransaction,
            transactionType: pendingTransaction.type,
        };

        await rerender({ ...props, isFocused: false });
        await act(() => result.current.pendingModalProps?.onDismiss());
        expect(result.current.isSheetPresented).toBe(false);

        await rerender(props);

        expect(mockOpenSheet).toHaveBeenCalledTimes(2);
        expect(result.current.isSheetPresented).toBe(true);
    });

    it.each(['original', 'replacement'])(
        'keeps waiting while the %s is in account history',
        async txid => {
            await startTracking(pendingTransaction, [makeAccountTransaction(txid)]);

            await act(() => jest.advanceTimersByTime(gracePeriod));

            expect(mockOpenSheet).toHaveBeenCalledTimes(1);
            expect(mockCloseSheet).not.toHaveBeenCalled();
            expect(getDefaultStore().get(alertAtom)).toBeNull();
        },
    );
});
