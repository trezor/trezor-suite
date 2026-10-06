import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';

import type { Request } from '../types';

export const estimateFee = async (
    request: Request<MessageTypes.EstimateFee>,
): Promise<Responses.EstimateFee> => {
    const client = await request.connect();
    const fee = await client.request({
        command: 'fee',
    });

    // TODO: sometimes rippled returns very high values in "server_info.load_factor" and calculated fee jumps from basic 10 drops to 6000+ drops for a moment
    // investigate more...

    const drops = fee.result.drops.base_fee;

    const payload =
        request.payload && Array.isArray(request.payload.blocks)
            ? request.payload.blocks.map(() => ({ feePerUnit: drops }))
            : [{ feePerUnit: drops }];

    return {
        type: RESPONSES.ESTIMATE_FEE,
        payload,
    };
};
