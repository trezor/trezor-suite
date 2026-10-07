import { useMemo } from 'react';

import {
    type QueryFunctionContext,
    chainQueryKeys,
    skipToken,
    useQueries,
} from '@suite-common/react-query';
import type { RatesByTimestamps } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import type {
    ChainNetwork,
    ChainTransactionsPage,
    HistoricFiatRates,
} from '@trezor/network-module-suite-common-types';

import { combineQueryResults } from './combineQueryResults';
import { type HistoricRateRequest, getHistoricRateRequests } from './getHistoricRateRequests';

// Past rates do not change; they are kept for the whole session.
const STALE_TIME = Infinity;
const RETRY_COUNT = 1;

export type UseChainHistoricRatesParams = {
    network: ChainNetwork | undefined;
    pages: readonly ChainTransactionsPage[];
    currencies: readonly BaseCurrencyCode[];
    enabled: boolean;
};

type RateEntry = HistoricRateRequest & {
    currency: BaseCurrencyCode;
    queryKey: ReturnType<typeof chainQueryKeys.historicFiatRates>;
};

/**
 * Past rates for the loaded history, in the shape the wallet keeps them in: by rate key, then by
 * hour. Each page asks once per asset and currency, so loading a page never asks for earlier ones.
 */
export const useChainHistoricRates = (params: UseChainHistoricRatesParams) => {
    const { network } = params;

    const entries = useMemo(() => {
        if (!network) return [];

        const entriesByKey = new Map<string, RateEntry>();
        params.pages.forEach(page =>
            getHistoricRateRequests(page.transactions).forEach(request =>
                params.currencies.forEach(currency => {
                    const entry: RateEntry = {
                        ...request,
                        currency,
                        queryKey: chainQueryKeys.historicFiatRates(
                            network.symbol,
                            network.backendType,
                            request.contract ?? '',
                            currency,
                            request.timestamps.join(','),
                        ),
                    };
                    // Pages with the same assets and hours ask once.
                    entriesByKey.set(JSON.stringify(entry.queryKey), entry);
                }),
            ),
        );

        return [...entriesByKey.values()];
    }, [network, params.pages, params.currencies]);

    const results = useQueries({
        queries: entries.map(entry => ({
            queryKey: entry.queryKey,
            queryFn:
                params.enabled && network
                    ? (context: QueryFunctionContext) =>
                          network.getHistoricFiatRates({
                              contract: entry.contract,
                              currency: entry.currency,
                              timestamps: entry.timestamps,
                              signal: context.signal,
                          })
                    : skipToken,
            staleTime: STALE_TIME,
            retry: RETRY_COUNT,
        })),
        combine: combineQueryResults<HistoricFiatRates>,
    });

    return useMemo((): RatesByTimestamps => {
        const rates: RatesByTimestamps = {};
        if (!network) return rates;

        entries.forEach((entry, index) => {
            const key = getFiatRateKey(
                network.symbol,
                entry.currency,
                entry.contract as Parameters<typeof getFiatRateKey>[2],
            );
            rates[key] = { ...rates[key], ...results.data[index] };
        });

        return rates;
    }, [network, entries, results]);
};
