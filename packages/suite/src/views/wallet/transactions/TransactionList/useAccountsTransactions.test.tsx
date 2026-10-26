import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react';

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

describe(useAccountsTransactions.name, () => {
    it('shows a full page while a transaction link loads the whole history', () => {
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
        const neverSettles = new Promise<never>(() => {});
        const transactionRetriever: TransactionRetriever = {
            retrievePage: () => neverSettles,
            retrieveAll: () => neverSettles,
        };
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        const wrapper = ({ children }: WrapperProps) => (
            <QueryClientProvider client={queryClient}>
                <Provider store={store}>
                    <ServicesProvider services={{ store, transactionRetriever }}>
                        {children}
                    </ServicesProvider>
                </Provider>
            </QueryClientProvider>
        );

        const { result } = renderHook(
            () =>
                useAccountsTransactions({
                    accountKeys: ACCOUNT_KEYS,
                    page: 1,
                    perPage: 2,
                    isAllRequested: true,
                    isWaitingForAll: false,
                }),
            { wrapper },
        );

        expect(result.current.isLoading).toBe(false);
        expect(result.current.transactions.map(({ txid }) => txid)).toEqual(['newer', 'older']);
    });
});
