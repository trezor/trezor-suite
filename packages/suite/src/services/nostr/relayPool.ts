/**
 * Relay connections of the contacts address exchange: one pool per wallet (keyed by its static
 * session id), all open at the same time, with one RelayClient per configured relay URL.
 *
 * A relay replays a wallet's backlog only to a subscription carrying that wallet's identity, so a
 * single pool for the selected wallet would miss an address a contact sent to another of my wallets
 * until I switched to it.
 *
 * The caller brings each wallet's pool to the desired subscription with `reconcileRelayPool`
 * whenever the wallet, its identity or the relay list changes. A changed subscription rebuilds the
 * pool instead of updating the live REQ: the new clients start with an empty dedup, so the relay's
 * backlog replay reaches the handlers again. Those handlers are idempotent, so duplicates across
 * relays and replays are harmless.
 */
import { schnorr } from '@noble/curves/secp256k1.js';

import { type NostrEvent, RelayClient, type RelayFilter, type RelayHandler } from './relayClient';

export type RelayPoolSubscription = {
    urls: readonly string[];
    filters: RelayFilter[];
};

type RelayPool = {
    clients: Map<string, RelayClient>;
    connectedUrls: Set<string>;
    fingerprint: string;
};

const pools = new Map<string, RelayPool>();

// Ends each running `queryRelaysOnce`, so that disposing every pool also closes the sockets of the
// one-shot queries, whose relay may no longer be admitted once the pools are gone.
const runningQueryStops = new Set<() => void>();

// Bounds the events one `queryRelaysOnce` call keeps. A misbehaving relay can mint valid events
// under fresh keys without limit, and each has a new id. The handlers drop events from unknown
// senders anyway; this only caps the memory spike. Mirrors the live client's dedup bound.
const MAX_QUERY_EVENTS = 4096;

// Each client gets its own ephemeral envelope key, so two relays never see the same envelope
// identity. The envelope key carries no trust either way.
const createRelayClient = (url: string) => new RelayClient(url, schnorr.utils.randomSecretKey());

const disposePool = (deviceState: string) => {
    const pool = pools.get(deviceState);
    if (!pool) return;
    pool.clients.forEach(client => client.dispose());
    pools.delete(deviceState);
};

/** Tears down the pool of every wallet whose static session id is not in `keep`. */
export const disposeRelayPoolsExcept = (keep: ReadonlySet<string>) => {
    for (const deviceState of [...pools.keys()]) {
        if (!keep.has(deviceState)) disposePool(deviceState);
    }
};

/** Tears down every pool and stops every running `queryRelaysOnce`. */
export const disposeAllRelayPools = () => {
    for (const deviceState of [...pools.keys()]) disposePool(deviceState);
    [...runningQueryStops].forEach(stop => stop());
};

type ReconcileRelayPoolParams = {
    deviceState: string;
    subscription: RelayPoolSubscription | undefined;
    onEvent: RelayHandler;
    /** `isConnected` is true while at least one relay is open; `connectedUrls` lists the open ones. */
    onConnectedChange: (isConnected: boolean, connectedUrls: string[]) => void;
};

/**
 * Brings one wallet's pool to the desired subscription. An unchanged subscription (same URLs and
 * filters) is a no-op, so callers may run this on every relevant action without reconnecting.
 */
export const reconcileRelayPool = ({
    deviceState,
    subscription,
    onEvent,
    onConnectedChange,
}: ReconcileRelayPoolParams) => {
    const fingerprint = subscription ? JSON.stringify(subscription) : '';

    if ((pools.get(deviceState)?.fingerprint ?? '') === fingerprint) return;

    disposePool(deviceState);
    onConnectedChange(false, []);

    if (!subscription || subscription.urls.length === 0) return;

    const nextPool: RelayPool = { clients: new Map(), connectedUrls: new Set(), fingerprint };

    for (const url of subscription.urls) {
        if (nextPool.clients.has(url)) continue;
        const client = createRelayClient(url);
        client.on(onEvent);
        client.onStatusChange = isConnected => {
            // A client of a replaced pool must not report into the live one.
            if (pools.get(deviceState) !== nextPool) return;
            if (isConnected) {
                nextPool.connectedUrls.add(url);
            } else {
                nextPool.connectedUrls.delete(url);
            }
            onConnectedChange(nextPool.connectedUrls.size > 0, [...nextPool.connectedUrls]);
        };
        // Each client reconnects on its own.
        client.connect(subscription.filters).catch(() => {});
        nextPool.clients.set(url, client);
    }

    pools.set(deviceState, nextPool);
};

/** Signs the draft with each client's ephemeral key and publishes it to every relay of the wallet. */
export const publishDraftToPool = (
    deviceState: string,
    draft: { kind: number; tags: string[][]; content: string },
) => {
    pools.get(deviceState)?.clients.forEach(client => client.publish(draft));
};

/**
 * One-shot read through throwaway connections, independent of the wallet pools: subscribes with
 * `filters`, collects the stored events (deduplicated by id across relays) and tears everything
 * down once every relay has sent EOSE, the timeout fires or `disposeAllRelayPools` runs. It starts
 * with an empty dedup, so it can re-pull a backlog the live pool has already consumed. Never
 * rejects; an unreachable relay or a stopped query only yields fewer events.
 */
export const queryRelaysOnce = (
    urls: readonly string[],
    filters: RelayFilter[],
    timeoutMs = 6000,
): Promise<NostrEvent[]> =>
    new Promise(resolve => {
        if (urls.length === 0 || filters.length === 0) {
            resolve([]);

            return;
        }
        const eventsById = new Map<string, NostrEvent>();
        const clients: RelayClient[] = [];
        let isSettled = false;
        let pendingRelays = urls.length;

        const finish = () => {
            if (isSettled) return;
            isSettled = true;
            // eslint-disable-next-line @typescript-eslint/no-use-before-define -- runs after `timer` is set
            clearTimeout(timer);
            runningQueryStops.delete(finish);
            clients.forEach(client => client.dispose());
            resolve([...eventsById.values()]);
        };
        const timer = setTimeout(finish, timeoutMs);
        runningQueryStops.add(finish);

        for (const url of urls) {
            const client = createRelayClient(url);
            // A relay can signal completion more than once: after a reconnect it re-sends the REQ
            // and a second EOSE follows, and a relay that failed to open (counted by `.catch`) may
            // reconnect and send EOSE later. Counting it twice would finish early and dispose a
            // slower relay in the middle of its backlog.
            let isCounted = false;
            const markRelayDone = () => {
                if (isCounted) return;
                isCounted = true;
                pendingRelays -= 1;
                if (pendingRelays <= 0) finish();
            };
            client.on(event => {
                // Once the cap is hit, new ids are dropped; an already kept id may still update.
                if (eventsById.size >= MAX_QUERY_EVENTS && !eventsById.has(event.id)) return;
                eventsById.set(event.id, event);
            });
            client.onEose = markRelayDone;
            // A relay that never opens still counts as done, so the query can settle.
            client.connect(filters).catch(markRelayDone);
            clients.push(client);
        }
    });
