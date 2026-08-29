import type { MessageTypes } from '@trezor/blockchain-link-types';
import { CustomError, RESPONSES } from '@trezor/blockchain-link-types';

import { unsubscribeBlock } from '../subscriptions/block';
import type { Request } from '../types';

export const unsubscribe = (request: Request<MessageTypes.Unsubscribe>) => {
    let response: { subscribed: boolean };
    switch (request.payload.type) {
        case 'block':
            response = unsubscribeBlock(request);
            break;
        case 'accounts':
        case 'addresses':
            response = { subscribed: false };
            break;
        default:
            throw new CustomError('worker_unknown_request', `+${request.type}`);
    }

    return {
        type: RESPONSES.UNSUBSCRIBE,
        payload: response,
    } as const;
};
