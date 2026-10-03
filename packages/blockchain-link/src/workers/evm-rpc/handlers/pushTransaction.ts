import { RESPONSES } from '@trezor/blockchain-link-types';
import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';

import type { Request } from '../types';
import { toCustomError } from '../utils/error';
import { toHex } from '../utils/hex';

export const pushTransaction = async (
    request: Request<MessageTypes.PushTransaction>,
): Promise<Responses.PushTransaction> => {
    const client = await request.connect();
    const { hex } = request.payload;

    const serializedTransaction = toHex(hex);

    try {
        const txHash = await client.sendRawTransaction({ serializedTransaction });

        return {
            type: RESPONSES.PUSH_TRANSACTION,
            payload: txHash,
        };
    } catch (error) {
        throw toCustomError(error, 'Transaction broadcast failed');
    }
};
