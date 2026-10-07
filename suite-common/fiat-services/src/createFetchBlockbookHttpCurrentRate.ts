import type { FetchCurrentFiatRate } from '@trezor/network-module-suite-common-types';

import * as blockbookService from './blockbook';

/**
 * Current rate from Trezor's public Blockbook HTTP API, which serves Bitcoin only. Requests carry
 * the currency alone, never anything account-specific.
 */
export const createFetchBlockbookHttpCurrentRate = (): FetchCurrentFiatRate => async params => {
    if (params.symbol !== 'btc') return null;

    const response = await blockbookService.fetchCurrentFiatRates(
        'btc',
        undefined,
        params.currency,
    );
    const rate = response?.rates?.[params.currency];

    // Blockbook answers -1 for a currency it has no rate in.
    if (!response || !rate || rate < 0) return null;

    return { rate, timestamp: response.ts };
};
