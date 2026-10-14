import { RESPONSES } from '@trezor/blockchain-link-types';
import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';

import { recordOwnTxid } from '../history';
import type { Request } from '../types';
import { toHex } from '../utils/hex';

export const pushTransaction = async (
    request: Request<MessageTypes.PushTransaction>,
): Promise<Responses.PushTransaction> => {
    const client = await request.connect();
    const { hex } = request.payload;

    const serializedTransaction = toHex(hex);
    const txHash = await client.sendRawTransaction({ serializedTransaction });

    // A transfer-log scan cannot see a transaction that moved no value, so remember it and resolve
    // it by receipt on the next history sync.
    recordOwnTxid(request.state, txHash);

    return {
        type: RESPONSES.PUSH_TRANSACTION,
        payload: txHash,
    };
};
