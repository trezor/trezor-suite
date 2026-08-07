import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';

import type { Request } from '../types';

export const getFiatRatesForTimestamps = async (
    request: Request<MessageTypes.GetFiatRatesForTimestamps>,
): Promise<Responses.GetFiatRatesForTimestamps> => {
    const { payload } = request;
    const api = await request.connect();
    const { tickers } = await api.getFiatRatesForTimestamps(payload);

    return {
        type: RESPONSES.GET_FIAT_RATES_FOR_TIMESTAMPS,
        payload: { tickers },
    };
};
