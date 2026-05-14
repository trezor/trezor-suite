import { CustomError, RESPONSES } from '@trezor/blockchain-link-types';
import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';

import type { Request } from '../types';

export const getBlockHash = async (
    request: Request<MessageTypes.GetBlockHash>,
): Promise<Responses.GetBlockHash> => {
    const client = await request.connect();
    const block = await client.getBlock({ blockNumber: BigInt(request.payload) });

    if (!block) {
        throw new CustomError('worker_runtime', `Block ${request.payload} not found`);
    }

    return {
        type: RESPONSES.GET_BLOCK_HASH,
        payload: block.hash,
    };
};
