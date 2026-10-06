import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';

import type { Request } from '../types';

export const getBlock = async (
    request: Request<MessageTypes.GetBlock>,
): Promise<Responses.GetBlock> => {
    const api = await request.connect();
    const info = await api.getBlock(request.payload);

    return {
        type: RESPONSES.GET_BLOCK,
        payload: info,
    };
};
