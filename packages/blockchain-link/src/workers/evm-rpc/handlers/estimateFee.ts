import { RESPONSES } from '@trezor/blockchain-link-types/src/constants';
import type * as MessageTypes from '@trezor/blockchain-link-types/src/messages';
import type * as Responses from '@trezor/blockchain-link-types/src/responses';

import type { Request } from '../types';
import { calculateEip1559Fees, estimateGasLimit } from '../utils/fees';

export const estimateFee = async (
    request: Request<MessageTypes.EstimateFee>,
): Promise<Responses.EstimateFee> => {
    const client = await request.connect();
    const blocks = request.payload.blocks || [1];
    const { specific } = request.payload;

    const [gasPrice, feeLimit, eip1559] = await Promise.all([
        client.getGasPrice(),
        estimateGasLimit(client, specific),
        calculateEip1559Fees(client),
    ]);

    return {
        type: RESPONSES.ESTIMATE_FEE,
        payload: blocks.map(() => ({
            feePerUnit: gasPrice.toString(),
            feeLimit: feeLimit?.toString(),
            eip1559,
        })),
    };
};
