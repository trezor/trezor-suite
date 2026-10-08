import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';
import { transformUtxos } from '@trezor/blockchain-link-utils/src/blockfrost';

import type { Request } from '../types';

export const getAccountUtxo = async (
    request: Request<MessageTypes.GetAccountUtxo>,
): Promise<Responses.GetAccountUtxo> => {
    const api = await request.connect();
    const utxos = await api.getAccountUtxo(request.payload);

    return {
        type: RESPONSES.GET_ACCOUNT_UTXO,
        payload: transformUtxos(utxos),
    };
};
