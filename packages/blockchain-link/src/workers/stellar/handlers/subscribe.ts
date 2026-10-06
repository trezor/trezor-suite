import type { MessageTypes } from '@trezor/blockchain-link-types';
import { CustomError, RESPONSES } from '@trezor/blockchain-link-types';

import { subscribeBlock } from '../subscriptions/block';
import type { Request } from '../types';

export const subscribe = async (request: Request<MessageTypes.Subscribe>) => {
    let response: { subscribed: boolean };
    switch (request.payload.type) {
        case 'block':
            response = await subscribeBlock(request);
            break;
        case 'accounts':
        case 'addresses':
            // https://github.com/trezor/trezor-suite/pull/16483#issuecomment-2869536172
            response = { subscribed: false };
            break;
        default:
            throw new CustomError('worker_unknown_request', `+${request.type}`);
    }

    return {
        type: RESPONSES.SUBSCRIBE,
        payload: response,
    } as const;
};
