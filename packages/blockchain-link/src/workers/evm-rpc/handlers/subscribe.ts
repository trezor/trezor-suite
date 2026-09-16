import { CustomError, RESPONSES } from '@trezor/blockchain-link-types';
import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';

import type { WorkerState } from '../../state';
import { BLOCK_SUBSCRIPTION } from '../constants';
import { detectAccountChanges } from '../history';
import type { Request } from '../types';
import { getErrorName } from '../utils/errors';

type PollInterval = ReturnType<typeof setInterval>;

const getBlockPollInterval = (state: WorkerState) =>
    state.getSubscription('block') as PollInterval | undefined;

/**
 * One poll loop serves both subscription kinds: it reports new blocks when blocks are subscribed,
 * and looks for transfers touching the subscribed accounts. There is no mempool on the chains this
 * worker serves, so a transfer can only ever be observed once mined, which makes the block tick the
 * natural moment to look.
 */
const ensurePolling = async (request: Request<MessageTypes.Subscribe>) => {
    const { state } = request;

    if (getBlockPollInterval(state)) {
        return;
    }

    const client = await request.connect();
    let lastBlockHeight = Number(await client.getBlockNumber());
    let lastCheckedBlock = lastBlockHeight;

    const pollInterval: PollInterval = setInterval(async () => {
        // The state entry is the subscription. BaseWorker.cleanup() drops it without
        // knowing about the interval, so the poll has to stop itself.
        if (getBlockPollInterval(state) !== pollInterval) {
            clearInterval(pollInterval);

            return;
        }

        try {
            const currentBlock = Number(await client.getBlockNumber());
            if (currentBlock <= lastBlockHeight) {
                return;
            }

            if (state.getSubscription('blockNotifications')) {
                const block = await client.getBlock({ blockNumber: BigInt(currentBlock) });
                if (block) {
                    request.post({
                        id: -1,
                        type: RESPONSES.NOTIFICATION,
                        payload: {
                            type: 'block',
                            payload: { blockHeight: currentBlock, blockHash: block.hash },
                        },
                    });
                }
            }
            lastBlockHeight = currentBlock;

            const changes = await detectAccountChanges(
                client,
                state,
                lastCheckedBlock + 1,
                currentBlock,
            );
            lastCheckedBlock = currentBlock;

            changes.forEach(({ descriptor, tx }) => {
                request.post({
                    id: -1,
                    type: RESPONSES.NOTIFICATION,
                    payload: { type: 'notification', payload: { descriptor, tx } },
                });
            });
        } catch (error) {
            console.warn('[evm-rpc] Block polling error:', getErrorName(error));
        }
    }, BLOCK_SUBSCRIPTION.POLL_INTERVAL_MS);

    state.addSubscription('block', pollInterval);
};

const subscribeBlock = async (request: Request<MessageTypes.Subscribe>) => {
    request.state.addSubscription('blockNotifications');
    await ensurePolling(request);

    return { subscribed: true };
};

const stopPollingIfIdle = (state: WorkerState) => {
    if (state.getSubscription('blockNotifications') || state.getAccounts().length) {
        return;
    }

    const pollInterval = getBlockPollInterval(state);
    if (pollInterval) {
        clearInterval(pollInterval);
        state.removeSubscription('block');
    }
};

const unsubscribeBlock = (request: Request<MessageTypes.Unsubscribe>) => {
    const { state } = request;

    state.removeSubscription('blockNotifications');
    stopPollingIfIdle(state);

    return { subscribed: false };
};

export const subscribe = async (
    request: Request<MessageTypes.Subscribe>,
): Promise<Responses.Subscribe> => {
    const { payload, state } = request;

    let response: { subscribed: boolean };
    if (payload.type === 'block') {
        response = await subscribeBlock(request);
    } else if (payload.type === 'accounts') {
        state.addAccounts(payload.accounts);
        await ensurePolling(request);
        response = { subscribed: true };
    } else if (payload.type === 'addresses') {
        state.addAddresses(payload.addresses);
        await ensurePolling(request);
        response = { subscribed: true };
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
    const { payload, state } = request;

    let response: { subscribed: boolean };
    if (payload.type === 'block') {
        response = unsubscribeBlock(request);
    } else if (payload.type === 'accounts') {
        state.removeAccounts(payload.accounts ?? state.getAccounts());
        stopPollingIfIdle(state);
        response = { subscribed: state.getAccounts().length > 0 };
    } else if (payload.type === 'addresses') {
        state.removeAddresses(payload.addresses ?? state.getAddresses());
        response = { subscribed: state.getAddresses().length > 0 };
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

export const cleanupSubscriptions = (state: WorkerState) => {
    const pollInterval = getBlockPollInterval(state);

    if (pollInterval) {
        clearInterval(pollInterval);
        state.removeSubscription('block');
    }
    state.removeSubscription('blockNotifications');
};
