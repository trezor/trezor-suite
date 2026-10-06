import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';
import { transformAccountInfo } from '@trezor/blockchain-link-utils/src/blockbook';

import type { Request } from '../types';

export const getAccountInfo = async (
    request: Request<MessageTypes.GetAccountInfo>,
): Promise<Responses.GetAccountInfo> => {
    const { payload } = request;
    const api = await request.connect();
    const info = await api.getAccountInfo(payload);

    return {
        type: RESPONSES.GET_ACCOUNT_INFO,
        payload: transformAccountInfo(info),
    };
};
