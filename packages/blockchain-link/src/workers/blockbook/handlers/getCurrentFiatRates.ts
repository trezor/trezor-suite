import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';

import type { Request } from '../types';

export const getCurrentFiatRates = async (
    request: Request<MessageTypes.GetCurrentFiatRates>,
): Promise<Responses.GetCurrentFiatRates> => {
    const { payload } = request;
    const api = await request.connect();
    const fiatRates = await api.getCurrentFiatRates(payload);

    return {
        type: RESPONSES.GET_CURRENT_FIAT_RATES,
        payload: fiatRates,
    };
};
