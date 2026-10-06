import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';

import type { Request } from '../types';

export const rpcCall = async (
    request: Request<MessageTypes.RpcCall>,
): Promise<Responses.RpcCall> => {
    const api = await request.connect();
    const resp = await api.rpcCall(request.payload);

    return {
        type: RESPONSES.RPC_CALL,
        payload: resp,
    };
};
