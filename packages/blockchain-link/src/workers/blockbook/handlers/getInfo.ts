import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';
import { transformServerInfo } from '@trezor/blockchain-link-utils/src/blockbook';

import type { Request } from '../types';

export const getInfo = async (
    request: Request<MessageTypes.GetInfo>,
): Promise<Responses.GetInfo> => {
    const api = await request.connect();
    const info = await api.getServerInfo();

    return {
        type: RESPONSES.GET_INFO,
        payload: {
            url: api.options.url,
            ...transformServerInfo(info),
        },
    };
};
