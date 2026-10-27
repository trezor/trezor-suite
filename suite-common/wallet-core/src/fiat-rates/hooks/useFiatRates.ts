import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';

import { type RateTypeWithoutHistoric, type TickerId } from '@suite-common/wallet-types';
import { getFiatRateKeyFromTicker, isTestnet } from '@suite-common/wallet-utils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { selectBaseCurrency } from '../../settings/walletSettingsReducer';
import {
    type FiatRatesApiRootState,
    getFiatRateEndpoint,
    getFiatRateEndpointName,
    getFiatRateMaxAgeInSeconds,
    getFiatRateQueryCacheKey,
    getFiatRateSubscriptionOptions,
} from '../fiatRatesApi';
import {
    selectIsSomeFiatRateQueryFetching,
    selectIsSomeFiatRateQueryLoading,
} from '../fiatRatesSelectors';

type FiatRateSubscription = { unsubscribe: () => void; refetch: () => unknown };

type UseFiatRatesResult = {
    /** Some of the rates are being fetched for the first time. */
    isLoading: boolean;
    /** Some of the rates are being fetched, for the first time or again. */
    isFetching: boolean;
    refetch: () => void;
};

export type UseFiatRatesParams = {
    tickers: readonly TickerId[];
    rateType?: RateTypeWithoutHistoric;
    /** Defaults to the base currency from the wallet settings. */
    baseCurrencyCode?: BaseCurrencyCode;
    forceFetchToken?: boolean;
    isDisabled?: boolean;
    /** Off for components that only show the rates, the focused screen keeps them fresh. */
    isPolling?: boolean;
};

/**
 * Subscribes the component to the rates of a changing list of tickers. Rates are fetched when
 * missing or stale and, unless `isPolling` is off, polled while the component is mounted. Read the
 * values with the fiat rate selectors.
 */
export const useFiatRates = ({
    tickers,
    rateType = 'current',
    baseCurrencyCode,
    forceFetchToken = false,
    isDisabled = false,
    isPolling = true,
}: UseFiatRatesParams): UseFiatRatesResult => {
    const { dispatch } = useServices(injectDispatch);
    const defaultBaseCurrencyCode = useSelector(selectBaseCurrency);
    const fiatCurrency = baseCurrencyCode ?? defaultBaseCurrencyCode;
    // Subscriptions survive ticker list changes: only added tickers subscribe and only removed
    // ones unsubscribe, so frequent account updates do not reset polling of the other rates.
    const subscriptionsRef = useRef(new Map<string, FiatRateSubscription>());
    const endpointName = getFiatRateEndpointName(rateType);
    const tickersByQueryCacheKey = useMemo(
        () =>
            new Map(
                (isDisabled ? [] : tickers)
                    .filter(ticker => !isTestnet(ticker.symbol))
                    .map(ticker => [
                        getFiatRateQueryCacheKey(
                            endpointName,
                            getFiatRateKeyFromTicker(ticker, fiatCurrency),
                        ),
                        ticker,
                    ]),
            ),
        [tickers, endpointName, fiatCurrency, isDisabled],
    );

    const queryCacheKeys = useMemo(
        () => Array.from(tickersByQueryCacheKey.keys()),
        [tickersByQueryCacheKey],
    );
    const isLoading = useSelector((state: FiatRatesApiRootState) =>
        selectIsSomeFiatRateQueryLoading(state, queryCacheKeys),
    );
    const isFetching = useSelector((state: FiatRatesApiRootState) =>
        selectIsSomeFiatRateQueryFetching(state, queryCacheKeys),
    );

    useEffect(() => {
        const subscriptions = subscriptionsRef.current;
        const endpoint = getFiatRateEndpoint(rateType);
        const tickersBySubscriptionKey = new Map(
            Array.from(tickersByQueryCacheKey, ([queryCacheKey, ticker]) => [
                `${queryCacheKey}:${forceFetchToken}:${isPolling}`,
                ticker,
            ]),
        );

        subscriptions.forEach((subscription, subscriptionKey) => {
            if (!tickersBySubscriptionKey.has(subscriptionKey)) {
                subscription.unsubscribe();
                subscriptions.delete(subscriptionKey);
            }
        });

        tickersBySubscriptionKey.forEach((ticker, subscriptionKey) => {
            if (subscriptions.has(subscriptionKey)) return;

            subscriptions.set(
                subscriptionKey,
                dispatch(
                    endpoint.initiate(
                        { ticker, baseCurrencyCode: fiatCurrency, forceFetchToken },
                        {
                            forceRefetch: getFiatRateMaxAgeInSeconds(rateType),
                            subscriptionOptions: getFiatRateSubscriptionOptions(
                                rateType,
                                isPolling,
                            ),
                        },
                    ),
                ),
            );
        });
    }, [dispatch, tickersByQueryCacheKey, rateType, fiatCurrency, forceFetchToken, isPolling]);

    useEffect(() => {
        const subscriptions = subscriptionsRef.current;

        return () => {
            subscriptions.forEach(subscription => subscription.unsubscribe());
            subscriptions.clear();
        };
    }, []);

    const refetch = useCallback(() => {
        subscriptionsRef.current.forEach(subscription => subscription.refetch());
    }, []);

    return { isLoading, isFetching, refetch };
};
