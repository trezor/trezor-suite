import type { GetTrezorConnectDep } from '@trezor/connect-common';
import { scheduleAction } from '@trezor/utils';

import type { FetchCoinGeckoCurrentRateDep, FetchCurrentFiatRate } from './FiatRate';
import { toCoinSymbol } from './toCoinSymbol';

const CONNECT_FETCH_TIMEOUT_MS = 10_000;

// Blockbook's answer for a coin it has no tickers for at all.
const NO_TICKERS_ERROR_MESSAGE = 'No tickers found!';

export type FetchConnectCurrentFiatRateDeps = GetTrezorConnectDep<'blockchainGetCurrentFiatRates'> &
    FetchCoinGeckoCurrentRateDep;

/**
 * Current rate from the Blockbook backend Connect is connected to. CoinGecko answers only when
 * Blockbook has no tickers for the coin; any other failure means no rate.
 */
export const createFetchConnectCurrentFiatRate =
    (deps: FetchConnectCurrentFiatRateDeps): FetchCurrentFiatRate =>
    async params => {
        const result = await scheduleAction(
            () =>
                deps.getTrezorConnect().blockchainGetCurrentFiatRates({
                    coin: toCoinSymbol(params.symbol),
                    currencies: [params.currency],
                }),
            { timeout: CONNECT_FETCH_TIMEOUT_MS, signal: params.signal },
        );

        if (!result.success) {
            return result.error.message === NO_TICKERS_ERROR_MESSAGE
                ? deps.fetchCoinGeckoCurrentRate(params)
                : null;
        }

        const rate = result.payload.rates?.[params.currency];

        // Blockbook answers -1 for a currency it has no rate in.
        if (!rate || rate < 0) return null;

        return { rate, timestamp: result.payload.ts };
    };
