import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';

import type { Request } from '../types';

export const getContractInfo = async (
    request: Request<MessageTypes.GetContractInfo>,
): Promise<Responses.GetContractInfo> => {
    const api = await request.connect();
    const response = await api.getContractInfo(request.payload);

    return {
        type: RESPONSES.GET_CONTRACT_INFO,
        payload: response,
    };
};
