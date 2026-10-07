import type { TokenAddress } from '@suite-common/wallet-types';
import type { FetchHistoricFiatRates } from '@trezor/network-module-suite-common-types';

import * as coingeckoService from './coingecko';
import { toHistoricFiatRates } from './toHistoricFiatRates';

/** Past rates of a network's coin, or of one of its tokens, from Trezor's CoinGecko proxy. */
export const createFetchCoinGeckoHistoricRates = (): FetchHistoricFiatRates => async params => {
    const response = await coingeckoService.getFiatRatesForTimestamps(
        { symbol: params.symbol, tokenAddress: params.tokenAddress as TokenAddress | undefined },
        [...params.timestamps],
        params.currency,
    );

    return toHistoricFiatRates(response?.tickers, params.currency);
};
