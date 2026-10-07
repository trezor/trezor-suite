import type { GetTrezorConnectDep } from '@trezor/connect-common';
import { scheduleAction } from '@trezor/utils';

import type { HistoricFiatRates } from './ChainTransactions';
import type { FetchCoinGeckoHistoricRatesDep, FetchHistoricFiatRates } from './FiatRate';
import { toCoinSymbol } from './toCoinSymbol';

const CONNECT_FETCH_TIMEOUT_MS = 10_000;

export type FetchConnectHistoricFiatRatesDeps =
    GetTrezorConnectDep<'blockchainGetFiatRatesForTimestamps'> & FetchCoinGeckoHistoricRatesDep;

/**
 * Past rates from the Blockbook backend Connect is connected to, CoinGecko when Blockbook cannot
 * answer. Blockbook answers one ticker per requested time, in order, with -1 where it knows no
 * rate; each answer is matched to its time before any is dropped, so no rate shifts to another
 * time.
 */
export const createFetchConnectHistoricFiatRates =
    (deps: FetchConnectHistoricFiatRatesDeps): FetchHistoricFiatRates =>
    async params => {
        const result = await scheduleAction(
            () =>
                deps.getTrezorConnect().blockchainGetFiatRatesForTimestamps({
                    coin: toCoinSymbol(params.symbol),
                    token: params.tokenAddress,
                    timestamps: [...params.timestamps],
                    currencies: [params.currency],
                }),
            { timeout: CONNECT_FETCH_TIMEOUT_MS, signal: params.signal },
        );

        if (!result.success) return deps.fetchCoinGeckoHistoricRates(params);

        const rates: Record<number, number> = {};
        result.payload.tickers.forEach((ticker, index) => {
            const timestamp = params.timestamps[index];
            const rate = ticker.rates[params.currency];

            if (timestamp !== undefined && rate !== undefined && rate >= 0) {
                rates[timestamp] = rate;
            }
        });

        return rates satisfies HistoricFiatRates;
    };
