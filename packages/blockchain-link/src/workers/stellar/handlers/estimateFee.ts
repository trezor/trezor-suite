import type { MessageTypes } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';

import type { Request } from '../types';

export const estimateFee = async (request: Request<MessageTypes.EstimateFee>) => {
    const api = await request.connect();
    const feeStats = await api.feeStats();

    // We are using p70 as a fee estimation
    // https://developers.stellar.org/docs/data/horizon/api-reference/aggregations/fee-stats/object
    const stroops = feeStats.fee_charged.p70;

    const payload =
        request.payload && Array.isArray(request.payload.blocks)
            ? request.payload.blocks.map(() => ({ feePerUnit: stroops }))
            : [{ feePerUnit: stroops }];

    return {
        type: RESPONSES.ESTIMATE_FEE,
        payload,
    } as const;
};
