import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';
import { transformAccountInfo } from '@trezor/blockchain-link-utils/src/blockfrost';

import type { Request } from '../types';

export const getAccountInfo = async (
    request: Request<MessageTypes.GetAccountInfo>,
): Promise<Responses.GetAccountInfo> => {
    const api = await request.connect();
    const { details = 'basic', ...rest } = request.payload;
    const info = await api.getAccountInfo({ details, ...rest });

    return {
        type: RESPONSES.GET_ACCOUNT_INFO,
        payload: transformAccountInfo(info),
    };
};
