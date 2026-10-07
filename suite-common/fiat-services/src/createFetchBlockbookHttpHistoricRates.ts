import type { FetchHistoricFiatRates } from '@trezor/network-module-suite-common-types';

import * as blockbookService from './blockbook';
import { toHistoricFiatRates } from './toHistoricFiatRates';

/** Past rates from Trezor's public Blockbook HTTP API, which serves the Bitcoin coin only. */
export const createFetchBlockbookHttpHistoricRates = (): FetchHistoricFiatRates => async params => {
    if (params.symbol !== 'btc' || params.tokenAddress) return {};

    const response = await blockbookService.getFiatRatesForTimestamps(
        'btc',
        [...params.timestamps],
        params.currency,
    );

    return toHistoricFiatRates(response?.tickers, params.currency);
};
