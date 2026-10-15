/**
 * @jest-environment jsdom
 */
import { useSelector } from 'react-redux';

import { combineReducers } from '@reduxjs/toolkit';

import {
    createTestCompositionRoot,
    renderHookWithStoreProvider,
    waitFor,
} from '@suite-common/test-utils';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { enhanceTransaction, hasUnresolvedInputs } from '@suite-common/wallet-utils';
import TrezorConnect, { type AccountTransaction } from '@trezor/connect';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import { useResolveTransactionInputs } from './useResolveTransactionInputs';
import { mockSetAccountAddMetadata } from '../../../mocks';
import { prepareAccountsReducer } from '../../accounts/accountsReducer';
import {
    accountWithUnresolvedInputs,
    getFullTransaction,
    getUnresolvedTransaction,
} from '../__fixtures__/unresolvedInputs';
import { prepareTransactionsReducer } from '../transactionsReducer';
import { selectAccountTransactions } from '../transactionsSelectors';
import { type ResolveTransactionInputsThunkState } from '../transactionsThunks';

const accountsReducer = prepareAccountsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    actions: { setAccountAddMetadata: mockSetAccountAddMetadata() },
    reducers: { storageLoadAccounts: mockReducer() },
});

const transactionsReducer = prepareTransactionsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadTransactions: mockReducer() },
});

const account = accountWithUnresolvedInputs;

const getStoredTransaction = (transaction: AccountTransaction) =>
    enhanceTransaction(transaction, account);

// Like a detail, the hook gets the transactions of the store in a new array on every render.
const useStoredTransactions = () => {
    const transactions = useSelector((state: ResolveTransactionInputsThunkState) =>
        selectAccountTransactions(state, account.key),
    );

    return useResolveTransactionInputs([...transactions]);
};

const renderResolveTransactionInputs = (transactions: WalletAccountTransaction[]) => {
    const { services } = createTestCompositionRoot<void, ResolveTransactionInputsThunkState>({
        reducer: {
            wallet: combineReducers({
                accounts: accountsReducer,
                transactions: transactionsReducer,
            }),
        },
        preloadedState: {
            wallet: {
                accounts: [account],
                transactions: {
                    transactions: { [account.key]: transactions },
                    phishing: {},
                    fetchStatusDetail: {},
                },
            },
        },
    });
    const getStoredTransactions = () =>
        selectAccountTransactions(services.store.getState(), account.key);

    return {
        ...renderHookWithStoreProvider(useStoredTransactions, { services }),
        getStoredTransactions,
    };
};

describe(useResolveTransactionInputs.name, () => {
    afterEach(() => jest.restoreAllMocks());

    it('resolves the inputs of a transaction and tells when they are being fetched', async () => {
        let respond = () => {};
        const getTransactions = jest
            .spyOn(TrezorConnect, 'blockchainGetTransactions')
            .mockImplementation(
                () =>
                    new Promise(resolve => {
                        respond = () => resolve({ success: true, payload: [getFullTransaction()] });
                    }),
            );
        const { result, getStoredTransactions } = renderResolveTransactionInputs([
            getStoredTransaction(getUnresolvedTransaction()),
        ]);

        expect(result.current).toEqual({ isResolving: true, hasFailed: false });

        respond();

        await waitFor(() => expect(result.current.isResolving).toBe(false));
        expect(result.current.hasFailed).toBe(false);
        expect(getStoredTransactions().some(hasUnresolvedInputs)).toBe(false);
        expect(getTransactions).toHaveBeenCalledTimes(1);
    });

    it('tells when the inputs could not be fetched and does not fetch them again', async () => {
        const getTransactions = jest
            .spyOn(TrezorConnect, 'blockchainGetTransactions')
            .mockResolvedValue({
                success: false,
                error: { message: 'Server error', code: 'Failure_UnknownCode' },
            });
        const { result, rerender } = renderResolveTransactionInputs([
            getStoredTransaction(getUnresolvedTransaction()),
        ]);

        await waitFor(() => expect(result.current.hasFailed).toBe(true));
        rerender(undefined);
        rerender(undefined);

        expect(result.current).toEqual({ isResolving: false, hasFailed: true });
        expect(getTransactions).toHaveBeenCalledTimes(1);
    });

    it('fetches nothing for transactions with all input values', () => {
        const getTransactions = jest.spyOn(TrezorConnect, 'blockchainGetTransactions');
        const { result } = renderResolveTransactionInputs([
            getStoredTransaction(getFullTransaction()),
        ]);

        expect(result.current).toEqual({ isResolving: false, hasFailed: false });
        expect(getTransactions).not.toHaveBeenCalled();
    });
});
