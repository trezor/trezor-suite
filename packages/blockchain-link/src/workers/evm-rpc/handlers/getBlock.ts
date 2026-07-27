import { CustomError } from '@trezor/blockchain-link-types';
import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';
import { isHex } from '@trezor/utils';

import { mapGetBlockResponse } from '../mappers/block';
import type { Request } from '../types';

export const getBlock = async (
    request: Request<MessageTypes.GetBlock>,
): Promise<Responses.GetBlock> => {
    const client = await request.connect();
    const blockId = request.payload;

    let blockParams: Parameters<typeof client.getBlock>[0];
    if (blockId === 'latest') {
        blockParams = { blockTag: 'latest', includeTransactions: true };
    } else if (isHex(blockId)) {
        blockParams = { blockHash: blockId, includeTransactions: true };
    } else {
        blockParams = { blockNumber: BigInt(blockId), includeTransactions: true };
    }

    const block = await client.getBlock(blockParams);

    if (!block) {
        throw new CustomError('worker_runtime', `Block ${blockId} not found`);
    }

    const currentBlockHeight = Number(await client.getBlockNumber());

    return mapGetBlockResponse({ block, currentBlockHeight });
};
