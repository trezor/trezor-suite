import type { FetchCurrentFiatRate } from '@trezor/network-module-suite-common-types';

import * as coingeckoService from './coingecko';

/**
 * Current rate of a network's native coin from Trezor's CoinGecko proxy.
 * The proxy client neither accepts a signal nor sends anything account-specific.
 */
export const createFetchCoinGeckoCurrentRate = (): FetchCurrentFiatRate => async params => {
    const response = await coingeckoService.fetchCurrentFiatRates({ symbol: params.symbol });
    const rate = response?.rates?.[params.currency];

    if (!response || !rate) return null;

    return { rate, timestamp: response.ts };
};
