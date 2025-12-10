import { RESPONSES } from '@trezor/blockchain-link-types/src/constants';
import { CustomError } from '@trezor/blockchain-link-types/src/constants/errors';
import type * as MessageTypes from '@trezor/blockchain-link-types/src/messages';
import type * as Responses from '@trezor/blockchain-link-types/src/responses';

import { BLOCK_SUBSCRIPTION } from '../constants';
import type { Request } from '../types';

let blockPollInterval: ReturnType<typeof setInterval> | null = null;
let lastBlockHeight = 0;

const subscribeBlock = async (request: Request<MessageTypes.Subscribe>) => {
    if (request.state.getSubscription('block')) {
        return { subscribed: true };
    }

    const client = await request.connect();
    lastBlockHeight = Number(await client.getBlockNumber());
    request.state.addSubscription('block');

    blockPollInterval = setInterval(async () => {
        try {
            const currentBlock = await client.getBlockNumber();
            if (currentBlock > lastBlockHeight) {
                const block = await client.getBlock({ blockNumber: currentBlock });
                if (block) {
                    request.post({
                        id: -1,
                        type: RESPONSES.NOTIFICATION,
                        payload: {
                            type: 'block',
                            payload: {
                                blockHeight: Number(currentBlock),
                                blockHash: block.hash,
                            },
                        },
                    });
                }
                lastBlockHeight = Number(currentBlock);
            }
        } catch (error) {
            console.warn('[evm-rpc] Block polling error:', error);
        }
    }, BLOCK_SUBSCRIPTION.POLL_INTERVAL_MS);

    return { subscribed: true };
};

const unsubscribeBlock = (request: Request<MessageTypes.Unsubscribe>) => {
    if (!request.state.getSubscription('block')) {
        return { subscribed: false };
    }

    if (blockPollInterval) {
        clearInterval(blockPollInterval);
        blockPollInterval = null;
    }
    request.state.removeSubscription('block');

    return { subscribed: false };
};

export const subscribe = async (
    request: Request<MessageTypes.Subscribe>,
): Promise<Responses.Subscribe> => {
    const { payload } = request;

    let response: { subscribed: boolean };

    if (payload.type === 'block') {
        response = await subscribeBlock(request);
    } else {
        throw new CustomError(
            'invalid_param',
            `Subscription type '${payload.type}' not supported by EVM RPC worker`,
        );
    }

    return {
        type: RESPONSES.SUBSCRIBE,
        payload: response,
    };
};

export const unsubscribe = (request: Request<MessageTypes.Unsubscribe>): Responses.Unsubscribe => {
    const { payload } = request;

    let response: { subscribed: boolean };

    if (payload.type === 'block') {
        response = unsubscribeBlock(request);
    } else {
        throw new CustomError(
            'invalid_param',
            `Unsubscription type '${payload.type}' not supported by EVM RPC worker`,
        );
    }

    return {
        type: RESPONSES.UNSUBSCRIBE,
        payload: response,
    };
};

export const cleanupSubscriptions = () => {
    if (blockPollInterval) {
        clearInterval(blockPollInterval);
        blockPollInterval = null;
    }
};
