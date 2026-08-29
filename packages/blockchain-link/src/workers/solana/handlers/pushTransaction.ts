import type { MessageTypes } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';
import solana from '@trezor/network-solana/runtime';

import type { Request } from '../types';

export const pushTransaction = async (request: Request<MessageTypes.PushTransaction>) => {
    const rawTx = request.payload.hex.startsWith('0x')
        ? request.payload.hex.slice(2)
        : request.payload.hex;
    const api = await request.connect();
    const { sendAndConfirmTransaction } = await solana();

    const signature = await sendAndConfirmTransaction(rawTx, api);

    return {
        type: RESPONSES.PUSH_TRANSACTION,
        payload: signature,
    } as const;
};
