/**
 * @jest-environment jsdom
 */
import { combineReducers } from '@reduxjs/toolkit';

import { fetchCurrentFiatRates } from '@suite-common/fiat-services';
import {
    cleanup,
    createTestCompositionRoot,
    renderHookWithStoreProvider,
    waitFor,
} from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type TickerId, type Timestamp } from '@suite-common/wallet-types';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { useFiatRate } from './useFiatRate';
import { useFiatRates } from './useFiatRates';
import { blockchainInitialState } from '../../blockchain/blockchainReducer';
import { initialWalletSettingsState } from '../../settings/walletSettingsReducer';
import { type FiatRatesApiQueryState, fiatRatesApi } from '../fiatRatesApi';
import { selectCurrentFiatRates } from '../fiatRatesSelectors';
import { type FiatRatesRootState } from '../fiatRatesTypes';

jest.mock('@suite-common/fiat-services', () => ({
    fetchCurrentFiatRates: jest.fn(),
    fetchLastWeekFiatRates: jest.fn(),
    fetchErc4626UnderlyingAsset: jest.fn(),
    getFiatRatesForTimestamps: jest.fn(),
}));

const USD = 'usd' as BaseCurrencyCode;
const EUR = 'eur' as BaseCurrencyCode;
const BTC: TickerId = { symbol: asNetworkSymbol('btc') };
const LTC: TickerId = { symbol: asNetworkSymbol('ltc') };
const TESTNET: TickerId = { symbol: asNetworkSymbol('test') };

type State = FiatRatesRootState & FiatRatesApiQueryState;

const createServices = () =>
    createTestCompositionRoot<void, State>({
        reducer: combineReducers({
            [fiatRatesApi.reducerPath]: fiatRatesApi.reducer,
            wallet: combineReducers({
                blockchain: (state = blockchainInitialState) => state,
                fiat: (state = { historic: {} }) => state,
                settings: (state = { ...initialWalletSettingsState, localCurrency: USD }) => state,
            }),
            tokenDefinitions: (state = {}) => state,
        }) as unknown as (state: State | undefined, action: { type: string }) => State,
        middleware: [fiatRatesApi.middleware],
    }).services;

const getFetchedTickers = () =>
    jest.mocked(fetchCurrentFiatRates).mock.calls.map(([{ ticker, localCurrency }]) => ({
        symbol: ticker.symbol,
        localCurrency,
    }));

describe('useFiatRates', () => {
    let services: ReturnType<typeof createServices>;

    beforeEach(() => {
        jest.mocked(fetchCurrentFiatRates).mockResolvedValue({
            rate: 1,
            usdRate: 1,
            lastTickerTimestamp: 1700000000 as Timestamp,
        });
        services = createServices();
    });

    afterEach(() => {
        // Unmount first, so that mounted hooks do not refetch the reset cache.
        cleanup();
        services.store.dispatch(fiatRatesApi.util.resetApiState());
        jest.clearAllMocks();
    });

    it('fetches the rate of every ticker of the list once', async () => {
        const { rerender } = renderHookWithStoreProvider(
            ({ tickers }: { tickers: TickerId[] }) => useFiatRates({ tickers }),
            { services, initialProps: { tickers: [BTC, LTC] } },
        );
        rerender({ tickers: [{ ...BTC }, { ...LTC }] });

        await waitFor(() =>
            expect(Object.keys(selectCurrentFiatRates(services.store.getState()))).toEqual([
                'btc-usd',
                'ltc-usd',
            ]),
        );
        expect(getFetchedTickers()).toEqual([
            { symbol: 'btc', localCurrency: USD },
            { symbol: 'ltc', localCurrency: USD },
        ]);
    });

    it('fetches only an added ticker when the list grows', async () => {
        const { rerender } = renderHookWithStoreProvider(
            ({ tickers }: { tickers: TickerId[] }) => useFiatRates({ tickers }),
            { services, initialProps: { tickers: [BTC] } },
        );
        await waitFor(() => expect(fetchCurrentFiatRates).toHaveBeenCalledTimes(1));

        rerender({ tickers: [BTC, LTC] });

        await waitFor(() => expect(fetchCurrentFiatRates).toHaveBeenCalledTimes(2));
        expect(getFetchedTickers()[1]).toEqual({ symbol: 'ltc', localCurrency: USD });
    });

    it('fetches the rates again for another currency', async () => {
        const { rerender } = renderHookWithStoreProvider(
            ({ baseCurrencyCode }: { baseCurrencyCode: BaseCurrencyCode }) =>
                useFiatRates({ tickers: [BTC], baseCurrencyCode }),
            { services, initialProps: { baseCurrencyCode: USD } },
        );
        await waitFor(() => expect(fetchCurrentFiatRates).toHaveBeenCalledTimes(1));

        rerender({ baseCurrencyCode: EUR });

        await waitFor(() => expect(fetchCurrentFiatRates).toHaveBeenCalledTimes(2));
        expect(getFetchedTickers()[1]).toEqual({ symbol: 'btc', localCurrency: EUR });
    });

    it('does not fetch testnet rates', async () => {
        renderHookWithStoreProvider(() => useFiatRates({ tickers: [TESTNET, BTC] }), {
            services,
        });

        await waitFor(() => expect(fetchCurrentFiatRates).toHaveBeenCalledTimes(1));
        expect(getFetchedTickers()).toEqual([{ symbol: 'btc', localCurrency: USD }]);
    });
});

describe('useFiatRate', () => {
    let services: ReturnType<typeof createServices>;

    beforeEach(() => {
        jest.mocked(fetchCurrentFiatRates).mockResolvedValue({
            rate: 42,
            usdRate: 42,
            lastTickerTimestamp: 1700000000 as Timestamp,
        });
        services = createServices();
    });

    afterEach(() => {
        // Unmount first, so that mounted hooks do not refetch the reset cache.
        cleanup();
        services.store.dispatch(fiatRatesApi.util.resetApiState());
        jest.clearAllMocks();
    });

    it('returns the fetched rate in the base currency of the settings', async () => {
        const { result } = renderHookWithStoreProvider(() => useFiatRate({ ticker: BTC }), {
            services,
        });

        await waitFor(() => expect(result.current.data?.rate).toBe(42));
        expect(getFetchedTickers()).toEqual([{ symbol: 'btc', localCurrency: USD }]);
    });

    it('does not fetch without a ticker', () => {
        renderHookWithStoreProvider(() => useFiatRate({ ticker: undefined }), { services });

        expect(fetchCurrentFiatRates).not.toHaveBeenCalled();
    });
});
