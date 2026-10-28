import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook, waitFor } from '@testing-library/react';

import { QueryClient, QueryClientProvider } from '@suite-common/react-query';
import { type TransactionRetriever } from '@suite-common/wallet-core';
import { type AccountKey, type WalletAccountTransaction } from '@suite-common/wallet-types';
import { ServicesProvider } from '@trezor/dependency-injection';

import { useAccountsTransactions } from './useAccountsTransactions';

type WrapperProps = {
    children: ReactNode;
};

const ACCOUNT_KEY = 'account-key' as AccountKey;
const ACCOUNT_KEYS = [ACCOUNT_KEY];

const transaction = (txid: string, blockHeight: number) =>
    ({ txid, blockHeight, tokens: [] }) as unknown as WalletAccountTransaction;

const createWrapper = (transactionRetriever: TransactionRetriever) => {
    const store = configureStore({
        reducer: {
            wallet: () => ({
                accounts: [{ key: ACCOUNT_KEY, symbol: 'btc', history: { total: 100 } }],
                transactions: {
                    transactions: {
                        [ACCOUNT_KEY]: [
                            transaction('newer', 200),
                            transaction('older', 100),
                            transaction('oldest', 50),
                        ],
                    },
                    fetchStatusDetail: {},
                    phishing: {},
                },
            }),
        },
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    return ({ children }: WrapperProps) => (
        <QueryClientProvider client={queryClient}>
            <Provider store={store}>
                <ServicesProvider services={{ store, transactionRetriever }}>
                    {children}
                </ServicesProvider>
            </Provider>
        </QueryClientProvider>
    );
};

describe(useAccountsTransactions.name, () => {
    it('shows a full page while a transaction link loads the whole history', () => {
        const neverSettles = new Promise<never>(() => {});

        const { result } = renderHook(
            () =>
                useAccountsTransactions({
                    accountKeys: ACCOUNT_KEYS,
                    page: 1,
                    perPage: 2,
                    isAllRequested: true,
                }),
            {
                wrapper: createWrapper({
                    retrievePage: () => neverSettles,
                    retrieveAll: () => neverSettles,
                }),
            },
        );

        expect(result.current.isLoading).toBe(false);
        expect(result.current.transactions.map(({ txid }) => txid)).toEqual(['newer', 'older']);
    });

    it('stops loading and reports a page that failed to load, once its retry failed too', async () => {
        const onError = jest.fn();

        const { result } = renderHook(
            () =>
                useAccountsTransactions({
                    accountKeys: ACCOUNT_KEYS,
                    page: 1,
                    perPage: 25,
                    isAllRequested: false,
                    onError,
                }),
            {
                wrapper: createWrapper({
                    retrievePage: () => Promise.reject(new Error('backend down')),
                    retrieveAll: () => Promise.reject(new Error('backend down')),
                }),
            },
        );

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => expect(result.current.isFailed).toBe(true), { timeout: 3000 });

        expect(result.current.isLoading).toBe(false);
        expect(onError).toHaveBeenCalledTimes(1);
    });
});
