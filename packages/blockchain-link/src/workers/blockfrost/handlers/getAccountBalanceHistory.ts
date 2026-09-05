import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';

import type { Request } from '../types';

export const getAccountBalanceHistory = async (
    request: Request<MessageTypes.GetAccountBalanceHistory>,
): Promise<Responses.GetAccountBalanceHistory> => {
    const socket = await request.connect();
    const history = await socket.getAccountBalanceHistory(request.payload);

    return {
        type: RESPONSES.GET_ACCOUNT_BALANCE_HISTORY,
        payload: history,
    };
};
