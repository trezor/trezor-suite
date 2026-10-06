import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';
import { CustomError, RESPONSES } from '@trezor/blockchain-link-types';

import type { Request } from '../types';

export const getTransactionHex = async (
    request: Request<MessageTypes.GetTransactionHex>,
): Promise<Responses.GetTransactionHex> => {
    const api = await request.connect();
    const { hex } = await api.getTransaction(request.payload);
    if (!hex) throw new CustomError(`Missing hex of ${request.payload}`);

    return {
        type: RESPONSES.GET_TRANSACTION_HEX,
        payload: hex,
    };
};
