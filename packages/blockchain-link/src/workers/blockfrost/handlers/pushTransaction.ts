import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';

import type { Request } from '../types';

export const pushTransaction = async (
    request: Request<MessageTypes.PushTransaction>,
): Promise<Responses.PushTransaction> => {
    const api = await request.connect();
    const payload = await api.pushTransaction(request.payload.hex);

    return {
        type: RESPONSES.PUSH_TRANSACTION,
        payload,
    };
};
