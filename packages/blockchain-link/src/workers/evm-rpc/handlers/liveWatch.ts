import type { PublicClient } from 'viem';

import { RESPONSES } from '@trezor/blockchain-link-types';

import type { WorkerState } from '../../state';
import {
    type AccountChange,
    detectAccountChanges,
    getCatchUpStart,
    markWatched,
    reportAccountChanges,
} from '../history';
import {
    TIP_LAG_BLOCKS,
    TRANSFER_TOPIC,
    WATCH_HEALTH_CHECK_INTERVAL_MS,
} from '../history/constants';
import { type RawLog, toAddressTopic } from '../history/logScanner';
import type { Context } from '../types';
import { getErrorName } from '../utils/errors';
import {
    type LogSubscriptionSocket,
    openLogSubscriptionSocket,
} from '../utils/logSubscriptionSocket';

type LiveWatch = {
    socket: LogSubscriptionSocket;
    cancelSubscriptions: (() => void)[];
    healthCheck?: ReturnType<typeof setInterval>;
    /** Accounts the socket has watched since their catch-up began. */
    descriptors: readonly string[];
    /** Blocks mined before the socket subscribed, still to be read over HTTP. */
    catchUp?: { checkedTo: number; target: number };
};

const liveWatches = new WeakMap<WorkerState, LiveWatch>();
// A socket that failed is not tried again until watching starts over, so a provider without
// WebSocket support costs one failed attempt rather than one per account change.
const failedStates = new WeakSet<WorkerState>();
// Subscribe messages may arrive together, and each would otherwise open a socket of its own.
const pendingUpdates = new WeakMap<WorkerState, Promise<void>>();

export const isLiveWatching = (state: WorkerState) => liveWatches.has(state);

export const postAccountChanges = (context: Context, changes: readonly AccountChange[]) => {
    changes.forEach(({ descriptor, tx }) => {
        context.post({
            id: -1,
            type: RESPONSES.NOTIFICATION,
            payload: { type: 'notification', payload: { descriptor, tx } },
        });
    });
};

export const stopLiveWatch = (state: WorkerState) => {
    const watch = liveWatches.get(state);
    if (!watch) return;

    liveWatches.delete(state);
    clearInterval(watch.healthCheck);
    watch.cancelSubscriptions.forEach(cancel => cancel());
    watch.socket.close();
};

const reportPushedLog = (context: Context, client: PublicClient, log: RawLog) => {
    // Arc finalizes every block, but a withdrawn log on any other chain must not be reported.
    if (log.removed) return;

    reportAccountChanges(client, context.state, [log])
        .then(changes => postAccountChanges(context, changes))
        .catch(error => console.warn('[evm-rpc] Pushed log not reported:', getErrorName(error)));
};

// The tip is left until its logs are queryable, and an abandoned chunk until the next health check.
// Only once the catch-up is complete does the socket vouch for everything up to the tip.
const catchUp = async (
    context: Context,
    client: PublicClient,
    watch: LiveWatch,
    latestBlock: number,
) => {
    const pending = watch.catchUp;
    if (pending) {
        const { changes, checkedTo } = await detectAccountChanges(
            client,
            context.state,
            pending.checkedTo + 1,
            Math.min(pending.target, latestBlock - TIP_LAG_BLOCKS),
        );
        pending.checkedTo = Math.max(pending.checkedTo, checkedTo);
        postAccountChanges(context, changes);

        if (pending.checkedTo < pending.target) return;
        watch.catchUp = undefined;
    }

    if (liveWatches.get(context.state) !== watch) return;
    markWatched(context.state, watch.descriptors, latestBlock - TIP_LAG_BLOCKS);
};

const updateLiveWatch = async (context: Context, onFailure: () => void) => {
    const { state, subscriptionUrl } = context;
    const descriptors = state.getAccounts().map(account => account.descriptor);

    if (!descriptors.length) {
        stopLiveWatch(state);
        failedStates.delete(state);

        return;
    }

    if (!subscriptionUrl || failedStates.has(state)) return;

    const client = await context.connect();
    const watch = liveWatches.get(state) ?? {
        socket: openLogSubscriptionSocket(subscriptionUrl),
        cancelSubscriptions: [],
        descriptors: [],
    };
    liveWatches.set(state, watch);

    const fail = (error: unknown) => {
        if (liveWatches.get(state) !== watch) return;

        console.warn('[evm-rpc] Watching over the socket failed:', getErrorName(error));
        stopLiveWatch(state);
        failedStates.add(state);
        onFailure();
    };

    // A watch stopped meanwhile has its socket closed, and asking that socket anything reopens it.
    const isStopped = () => liveWatches.get(state) !== watch;

    try {
        const topic = toAddressTopic(descriptors);
        const onLog = (log: RawLog) => reportPushedLog(context, client, log);
        const previous = watch.cancelSubscriptions.splice(0);

        for (const topics of [
            [TRANSFER_TOPIC, topic],
            [TRANSFER_TOPIC, null, topic],
        ]) {
            watch.cancelSubscriptions.push(
                await watch.socket.subscribeLogs({ topics, onLog, onError: fail }),
            );
            if (isStopped()) return;
        }

        // Subscribed first, so nothing mined from here on can slip between the two. Where they
        // overlap, a transaction is not reported twice, because the first report makes it known.
        const latestBlock = Number(await client.getBlockNumber());
        if (isStopped()) return;
        previous.forEach(cancel => cancel());
        watch.descriptors = descriptors;
        watch.catchUp = { checkedTo: getCatchUpStart(state, latestBlock), target: latestBlock };
        await catchUp(context, client, watch, latestBlock);
        if (isStopped()) return;

        watch.healthCheck ??= setInterval(() => {
            watch.socket
                .getBlockNumber()
                .then(block => catchUp(context, client, watch, block))
                .catch(fail);
        }, WATCH_HEALTH_CHECK_INTERVAL_MS);
    } catch (error) {
        fail(error);
    }
};

/**
 * Brings the socket subscriptions in line with the accounts currently subscribed: opens the socket
 * for the first one, follows the account set as it changes, and closes it once none is left. Calls
 * `onFailure` when the socket cannot serve, after which accounts are polled for instead.
 */
export const syncLiveWatch = (context: Context, onFailure: () => void): Promise<void> => {
    const { state } = context;
    const update = (pendingUpdates.get(state) ?? Promise.resolve())
        .then(() => updateLiveWatch(context, onFailure))
        .catch(error => console.warn('[evm-rpc] Live watch not updated:', getErrorName(error)));
    pendingUpdates.set(state, update);

    return update;
};

export const cleanupLiveWatch = (state: WorkerState) => {
    stopLiveWatch(state);
    failedStates.delete(state);
};
