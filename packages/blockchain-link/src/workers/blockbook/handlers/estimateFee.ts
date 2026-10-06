import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';

import type { Request } from '../types';

export const estimateFee = async (
    request: Request<MessageTypes.EstimateFee>,
): Promise<Responses.EstimateFee> => {
    const api = await request.connect();
    const resp = await api.estimateFee(request.payload);

    return {
        type: RESPONSES.ESTIMATE_FEE,
        payload: resp,
    };
};
