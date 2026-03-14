import { RESPONSES } from '@trezor/blockchain-link-types/src/constants';
import { CustomError } from '@trezor/blockchain-link-types/src/constants/errors';
import type * as MessageTypes from '@trezor/blockchain-link-types/src/messages';
import type * as Responses from '@trezor/blockchain-link-types/src/responses';

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
