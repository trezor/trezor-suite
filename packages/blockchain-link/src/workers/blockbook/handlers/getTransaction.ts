import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';
import { transformTransaction } from '@trezor/blockchain-link-utils/src/blockbook';

import type { Request } from '../types';

export const getTransaction = async (
    request: Request<MessageTypes.GetTransaction>,
): Promise<Responses.GetTransaction> => {
    const api = await request.connect();
    const { txid, descriptor } = request.payload;
    const rawtx = await api.getTransaction(txid);
    const account = descriptor ? request.state.getAccount(descriptor) : undefined;
    const tx = transformTransaction(rawtx, account?.addresses ?? account?.descriptor ?? descriptor);

    return {
        type: RESPONSES.GET_TRANSACTION,
        payload: tx,
    };
};
