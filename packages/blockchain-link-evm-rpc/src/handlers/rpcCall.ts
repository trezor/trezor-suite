import { RESPONSES } from '@trezor/blockchain-link-types/src/constants';
import { CustomError } from '@trezor/blockchain-link-types/src/constants/errors';
import type * as MessageTypes from '@trezor/blockchain-link-types/src/messages';
import type * as Responses from '@trezor/blockchain-link-types/src/responses';

import type { Request } from '../types';
import { toHex } from '../utils/hex';

export const rpcCall = async (
    request: Request<MessageTypes.RpcCall>,
): Promise<Responses.RpcCall> => {
    const client = await request.connect();

    const to = toHex(request.payload.to);
    const data = toHex(request.payload.data);
    const account = toHex(request.payload.from);

    const result = await client.call({ to, data, account });

    if (!result.data) {
        throw new CustomError('worker_runtime', 'No data returned from RPC call');
    }

    return {
        type: RESPONSES.RPC_CALL,
        payload: {
            data: result.data,
        },
    };
};
