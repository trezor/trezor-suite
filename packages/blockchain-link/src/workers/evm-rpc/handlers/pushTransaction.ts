import { RESPONSES } from '@trezor/blockchain-link-types';
import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';

import type { Request } from '../types';
import { toHex } from '../utils/hex';

export const pushTransaction = async (
    request: Request<MessageTypes.PushTransaction>,
): Promise<Responses.PushTransaction> => {
    const client = await request.connect();
    const { hex } = request.payload;

    const serializedTransaction = toHex(hex);
    const txHash = await client.sendRawTransaction({ serializedTransaction });

    return {
        type: RESPONSES.PUSH_TRANSACTION,
        payload: txHash,
    };
};
