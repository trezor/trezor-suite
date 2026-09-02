import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';
import { CustomError, RESPONSES } from '@trezor/blockchain-link-types';

import { unsubscribeAccounts } from '../subscriptions/accounts';
import { unsubscribeAddresses } from '../subscriptions/addresses';
import { unsubscribeBlock } from '../subscriptions/block';
import { unsubscribeFiatRates } from '../subscriptions/fiatRates';
import { unsubscribeMempool } from '../subscriptions/mempool';
import type { Request } from '../types';

export const unsubscribe = async (
    request: Request<MessageTypes.Unsubscribe>,
): Promise<Responses.Unsubscribe> => {
    const { payload } = request;
    let response: { subscribed: boolean };
    if (payload.type === 'accounts') {
        response = await unsubscribeAccounts(request, payload.accounts);
    } else if (payload.type === 'addresses') {
        response = await unsubscribeAddresses(request, payload.addresses);
    } else if (payload.type === 'block') {
        response = await unsubscribeBlock(request);
    } else if (payload.type === 'fiatRates') {
        response = await unsubscribeFiatRates(request);
    } else if (payload.type === 'mempool') {
        response = await unsubscribeMempool(request);
    } else {
        throw new CustomError('invalid_param', '+type');
    }

    return {
        type: RESPONSES.UNSUBSCRIBE,
        payload: response,
    };
};
