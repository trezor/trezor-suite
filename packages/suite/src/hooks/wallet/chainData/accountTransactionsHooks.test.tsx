import { type PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';

import { flagsInitialState } from '@suite/flags';
import { ServicesProvider, asGetter } from '@suite-common/dependency-injection';
import { QueryClient, QueryClientProvider } from '@suite-common/react-query';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type WalletAccountTransaction, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import type { Transaction } from '@trezor/blockchain-link-types';
import {
    type ChainNetwork,
    getChainSyncPolicy,
    getDisplayBalanceFiatValue,
} from '@trezor/network-module-suite-common-types';

import { useAccountTransaction } from './useAccountTransaction';
import { useAccountTransactionsSource } from './useAccountTransactionsSource';

const account = mockWalletAccount({
    symbol: asNetworkSymbol('btc'),
    descriptor: asAccountDescriptor('zpub'),
});

const tx = (txid: string, blockHeight = 100): Transaction =>
    ({
        txid,
        blockHeight,
        blockTime: 1_700_000_000,
        type: 'recv',
        amount: '1',
        fee: '0',
        targets: [],
        tokens: [],
        internalTransfers: [],
        details: { vin: [], vout: [], size: 0, totalInput: '0', totalOutput: '0' },
    }) as unknown as Transaction;

const getTransactions = jest.fn<
    ReturnType<NonNullable<ChainNetwork['getTransactions']>>,
    Parameters<NonNullable<ChainNetwork['getTransactions']>>
>(({ cursor }) =>
    Promise.resolve(
        cursor.page === 1
            ? { transactions: [tx('a'), tx('b')], nextCursor: { page: 2 }, total: 3 }
            : { transactions: [tx('c')], nextCursor: null, total: 3 },
    ),
);

const btcNetwork: ChainNetwork = {
    symbol: asNetworkSymbol('btc'),
    backendType: 'blockbook',
    syncPolicy: getChainSyncPolicy(60_000),
    nativeAsset: { symbol: 'BTC', name: 'Bitcoin' },
    getAccountBalance: () =>
        Promise.resolve({ balance: '1', availableBalance: '1', displayBalance: '1', empty: false }),
    getNativeFiatRate: () => Promise.resolve(null),
    getAccountFiatBalance: getDisplayBalanceFiatValue,
    getHistoricFiatRates: () => Promise.resolve({}),
    getTransactions,
};

const justSent = {
    ...tx('sent', 0),
    descriptor: account.descriptor,
    deviceState: account.deviceState,
    symbol: account.symbol,
    deadline: 200,
} as WalletAccountTransaction;

const createWrapper = (queryChainData: boolean) => {
    const store = configureStore({
        reducer: {
            flags: () => ({ ...flagsInitialState, queryChainData }),
            wallet: () => ({
                settings: { localCurrency: 'usd' },
                stellarContractTokens: {},
                phishing: { dustPhishing: { isEnabled: false, dustThreshold: 1 } },
                fiat: { historic: { 'btc-usd': { 1: 1 } } },
                transactions: {
                    transactions: { [account.key]: [justSent, tx('stored')] },
                    fetchStatusDetail: {},
                    phishing: {},
                },
            }),
        },
    });
    const services = {
        store,
        getSelectedChainNetworks: asGetter(() => [btcNetwork]),
    };
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    return ({ children }: PropsWithChildren) => (
        <Provider store={store}>
            <ServicesProvider services={services}>
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
            </ServicesProvider>
        </Provider>
    );
};

describe(useAccountTransactionsSource.name, () => {
    beforeEach(() => {
        getTransactions.mockClear();
    });

    it('reads the store and loads nothing while the flag is off', () => {
        const { result } = renderHook(() => useAccountTransactionsSource(account), {
            wrapper: createWrapper(false),
        });

        expect(result.current.isQueryOwned).toBe(false);
        expect(result.current.transactions.map(({ txid }) => txid)).toEqual(['sent', 'stored']);
        expect(result.current.historicRates).toEqual({ 'btc-usd': { 1: 1 } });
        expect(getTransactions).not.toHaveBeenCalled();
    });

    it('reads the history through the chain network while the flag is on', async () => {
        const { result } = renderHook(() => useAccountTransactionsSource(account), {
            wrapper: createWrapper(true),
        });

        await waitFor(() => expect(result.current.transactions).toHaveLength(3));

        // The transaction the wallet just sent stays on top until the backend lists it.
        expect(result.current.transactions.map(({ txid }) => txid)).toEqual(['sent', 'a', 'b']);
        expect(result.current.transactions[1]).toMatchObject({
            descriptor: 'zpub',
            symbol: 'btc',
            deviceState: account.deviceState,
        });
        expect(result.current).toMatchObject({ isQueryOwned: true, total: 3, areAllLoaded: false });
    });

    it('loads pages in order up to the requested one', async () => {
        const { result } = renderHook(() => useAccountTransactionsSource(account), {
            wrapper: createWrapper(true),
        });
        await waitFor(() => expect(result.current.transactions).toHaveLength(3));

        await act(() => result.current.fetchPage(2, 2));

        await waitFor(() => expect(result.current.areAllLoaded).toBe(true));
        expect(result.current.transactions.map(({ txid }) => txid)).toEqual([
            'sent',
            'a',
            'b',
            'c',
        ]);
        expect(getTransactions.mock.calls.map(([params]) => params.cursor)).toEqual([
            { page: 1 },
            { page: 2 },
        ]);
    });
});

describe(useAccountTransaction.name, () => {
    it('finds a transaction in the store while the flag is off', () => {
        const { result } = renderHook(() => useAccountTransaction(account, 'stored'), {
            wrapper: createWrapper(false),
        });

        expect(result.current.transaction?.txid).toBe('stored');
        expect(result.current.historicRates).toBeNull();
    });

    it('finds a transaction in the loaded history while the flag is on', async () => {
        const { result } = renderHook(() => useAccountTransaction(account, 'b'), {
            wrapper: createWrapper(true),
        });

        await waitFor(() => expect(result.current.transaction?.txid).toBe('b'));
        expect(result.current.transaction).toMatchObject({ symbol: 'btc', descriptor: 'zpub' });
        expect(result.current.historicRates).not.toBeNull();
        expect(result.current.pendingTransactions[account.key]?.map(({ txid }) => txid)).toEqual([
            'sent',
        ]);
    });

    it('falls back to the store for a transaction the wallet just sent', async () => {
        const { result } = renderHook(() => useAccountTransaction(account, 'sent'), {
            wrapper: createWrapper(true),
        });

        await waitFor(() => expect(getTransactions).toHaveBeenCalled());
        expect(result.current.transaction?.txid).toBe('sent');
    });
});
