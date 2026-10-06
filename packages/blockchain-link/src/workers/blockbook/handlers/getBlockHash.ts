import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';

import type { Request } from '../types';

export const getBlockHash = async (
    request: Request<MessageTypes.GetBlockHash>,
): Promise<Responses.GetBlockHash> => {
    const api = await request.connect();
    const info = await api.getBlockHash(request.payload);

    return {
        type: RESPONSES.GET_BLOCK_HASH,
        payload: info.hash,
    };
};
