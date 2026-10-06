import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';
import { CustomError, RESPONSES } from '@trezor/blockchain-link-types';

import { subscribeAccounts } from '../subscriptions/accounts';
import { subscribeAddresses } from '../subscriptions/addresses';
import { subscribeBlock } from '../subscriptions/block';
import { subscribeFiatRates } from '../subscriptions/fiatRates';
import { subscribeMempool } from '../subscriptions/mempool';
import type { Request } from '../types';

export const subscribe = async (
    request: Request<MessageTypes.Subscribe>,
): Promise<Responses.Subscribe> => {
    const { payload } = request;

    let response: { subscribed: boolean };
    if (payload.type === 'accounts') {
        response = await subscribeAccounts(request, payload.accounts);
    } else if (payload.type === 'addresses') {
        response = await subscribeAddresses(request, payload.addresses);
    } else if (payload.type === 'block') {
        response = await subscribeBlock(request);
    } else if (payload.type === 'fiatRates') {
        response = await subscribeFiatRates(request, payload.currency);
    } else if (payload.type === 'mempool') {
        response = await subscribeMempool(request);
    } else {
        throw new CustomError('invalid_param', '+type');
    }

    return {
        type: RESPONSES.SUBSCRIBE,
        payload: response,
    };
};
