import { CustomError, RESPONSES } from '@trezor/blockchain-link-types';
import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';

import type { WorkerState } from '../../state';
import { BLOCK_SUBSCRIPTION } from '../constants';
import { detectAccountChanges, getCatchUpStart } from '../history';
import { TIP_LAG_BLOCKS } from '../history/constants';
import type { Context, Request } from '../types';
import { cleanupLiveWatch, isLiveWatching, postAccountChanges, syncLiveWatch } from './liveWatch';
import { getErrorName } from '../utils/errors';

type PollInterval = ReturnType<typeof setInterval>;

const getBlockPollInterval = (state: WorkerState) =>
    state.getSubscription('block') as PollInterval | undefined;

// Accounts watched over a socket need no polling; blocks always do.
const isPollingIdle = (state: WorkerState) =>
    !state.getSubscription('blockNotifications') &&
    (!state.getAccounts().length || isLiveWatching(state));

/**
 * One poll loop serves both subscription kinds: it reports new blocks when blocks are subscribed,
 * and looks for transfers touching the subscribed accounts. There is no mempool on the chains this
 * worker serves, so a transfer can only ever be observed once mined, which makes the block tick the
 * natural moment to look.
 */
const startPolling = async (context: Context) => {
    const { state } = context;

    const client = await context.connect();
    let lastBlockHeight = Number(await client.getBlockNumber());
    // Unknown while a socket watches the accounts, and recovered from what it recorded once it fails.
    // The newest blocks' logs may not be queryable yet, so they are always left for a later look.
    let lastCheckedBlock: number | undefined = getCatchUpStart(
        state,
        lastBlockHeight - TIP_LAG_BLOCKS,
    );

    const pollInterval: PollInterval = setInterval(async () => {
        // The state entry is the subscription. BaseWorker.cleanup() drops it without
        // knowing about the interval, so the poll has to stop itself.
        if (getBlockPollInterval(state) !== pollInterval) {
            clearInterval(pollInterval);

            return;
        }

        // Everything subscribed may have left while the loop was still starting, after the last
        // unsubscribe already looked for an interval to stop.
        if (isPollingIdle(state)) {
            clearInterval(pollInterval);
            state.removeSubscription('block');

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
                    context.post({
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

            if (isLiveWatching(state)) {
                lastCheckedBlock = undefined;

                return;
            }

            const scanTo = currentBlock - TIP_LAG_BLOCKS;
            const scanFrom = lastCheckedBlock ?? getCatchUpStart(state, scanTo);
            const { changes, checkedTo } = await detectAccountChanges(
                client,
                state,
                scanFrom + 1,
                scanTo,
            );
            // An abandoned chunk is looked at again on the next tick rather than skipped.
            lastCheckedBlock = Math.max(scanFrom, checkedTo);
            postAccountChanges(context, changes);
        } catch (error) {
            console.warn('[evm-rpc] Block polling error:', getErrorName(error));
        }
    }, BLOCK_SUBSCRIPTION.POLL_INTERVAL_MS);

    state.addSubscription('block', pollInterval);
};

// Connecting and reading the tip are both awaited before the interval is registered, so a plain
// "already polling?" check lets two subscriptions started together each begin a loop of their own.
// Concurrent callers share the first setup instead.
const startingPolls = new WeakMap<WorkerState, Promise<void>>();

const ensurePolling = (context: Context): Promise<void> => {
    const { state } = context;

    if (getBlockPollInterval(state)) {
        return Promise.resolve();
    }

    const starting = startingPolls.get(state);
    if (starting) {
        return starting;
    }

    const pending = startPolling(context).finally(() => {
        startingPolls.delete(state);
    });
    startingPolls.set(state, pending);

    return pending;
};

const subscribeBlock = async (request: Request<MessageTypes.Subscribe>) => {
    request.state.addSubscription('blockNotifications');
    await ensurePolling(request);

    return { subscribed: true };
};

const stopPollingIfIdle = (state: WorkerState) => {
    if (!isPollingIdle(state)) {
        return;
    }

    const pollInterval = getBlockPollInterval(state);
    if (pollInterval) {
        clearInterval(pollInterval);
        state.removeSubscription('block');
    }
};

// A socket that cannot serve hands the accounts back to polling, which resumes from whatever the
// socket recorded as watched.
const pollOnFailure = (context: Context) => () => {
    ensurePolling(context).catch(error =>
        console.warn('[evm-rpc] Polling not started:', getErrorName(error)),
    );
};

const watchAccounts = async (request: Request<MessageTypes.Subscribe>) => {
    await syncLiveWatch(request, pollOnFailure(request));

    if (isLiveWatching(request.state)) {
        stopPollingIfIdle(request.state);

        return;
    }

    await ensurePolling(request);
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
        await watchAccounts(request);
        response = { subscribed: true };
    } else if (payload.type === 'addresses') {
        // Accepted so callers don't fail, but only account subscriptions are watched.
        state.addAddresses(payload.addresses);
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
        syncLiveWatch(request, pollOnFailure(request));
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
    cleanupLiveWatch(state);
    const pollInterval = getBlockPollInterval(state);

    if (pollInterval) {
        clearInterval(pollInterval);
        state.removeSubscription('block');
    }
    state.removeSubscription('blockNotifications');
};
