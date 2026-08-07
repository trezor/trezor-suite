import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';
import { transformAccountUtxo } from '@trezor/blockchain-link-utils/src/blockbook';

import type { Request } from '../types';

export const getAccountUtxo = async (
    request: Request<MessageTypes.GetAccountUtxo>,
): Promise<Responses.GetAccountUtxo> => {
    const { payload } = request;
    const api = await request.connect();
    const utxos = await api.getAccountUtxo(payload);

    return {
        type: RESPONSES.GET_ACCOUNT_UTXO,
        payload: transformAccountUtxo(utxos),
    };
};
