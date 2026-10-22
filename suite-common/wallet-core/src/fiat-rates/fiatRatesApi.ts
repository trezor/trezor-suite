import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

import {
    type TokenDefinitionsRootState,
    selectIsSpecificCoinDefinitionKnown,
} from '@suite-common/token-definitions';
import { getNetworkFeatures } from '@suite-common/wallet-config';
import {
    type CryptoBaseCurrencyPair,
    type CurrentFiatRatesResult,
    type FiatRatesResult,
    type RateTypeWithoutHistoric,
    type TickerId,
    type Timestamp,
    asCryptoBaseCurrencyCode,
} from '@suite-common/wallet-types';
import { getFiatRateKeyFromTicker, isTestnet } from '@suite-common/wallet-utils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { exhaustive } from '@trezor/type-utils';

import { createConcurrencyLimiter } from './fiatRatesConcurrencyLimiter';
import { FIAT_RATES_FETCH_CONCURRENCY, MAX_AGE, REFETCH_INTERVAL } from './fiatRatesConstants';
import {
    fetchCurrentTickerFiatRate,
    fetchLastWeekTickerFiatRate,
    fetchTickerHistoricFiatRates,
} from './fiatRatesFetch';
import { type BlockchainRootState } from '../blockchain/blockchainReducer';
import {
    selectActiveBackendType,
    selectIsElectrumBackendSelected,
} from '../blockchain/blockchainSelectors';

export type FiatRateQueryArgs = {
    ticker: TickerId;
    baseCurrencyCode: BaseCurrencyCode;
    /** Fetch a token rate even when the token has no known coin definition. */
    forceFetchToken?: boolean;
    /** Ask the provider to bypass its own cache. */
    skipCache?: boolean;
};

export type HistoricFiatRatesQueryArgs = {
    ticker: TickerId;
    baseCurrencyCode: BaseCurrencyCode;
    /** Unix timestamps in seconds, e.g. transaction block times. */
    timestamps: Timestamp[];
};

export type HistoricFiatRatesResult = Record<Timestamp, number>;

export type FiatRatesApiQueryState = BlockchainRootState & TokenDefinitionsRootState;

const ONE_SECOND_IN_MS = 1000;

const limitConcurrency = createConcurrencyLimiter(FIAT_RATES_FETCH_CONCURRENCY);

const toErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

const getUnfetchableTickerReason = (
    state: FiatRatesApiQueryState,
    ticker: TickerId,
    forceFetchToken: boolean,
): string | null => {
    if (isTestnet(ticker.symbol)) {
        return 'Testnet';
    }

    const hasCoinDefinitions = getNetworkFeatures(ticker.symbol).includes('coin-definitions');
    if (
        ticker.tokenAddress &&
        hasCoinDefinitions &&
        !forceFetchToken &&
        !selectIsSpecificCoinDefinitionKnown(state, ticker.symbol, ticker.tokenAddress)
    ) {
        return 'Missing token definition';
    }

    return null;
};

const getFailedFetchMessage = (ticker: TickerId, baseCurrencyCode: BaseCurrencyCode) =>
    `Failed to fetch fiat rates ${ticker.symbol}, currency ${baseCurrencyCode}, token ${ticker.tokenAddress ?? '-'}`;

export const getHistoricFiatRatesQueryKey = ({
    ticker,
    baseCurrencyCode,
    timestamps,
}: HistoricFiatRatesQueryArgs) =>
    `${getFiatRateKeyFromTicker(ticker, baseCurrencyCode)},${timestamps.toSorted((a, b) => a - b).join(',')}`;

export type FiatRateEndpointName = 'getCurrentFiatRate' | 'getLastWeekFiatRate';

/**
 * The cache key of a current or last week rate wraps its fiat rate key, so that rates can be looked
 * up by it without knowing the arguments of the request.
 */
export const getFiatRateQueryCacheKey = (
    endpointName: FiatRateEndpointName,
    fiatRateKey: CryptoBaseCurrencyPair,
) => `${endpointName}(${fiatRateKey})`;

export const getFiatRateKeyFromQueryCacheKey = (
    endpointName: FiatRateEndpointName,
    queryCacheKey: string,
) => asCryptoBaseCurrencyCode(queryCacheKey.slice(endpointName.length + 1, -1));

const serializeTickerQueryArgs = ({
    endpointName,
    queryArgs,
}: {
    endpointName: string;
    queryArgs: FiatRateQueryArgs;
}) =>
    getFiatRateQueryCacheKey(
        endpointName as FiatRateEndpointName,
        getFiatRateKeyFromTicker(queryArgs.ticker, queryArgs.baseCurrencyCode),
    );

export const fiatRatesApi = createApi({
    reducerPath: 'fiatRatesApi',
    baseQuery: fakeBaseQuery<string>(),
    // Rates that failed while offline are fetched again as soon as the connection is back.
    refetchOnReconnect: true,
    endpoints: builder => ({
        getCurrentFiatRate: builder.query<CurrentFiatRatesResult, FiatRateQueryArgs>({
            queryFn: async (
                { ticker, baseCurrencyCode, forceFetchToken = false, skipCache = false },
                api,
            ) => {
                const state = api.getState() as FiatRatesApiQueryState;
                const unfetchableReason = getUnfetchableTickerReason(
                    state,
                    ticker,
                    forceFetchToken,
                );
                if (unfetchableReason) {
                    return { error: unfetchableReason };
                }

                try {
                    const rate = await limitConcurrency(() =>
                        fetchCurrentTickerFiatRate({
                            ticker,
                            baseCurrencyCode,
                            backendType: selectActiveBackendType(state, ticker.symbol),
                            skipCache,
                        }),
                    );

                    return rate
                        ? { data: rate }
                        : { error: getFailedFetchMessage(ticker, baseCurrencyCode) };
                } catch (error) {
                    return { error: toErrorMessage(error) };
                }
            },
            serializeQueryArgs: serializeTickerQueryArgs,
            keepUnusedDataFor: MAX_AGE.current / ONE_SECOND_IN_MS,
        }),
        getLastWeekFiatRate: builder.query<FiatRatesResult, FiatRateQueryArgs>({
            queryFn: async ({ ticker, baseCurrencyCode, forceFetchToken = false }, api) => {
                const state = api.getState() as FiatRatesApiQueryState;
                const unfetchableReason = getUnfetchableTickerReason(
                    state,
                    ticker,
                    forceFetchToken,
                );
                if (unfetchableReason) {
                    return { error: unfetchableReason };
                }

                try {
                    const rate = await limitConcurrency(() =>
                        fetchLastWeekTickerFiatRate({
                            ticker,
                            baseCurrencyCode,
                            backendType: selectActiveBackendType(state, ticker.symbol),
                            skipCache: false,
                        }),
                    );

                    return rate
                        ? { data: rate }
                        : { error: getFailedFetchMessage(ticker, baseCurrencyCode) };
                } catch (error) {
                    return { error: toErrorMessage(error) };
                }
            },
            serializeQueryArgs: serializeTickerQueryArgs,
            keepUnusedDataFor: MAX_AGE.lastWeek / ONE_SECOND_IN_MS,
        }),
        getHistoricFiatRates: builder.query<HistoricFiatRatesResult, HistoricFiatRatesQueryArgs>({
            queryFn: async ({ ticker, baseCurrencyCode, timestamps }, api) => {
                const state = api.getState() as FiatRatesApiQueryState;
                // Historical ERC4626 rates cannot be calculated without historical share-to-asset ratios.
                const isErc4626Token = !!ticker.protocols?.includes('erc4626');
                const unfetchableReason = getUnfetchableTickerReason(state, ticker, false);
                if (unfetchableReason || isErc4626Token || timestamps.length === 0) {
                    return { data: {} };
                }

                try {
                    const rates = await limitConcurrency(() =>
                        fetchTickerHistoricFiatRates({
                            ticker,
                            baseCurrencyCode,
                            timestamps,
                            isElectrumBackend: selectIsElectrumBackendSelected(
                                state,
                                ticker.symbol,
                            ),
                        }),
                    );

                    return rates
                        ? { data: rates }
                        : { error: getFailedFetchMessage(ticker, baseCurrencyCode) };
                } catch (error) {
                    return { error: toErrorMessage(error) };
                }
            },
            serializeQueryArgs: ({ endpointName, queryArgs }) =>
                `${endpointName}(${getHistoricFiatRatesQueryKey(queryArgs)})`,
            keepUnusedDataFor: 0,
        }),
    }),
});

export type FiatRatesApiRootState = {
    [fiatRatesApi.reducerPath]: ReturnType<typeof fiatRatesApi.reducer>;
};

export type FiatRateEndpoint =
    | typeof fiatRatesApi.endpoints.getCurrentFiatRate
    | typeof fiatRatesApi.endpoints.getLastWeekFiatRate;

export const getFiatRateEndpointName = (rateType: RateTypeWithoutHistoric) => {
    switch (rateType) {
        case 'current':
            return 'getCurrentFiatRate' as const;
        case 'lastWeek':
            return 'getLastWeekFiatRate' as const;
        default:
            return exhaustive(rateType);
    }
};

export const getFiatRateEndpoint = (rateType: RateTypeWithoutHistoric): FiatRateEndpoint =>
    fiatRatesApi.endpoints[getFiatRateEndpointName(rateType)];

/**
 * Polling subscriptions refetch their rates while the app is focused. The others only keep the
 * cached rates alive, an interval of 0 turns polling off.
 */
export const getFiatRateSubscriptionOptions = (
    rateType: RateTypeWithoutHistoric,
    isPolling = true,
) => ({
    pollingInterval: isPolling ? REFETCH_INTERVAL[rateType] : 0,
    skipPollingIfUnfocused: true,
});

/**
 * Age in seconds after which a cached rate is refetched when a new subscriber mounts.
 */
export const getFiatRateMaxAgeInSeconds = (rateType: RateTypeWithoutHistoric) =>
    MAX_AGE[rateType] / ONE_SECOND_IN_MS;
