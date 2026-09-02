import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';

import { unsubscribeAccounts } from '../subscriptions/accounts';
import { unsubscribeAddresses } from '../subscriptions/addresses';
import { unsubscribeBlock } from '../subscriptions/block';
import type { Request } from '../types';

export const unsubscribe = async (
    request: Request<MessageTypes.Unsubscribe>,
): Promise<Responses.Unsubscribe> => {
    const { payload } = request;

    if (payload.type === 'accounts') {
        await unsubscribeAccounts(request, payload.accounts);
    } else if (payload.type === 'addresses') {
        await unsubscribeAddresses(request, payload.addresses);
    } else if (payload.type === 'block') {
        await unsubscribeBlock(request);
    }

    return {
        type: RESPONSES.UNSUBSCRIBE,
        payload: { subscribed: request.state.getAddresses().length > 0 },
    };
};
