import { isHex } from 'viem';

import { CustomError } from '@trezor/blockchain-link-types/src/constants/errors';
import type * as MessageTypes from '@trezor/blockchain-link-types/src/messages';
import type * as Responses from '@trezor/blockchain-link-types/src/responses';

import { mapGetBlockResponse } from '../mappers/block';
import type { Request } from '../types';

export const getBlock = async (
    request: Request<MessageTypes.GetBlock>,
): Promise<Responses.GetBlock> => {
    const client = await request.connect();
    const blockId = request.payload;

    const block = await client.getBlock(
        isHex(blockId)
            ? { blockHash: blockId, includeTransactions: true }
            : { blockNumber: BigInt(blockId), includeTransactions: true },
    );

    if (!block) {
        throw new CustomError('worker_runtime', `Block ${blockId} not found`);
    }

    const currentBlockHeight = Number(await client.getBlockNumber());

    return mapGetBlockResponse({ block, currentBlockHeight });
};
