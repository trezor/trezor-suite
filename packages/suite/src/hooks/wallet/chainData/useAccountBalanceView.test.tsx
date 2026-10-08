import { type PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook, waitFor } from '@testing-library/react';

import { flagsInitialState } from '@suite/flags';
import { type ChainNetworksStoreDep } from '@suite-common/chain-data';
import { createStaticChainNetworksStore } from '@suite-common/chain-data/mocks/createStaticChainNetworksStore';
import { ServicesProvider } from '@suite-common/dependency-injection';
import { QueryClient, QueryClientProvider } from '@suite-common/react-query';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import {
    type ChainNetwork,
    getChainSyncPolicy,
    getDisplayBalanceFiatValue,
} from '@trezor/network-module-suite-common-types';

import { useAccountBalanceView } from './useAccountBalanceView';

const getAccountBalance = jest.fn();
const getNativeFiatRate = jest.fn();

const btcNetwork: ChainNetwork = {
    symbol: asNetworkSymbol('btc'),
    backendType: 'blockbook',
    syncPolicy: getChainSyncPolicy(60_000),
    nativeAsset: { symbol: 'BTC', name: 'Bitcoin' },
    getAccountBalance,
    getNativeFiatRate,
    getAccountFiatBalance: getDisplayBalanceFiatValue,
    getHistoricFiatRates: jest.fn(),
};

const account = mockWalletAccount({
    symbol: asNetworkSymbol('btc'),
    descriptor: asAccountDescriptor('zpub'),
    balance: '50000000',
    availableBalance: '50000000',
    formattedBalance: '0.5',
});

const renderBalanceView = (queryChainData: boolean, networks: readonly ChainNetwork[]) => {
    const store = configureStore({
        reducer: {
            flags: () => ({ ...flagsInitialState, queryChainData }),
            wallet: () => ({ settings: { localCurrency: 'usd' }, stellarContractTokens: {} }),
        },
    });
    const services: ChainNetworksStoreDep = {
        chainNetworksStore: createStaticChainNetworksStore(networks),
    };
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    return renderHook(() => useAccountBalanceView(account), {
        wrapper: ({ children }: PropsWithChildren) => (
            <Provider store={store}>
                <ServicesProvider services={services}>
                    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
                </ServicesProvider>
            </Provider>
        ),
    });
};

describe(useAccountBalanceView.name, () => {
    beforeEach(() => {
        jest.resetAllMocks();
        getAccountBalance.mockResolvedValue({
            balance: '2',
            availableBalance: '2',
            displayBalance: '2',
            empty: false,
        });
        getNativeFiatRate.mockResolvedValue({ rate: 50000, timestamp: 1 });
    });

    it('answers what Redux holds and fetches nothing while the flag is off', () => {
        const { result } = renderBalanceView(false, [btcNetwork]);

        expect(result.current).toEqual({ formattedBalance: '0.5', isFiatLoading: false });
        expect(getAccountBalance).not.toHaveBeenCalled();
        expect(getNativeFiatRate).not.toHaveBeenCalled();
    });

    it('answers what Redux holds for a network that is not migrated', () => {
        const { result } = renderBalanceView(true, []);

        expect(result.current).toEqual({ formattedBalance: '0.5', isFiatLoading: false });
        expect(getAccountBalance).not.toHaveBeenCalled();
    });

    it('reads the balance and its value from the chain network while the flag is on', async () => {
        const { result } = renderBalanceView(true, [btcNetwork]);

        // The last known balance shows until the first fetch lands.
        expect(result.current).toMatchObject({ formattedBalance: '0.5', isFiatLoading: true });

        await waitFor(() => expect(result.current.isFiatLoading).toBe(false));

        expect(result.current.formattedBalance).toBe('2');
        expect(result.current.fiatValue?.toFixed()).toBe('100000');
        expect(getAccountBalance).toHaveBeenCalledTimes(1);
    });
});
