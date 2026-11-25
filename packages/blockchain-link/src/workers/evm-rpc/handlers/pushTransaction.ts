import { RESPONSES } from '@trezor/blockchain-link-types';
import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';

import { recordOwnTxid } from '../history';
import type { Request } from '../types';
import { toCustomError } from '../utils/error';
import { toHex } from '../utils/hex';

export const pushTransaction = async (
    request: Request<MessageTypes.PushTransaction>,
): Promise<Responses.PushTransaction> => {
    const client = await request.connect();
    const { hex } = request.payload;

    const serializedTransaction = toHex(hex);

    let txHash: `0x${string}`;
    try {
        txHash = await client.sendRawTransaction({ serializedTransaction });
    } catch (error) {
        throw toCustomError(error, 'Transaction broadcast failed');
    }

    // A transfer-log scan cannot see a transaction that moved no value, so remember it and resolve
    // it by receipt on the next history sync.
    recordOwnTxid(request.state, txHash);

    return {
        type: RESPONSES.PUSH_TRANSACTION,
        payload: txHash,
    };
};
