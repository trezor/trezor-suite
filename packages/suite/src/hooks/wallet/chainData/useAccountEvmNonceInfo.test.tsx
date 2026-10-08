import { type PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook, waitFor } from '@testing-library/react';

import { flagsInitialState } from '@suite/flags';
import { createStaticChainNetworksStore } from '@suite-common/chain-data/mocks/createStaticChainNetworksStore';
import { ServicesProvider } from '@suite-common/dependency-injection';
import { QueryClient, QueryClientProvider } from '@suite-common/react-query';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import type { AccountWithNetworkType, WalletAccountTransaction } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import TrezorConnect from '@trezor/connect';
import {
    type ChainNetwork,
    getChainSyncPolicy,
    getDisplayBalanceFiatValue,
} from '@trezor/network-module-suite-common-types';

import { useAccountEvmNonceInfo } from './useAccountEvmNonceInfo';

jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    __esModule: true,
    default: { getAccountInfo: jest.fn() },
}));

const account = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
}) as AccountWithNetworkType<'ethereum'>;

const ownTx = (nonce: number, blockHeight: number) =>
    ({
        txid: `tx-${nonce}`,
        type: 'sent',
        blockHeight,
        descriptor: account.descriptor,
        details: { vin: [{ n: 0, isAddress: true, isAccountOwned: true }] },
        ethereumSpecific: { status: blockHeight > 0 ? 1 : -1, nonce, gasLimit: 21000 },
    }) as unknown as WalletAccountTransaction;

const getAccountNonce = jest.fn<
    ReturnType<NonNullable<ChainNetwork['getAccountNonce']>>,
    Parameters<NonNullable<ChainNetwork['getAccountNonce']>>
>(() => Promise.resolve({ confirmedNonce: 7, nextNonce: 9, pendingNonces: [7, 8] }));

const createEthNetwork = (withNonce: boolean): ChainNetwork => ({
    symbol: asNetworkSymbol('eth'),
    backendType: 'blockbook',
    syncPolicy: getChainSyncPolicy(60_000),
    nativeAsset: { symbol: 'ETH', name: 'Ethereum' },
    getAccountBalance: () =>
        Promise.resolve({ balance: '1', availableBalance: '1', displayBalance: '1', empty: false }),
    getNativeFiatRate: () => Promise.resolve(null),
    getAccountFiatBalance: getDisplayBalanceFiatValue,
    getHistoricFiatRates: () => Promise.resolve({}),
    ...(withNonce ? { getAccountNonce } : {}),
});

const createWrapper = ({ queryChainData = true, withNonce = true } = {}) => {
    const store = configureStore({
        reducer: {
            flags: () => ({ ...flagsInitialState, queryChainData }),
            wallet: () => ({
                transactions: {
                    transactions: { [account.key]: [ownTx(6, 0)] },
                    fetchStatusDetail: {},
                    phishing: {},
                },
            }),
        },
    });
    const services = {
        store,
        chainNetworksStore: createStaticChainNetworksStore([createEthNetwork(withNonce)]),
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

describe(useAccountEvmNonceInfo.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(TrezorConnect.getAccountInfo).mockResolvedValue({
            success: true,
            payload: { misc: { confirmedNonce: '6' } },
        } as never);
    });

    it('reads the nonce through the account’s chain network while the flag is on', async () => {
        const transactions = [ownTx(5, 100), ownTx(6, 0)];
        const { result } = renderHook(() => useAccountEvmNonceInfo(account, { transactions }), {
            wrapper: createWrapper(),
        });

        await waitFor(() =>
            expect(result.current.nonceInfo).toEqual({
                confirmedNonce: 7,
                nextNonce: 9,
                pendingNonces: [7, 8],
                // Only a mined transaction listed in the shown history corroborates a superseded nonce.
                confirmedNonces: [5],
            }),
        );
        expect(result.current.isQueryOwned).toBe(true);
        expect(getAccountNonce).toHaveBeenCalledWith(
            expect.objectContaining({
                ref: expect.objectContaining({
                    descriptor: account.descriptor,
                    connectionIdentity: account.deviceState,
                }),
            }),
        );
        expect(TrezorConnect.getAccountInfo).not.toHaveBeenCalled();
    });

    it('reads nothing until the caller needs the nonce', () => {
        const { result } = renderHook(() => useAccountEvmNonceInfo(account, { enabled: false }), {
            wrapper: createWrapper(),
        });

        expect(result.current).toEqual({
            nonceInfo: undefined,
            isLoading: false,
            isQueryOwned: true,
        });
        expect(getAccountNonce).not.toHaveBeenCalled();
    });

    it('reads the nonce as the wallet always did while the flag is off', async () => {
        const { result } = renderHook(() => useAccountEvmNonceInfo(account), {
            wrapper: createWrapper({ queryChainData: false }),
        });

        await waitFor(() =>
            expect(result.current.nonceInfo).toMatchObject({ confirmedNonce: 6, nextNonce: 7 }),
        );
        expect(result.current.isQueryOwned).toBe(false);
        expect(getAccountNonce).not.toHaveBeenCalled();
    });

    it('leaves the store to each transaction when the list asks for no fallback', () => {
        const { result } = renderHook(
            () => useAccountEvmNonceInfo(account, { withStoreFallback: false }),
            { wrapper: createWrapper({ queryChainData: false }) },
        );

        expect(result.current).toEqual({
            nonceInfo: undefined,
            isLoading: false,
            isQueryOwned: false,
        });
        expect(TrezorConnect.getAccountInfo).not.toHaveBeenCalled();
    });

    it('reads the nonce as the wallet always did where the network resolves none', async () => {
        const { result } = renderHook(() => useAccountEvmNonceInfo(account), {
            wrapper: createWrapper({ withNonce: false }),
        });

        await waitFor(() =>
            expect(result.current.nonceInfo).toMatchObject({ confirmedNonce: 6, nextNonce: 7 }),
        );
        expect(result.current.isQueryOwned).toBe(false);
    });
});
