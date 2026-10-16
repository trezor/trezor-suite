import { combineReducers } from '@reduxjs/toolkit';

import {
    fetchCurrentFiatRates,
    fetchErc4626UnderlyingAsset,
    fetchLastWeekFiatRates,
    getFiatRatesForTimestamps,
} from '@suite-common/fiat-services';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type CryptoBaseCurrencyPair,
    type TickerId,
    type Timestamp,
    type TokenAddress,
} from '@suite-common/wallet-types';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import { fiatRatesApi } from './fiatRatesApi';
import { prepareFiatRatesReducer } from './fiatRatesReducer';
import {
    selectCurrentFiatRateByKey,
    selectHistoricFiatRates,
    selectLastWeekFiatRates,
} from './fiatRatesSelectors';
import { type FiatRatesRootState } from './fiatRatesTypes';
import { type BlockchainRootState, blockchainInitialState } from '../blockchain/blockchainReducer';

jest.mock('@suite-common/fiat-services', () => ({
    fetchCurrentFiatRates: jest.fn(),
    fetchLastWeekFiatRates: jest.fn(),
    fetchErc4626UnderlyingAsset: jest.fn(),
    getFiatRatesForTimestamps: jest.fn(),
}));

const USD = 'usd' as BaseCurrencyCode;
const EUR = 'eur' as BaseCurrencyCode;
const KNOWN_TOKEN = '0xdac17f958d2ee523a2206206994597c13d831ec7' as TokenAddress;
const UNKNOWN_TOKEN = '0x128cc466b61f542da60c70e3aa11c10e19b84edb' as TokenAddress;
const VAULT_TOKEN = '0xbeef69b8fea9a16fb98a661860f6d78d94e1b000' as TokenAddress;
const UNDERLYING_TOKEN = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
const TICKER_TIMESTAMP_IN_SECONDS = 1700000000 as Timestamp;

const BTC: TickerId = { symbol: asNetworkSymbol('btc') };

type State = FiatRatesRootState & BlockchainRootState & TokenDefinitionsRootState;

const fiatRatesReducer = prepareFiatRatesReducer({
    actionTypes: { storageLoad: '@suite/storage/load' },
    reducers: { storageLoadHistoricRates: state => state },
});

const stores: { dispatch: (action: ReturnType<typeof fiatRatesApi.util.resetApiState>) => void }[] =
    [];

afterEach(() => {
    // Clears the pending cache removal timers of RTK Query.
    stores.splice(0).forEach(store => store.dispatch(fiatRatesApi.util.resetApiState()));
});

const createStore = () =>
    createTestCompositionRoot<void, State>({
        reducer: combineReducers({
            [fiatRatesApi.reducerPath]: fiatRatesApi.reducer,
            wallet: combineReducers({
                blockchain: (state = blockchainInitialState) => state,
                fiat: fiatRatesReducer,
            }),
            tokenDefinitions: (state = {}) => state,
        }) as unknown as (state: State | undefined, action: { type: string }) => State,
        preloadedState: {
            tokenDefinitions: {
                eth: { coin: { data: [KNOWN_TOKEN], error: false, isLoading: false } },
            },
        },
        middleware: [fiatRatesApi.middleware],
    }).services.store;

const initStore = () => {
    const store = createStore();
    stores.push(store);

    return store;
};

describe('fiatRatesApi', () => {
    beforeEach(() => {
        jest.mocked(fetchCurrentFiatRates).mockResolvedValue({
            rate: 50000,
            usdRate: 60000,
            lastTickerTimestamp: TICKER_TIMESTAMP_IN_SECONDS,
        });
        jest.mocked(fetchLastWeekFiatRates).mockResolvedValue({
            rate: 45000,
            lastTickerTimestamp: TICKER_TIMESTAMP_IN_SECONDS,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getCurrentFiatRate', () => {
        it('stores the fetched rate with its ticker timestamp in milliseconds', async () => {
            const store = initStore();

            await store.dispatch(
                fiatRatesApi.endpoints.getCurrentFiatRate.initiate({
                    ticker: BTC,
                    baseCurrencyCode: USD,
                }),
            );

            expect(
                selectCurrentFiatRateByKey(store.getState(), 'btc-usd' as CryptoBaseCurrencyPair),
            ).toEqual(
                expect.objectContaining({
                    rate: 50000,
                    usdRate: 60000,
                    lastTickerTimestamp: TICKER_TIMESTAMP_IN_SECONDS * 1000,
                    isLoading: false,
                    error: null,
                    ticker: BTC,
                }),
            );
        });

        it('keeps one cache entry per ticker and currency regardless of the fetch flags', async () => {
            const store = initStore();

            await store.dispatch(
                fiatRatesApi.endpoints.getCurrentFiatRate.initiate({
                    ticker: BTC,
                    baseCurrencyCode: USD,
                }),
            );
            await store.dispatch(
                fiatRatesApi.endpoints.getCurrentFiatRate.initiate({
                    ticker: BTC,
                    baseCurrencyCode: USD,
                    skipCache: true,
                    forceFetchToken: true,
                }),
            );

            expect(fetchCurrentFiatRates).toHaveBeenCalledTimes(1);
            expect(Object.keys(store.getState().fiatRatesApi.queries)).toEqual([
                'getCurrentFiatRate(btc-usd)',
            ]);
        });

        it('fetches the rate again for another currency', async () => {
            const store = initStore();

            await store.dispatch(
                fiatRatesApi.endpoints.getCurrentFiatRate.initiate({
                    ticker: BTC,
                    baseCurrencyCode: USD,
                }),
            );
            await store.dispatch(
                fiatRatesApi.endpoints.getCurrentFiatRate.initiate({
                    ticker: BTC,
                    baseCurrencyCode: EUR,
                }),
            );

            expect(fetchCurrentFiatRates).toHaveBeenCalledTimes(2);
        });

        it('does not fetch a testnet rate', async () => {
            const store = initStore();

            const result = await store.dispatch(
                fiatRatesApi.endpoints.getCurrentFiatRate.initiate({
                    ticker: { symbol: asNetworkSymbol('test') },
                    baseCurrencyCode: USD,
                }),
            );

            expect(result.error).toBe('Testnet');
            expect(fetchCurrentFiatRates).not.toHaveBeenCalled();
        });

        it('does not fetch a token without a known definition unless forced', async () => {
            const store = initStore();
            const ticker = { symbol: asNetworkSymbol('eth'), tokenAddress: UNKNOWN_TOKEN };

            const result = await store.dispatch(
                fiatRatesApi.endpoints.getCurrentFiatRate.initiate({
                    ticker,
                    baseCurrencyCode: USD,
                }),
            );

            expect(result.error).toBe('Missing token definition');
            expect(fetchCurrentFiatRates).not.toHaveBeenCalled();

            await store.dispatch(
                fiatRatesApi.endpoints.getCurrentFiatRate.initiate({
                    ticker,
                    baseCurrencyCode: USD,
                    forceFetchToken: true,
                }),
            );

            expect(fetchCurrentFiatRates).toHaveBeenCalledTimes(1);
        });

        it('fetches a token with a known definition', async () => {
            const store = initStore();

            const result = await store.dispatch(
                fiatRatesApi.endpoints.getCurrentFiatRate.initiate({
                    ticker: { symbol: asNetworkSymbol('eth'), tokenAddress: KNOWN_TOKEN },
                    baseCurrencyCode: USD,
                }),
            );

            expect(result.data?.rate).toBe(50000);
        });

        it('derives an ERC4626 vault rate from its underlying asset', async () => {
            jest.mocked(fetchErc4626UnderlyingAsset).mockResolvedValue({
                contract: UNDERLYING_TOKEN,
                exchangeRate: new BigNumber(2),
            });
            const store = initStore();

            const result = await store.dispatch(
                fiatRatesApi.endpoints.getCurrentFiatRate.initiate({
                    ticker: {
                        symbol: asNetworkSymbol('eth'),
                        tokenAddress: VAULT_TOKEN,
                        protocols: ['erc4626'],
                    },
                    baseCurrencyCode: USD,
                    forceFetchToken: true,
                }),
            );

            expect(fetchCurrentFiatRates).toHaveBeenCalledWith(
                expect.objectContaining({
                    ticker: { symbol: 'eth', tokenAddress: UNDERLYING_TOKEN },
                }),
            );
            expect(result.data).toEqual({
                rate: 100000,
                usdRate: 120000,
                lastTickerTimestamp: TICKER_TIMESTAMP_IN_SECONDS * 1000,
            });
        });

        it('reports an error when no provider knows the rate', async () => {
            jest.mocked(fetchCurrentFiatRates).mockResolvedValue(null);
            const store = initStore();

            await store.dispatch(
                fiatRatesApi.endpoints.getCurrentFiatRate.initiate({
                    ticker: BTC,
                    baseCurrencyCode: USD,
                }),
            );

            const rate = selectCurrentFiatRateByKey(
                store.getState(),
                'btc-usd' as CryptoBaseCurrencyPair,
            );

            expect(rate?.rate).toBeUndefined();
            expect(rate).toEqual(
                expect.objectContaining({
                    isLoading: false,
                    error: 'Failed to fetch fiat rates btc, currency usd, token -',
                }),
            );
        });

        it('reports an error when the provider throws', async () => {
            jest.mocked(fetchCurrentFiatRates).mockRejectedValue(new Error('Network error'));
            const store = initStore();

            const result = await store.dispatch(
                fiatRatesApi.endpoints.getCurrentFiatRate.initiate({
                    ticker: BTC,
                    baseCurrencyCode: USD,
                }),
            );

            expect(result.error).toBe('Network error');
        });
    });

    describe('getLastWeekFiatRate', () => {
        it('stores the rate under the last week rates', async () => {
            const store = initStore();

            await store.dispatch(
                fiatRatesApi.endpoints.getLastWeekFiatRate.initiate({
                    ticker: BTC,
                    baseCurrencyCode: USD,
                }),
            );

            expect(selectLastWeekFiatRates(store.getState())).toEqual({
                'btc-usd': expect.objectContaining({ rate: 45000, ticker: BTC }),
            });
        });
    });

    describe('getHistoricFiatRates', () => {
        const HOUR_ALIGNED_TIMESTAMP = 1700002800 as Timestamp;

        beforeEach(() => {
            jest.mocked(getFiatRatesForTimestamps).mockImplementation((_ticker, timestamps) =>
                Promise.resolve({
                    ts: 0,
                    symbol: 'btc',
                    tickers: timestamps.map(ts => ({ ts, rates: { usd: 30000 } })),
                }),
            );
        });

        it('merges the fetched rates into the historic rates by rounded timestamp', async () => {
            const store = initStore();

            await store.dispatch(
                fiatRatesApi.endpoints.getHistoricFiatRates.initiate({
                    ticker: BTC,
                    baseCurrencyCode: USD,
                    timestamps: [(HOUR_ALIGNED_TIMESTAMP + 60) as Timestamp],
                }),
            );

            expect(getFiatRatesForTimestamps).toHaveBeenCalledWith(
                BTC,
                [HOUR_ALIGNED_TIMESTAMP],
                USD,
                false,
            );
            expect(selectHistoricFiatRates(store.getState())).toEqual({
                'btc-usd': { [HOUR_ALIGNED_TIMESTAMP]: 30000 },
            });
        });

        it('does not fetch historic rates of an ERC4626 token', async () => {
            const store = initStore();

            const result = await store.dispatch(
                fiatRatesApi.endpoints.getHistoricFiatRates.initiate({
                    ticker: {
                        symbol: asNetworkSymbol('eth'),
                        tokenAddress: VAULT_TOKEN,
                        protocols: ['erc4626'],
                    },
                    baseCurrencyCode: USD,
                    timestamps: [HOUR_ALIGNED_TIMESTAMP],
                }),
            );

            expect(result.data).toEqual({});
            expect(getFiatRatesForTimestamps).not.toHaveBeenCalled();
        });
    });
});
