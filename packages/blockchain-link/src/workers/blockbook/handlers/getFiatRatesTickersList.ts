import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';

import type { Request } from '../types';

export const getFiatRatesTickersList = async (
    request: Request<MessageTypes.GetFiatRatesTickersList>,
): Promise<Responses.GetFiatRatesTickersList> => {
    const { payload } = request;
    const api = await request.connect();
    const tickers = await api.getFiatRatesTickersList(payload);

    return {
        type: RESPONSES.GET_FIAT_RATES_TICKERS_LIST,
        payload: {
            ts: tickers.ts,
            availableCurrencies: tickers.available_currencies, // convert to camelCase
        },
    };
};
