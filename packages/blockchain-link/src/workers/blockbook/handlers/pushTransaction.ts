import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';

import type { Request } from '../types';

export const pushTransaction = async (
    request: Request<MessageTypes.PushTransaction>,
): Promise<Responses.PushTransaction> => {
    const api = await request.connect();
    const { hex, disableAlternativeRPC } = request.payload;
    const resp = await api.pushTransaction(hex, disableAlternativeRPC);

    return {
        type: RESPONSES.PUSH_TRANSACTION,
        payload: resp.result,
    };
};
