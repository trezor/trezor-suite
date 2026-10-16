import { QueryStatus } from '@reduxjs/toolkit/query';

import {
    type CryptoBaseCurrencyPair,
    type Rate,
    type RatesByKey,
} from '@suite-common/wallet-types';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import {
    type FiatRateEndpointName,
    type FiatRatesApiRootState,
    fiatRatesApi,
    getFiatRateQueryCacheKey,
} from '../src/fiat-rates/fiatRatesApi';

type FiatRatesApiState = FiatRatesApiRootState['fiatRatesApi'];
type FiatRatesApiQueries = FiatRatesApiState['queries'];

type MockFiatRatesApiStateParams = {
    current?: Partial<RatesByKey>;
    lastWeek?: Partial<RatesByKey>;
};

const getBaseCurrencyCode = (fiatRateKey: CryptoBaseCurrencyPair) =>
    fiatRateKey.slice(fiatRateKey.lastIndexOf('-') + 1) as BaseCurrencyCode;

const getStatus = (rate: Rate) => {
    if (rate.isLoading) return QueryStatus.pending;
    if (rate.error) return QueryStatus.rejected;

    return QueryStatus.fulfilled;
};

const mockQueries = (
    endpointName: FiatRateEndpointName,
    ratesByKey: Partial<RatesByKey>,
): FiatRatesApiQueries =>
    Object.fromEntries(
        Object.entries(ratesByKey).flatMap(([key, rate]) => {
            if (!rate) return [];

            const fiatRateKey = key as CryptoBaseCurrencyPair;
            const queryCacheKey = getFiatRateQueryCacheKey(endpointName, fiatRateKey);
            const { rate: rateValue, lastTickerTimestamp } = rate;
            const usdRate = 'usdRate' in rate ? rate.usdRate : undefined;

            return [
                [
                    queryCacheKey,
                    {
                        endpointName,
                        requestId: queryCacheKey,
                        startedTimeStamp: rate.lastSuccessfulFetchTimestamp,
                        fulfilledTimeStamp: rate.lastSuccessfulFetchTimestamp,
                        status: getStatus(rate),
                        error: rate.error ?? undefined,
                        originalArgs: {
                            ticker: rate.ticker,
                            baseCurrencyCode: getBaseCurrencyCode(fiatRateKey),
                        },
                        data: {
                            ...(rateValue === undefined ? {} : { rate: rateValue }),
                            ...(usdRate === undefined ? {} : { usdRate }),
                            lastTickerTimestamp,
                        },
                    },
                ],
            ];
        }),
    ) as unknown as FiatRatesApiQueries;

/**
 * Builds the RTK Query cache of fiat rates, so that tests can describe rates the way the fiat rate
 * selectors return them.
 */
export const mockFiatRatesApiState = ({
    current = {},
    lastWeek = {},
}: MockFiatRatesApiStateParams = {}): FiatRatesApiState => {
    const initialState = fiatRatesApi.reducer(undefined, { type: 'mockFiatRatesApiState' });

    return {
        ...initialState,
        queries: {
            ...mockQueries('getCurrentFiatRate', current),
            ...mockQueries('getLastWeekFiatRate', lastWeek),
        },
    };
};
