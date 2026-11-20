import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';
import { transformRippleTransaction } from '@trezor/network-ripple/constants';

import type { Request } from '../types';

export const getTransaction = async ({
    connect,
    payload,
}: Request<MessageTypes.GetTransaction>): Promise<Responses.GetTransaction> => {
    const client = await connect();
    const rawTx = await client.request({
        command: 'tx',
        transaction: payload.txid,
        binary: false,
    });

    const tx = transformRippleTransaction(
        rawTx.result.hash,
        rawTx.result.tx_json,
        rawTx.result.meta,
        payload.descriptor,
    );

    return {
        type: RESPONSES.GET_TRANSACTION,
        payload: tx,
    };
};
