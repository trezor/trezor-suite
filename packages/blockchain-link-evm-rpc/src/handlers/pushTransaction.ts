import { RESPONSES } from '@trezor/blockchain-link-types/src/constants';
import type * as MessageTypes from '@trezor/blockchain-link-types/src/messages';
import type * as Responses from '@trezor/blockchain-link-types/src/responses';

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
