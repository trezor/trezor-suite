import { randomBytes } from '@noble/hashes/utils.js';
import { hex } from '@scure/base';

import { parseJSON } from '@trezor/utils';

import { type NostrEvent, parseNostrEvent } from './nostrEvent';

/** A NIP-01 REQ filter; a subscription may carry several, which the relay ORs. */
export type RelayFilter = {
    ids?: string[];
    authors?: string[];
    kinds?: number[];
    '#p'?: string[];
    since?: number;
    limit?: number;
};

export type RelaySocketHandlers = {
    onOpen: () => void;
    /** Also after a connection that never opened. */
    onClose: () => void;
    onMessage: (data: unknown) => void;
};

export type RelaySocket = {
    send: (data: string) => void;
    close: () => void;
};

export type CreateRelaySocket = (url: string, handlers: RelaySocketHandlers) => RelaySocket;

export const createWebSocketRelaySocket: CreateRelaySocket = (url, handlers) => {
    const socket = new WebSocket(url);

    socket.onopen = () => handlers.onOpen();
    // An error is always followed by `close`.
    socket.onclose = () => handlers.onClose();
    socket.onmessage = messageEvent => handlers.onMessage(messageEvent.data);

    return {
        send: data => socket.send(data),
        close: () => socket.close(),
    };
};

// Contacts messages are small; anything larger is not ours. The frame cap fits an event at the
// content cap even if every character of it arrives as a `\uXXXX` escape.
const MAX_CONTENT_LENGTH = 8 * 1024;
const MAX_FRAME_LENGTH = 64 * 1024;
// Bounds memory against a relay flooding distinct valid events.
const MAX_SEEN_EVENT_IDS = 1024;
// Old events are wanted (they are how a message sent while offline arrives), far future ones not.
const MAX_FUTURE_SKEW_SECONDS = 60 * 60;
const CONNECT_TIMEOUT_MS = 15_000;
const QUERY_TIMEOUT_MS = 5000;
const PUBLISH_TIMEOUT_MS = 10_000;
const MAX_RECONNECT_DELAY_MS = 30_000;
// The backoff resets only after a connection stayed open this long, so a relay that accepts and
// drops the socket at once is not hammered every second.
const STABLE_CONNECTION_MS = 30_000;
const MAX_PENDING_PUBLISHES = 50;

type SubscribeParams = {
    filters: RelayFilter[];
    onEvent: (event: NostrEvent) => void;
};

type QueryParams = {
    filters: RelayFilter[];
};

type Subscription = {
    filters: RelayFilter[];
    onEvent: (event: NostrEvent) => void;
    /** Set for a query: the relay sent all it stores for it (EOSE) or refused it (CLOSED). */
    onEnd?: () => void;
};

type PendingPublish = {
    frame: string;
    isSent: boolean;
    resolve: (isAccepted: boolean) => void;
    timer: ReturnType<typeof setTimeout>;
};

type RelayClientParams = {
    url: string;
    createSocket?: CreateRelaySocket;
};

const createSubscriptionId = () => hex.encode(randomBytes(8));

/** Whether the event id is new; the oldest ids are forgotten once there are too many. */
export const rememberEventId = (seenEventIds: Set<string>, eventId: string) => {
    if (seenEventIds.has(eventId)) {
        return false;
    }

    if (seenEventIds.size >= MAX_SEEN_EVENT_IDS) {
        const oldestEventId = seenEventIds.values().next().value;

        if (oldestEventId !== undefined) seenEventIds.delete(oldestEventId);
    }

    seenEventIds.add(eventId);

    return true;
};

const isTimely = (event: NostrEvent) =>
    event.created_at <= Math.floor(Date.now() / 1000) + MAX_FUTURE_SKEW_SECONDS;

/**
 * One NIP-01 relay, connected on first use and reconnected until `close()`. Subscriptions are
 * sent again on every reconnect; the relay then replays what it stored for them, which an
 * in-memory set of seen event ids keeps from reaching the handler twice. Every delivered event
 * has a valid id and signature, which says only who authored it.
 */
export class RelayClient {
    readonly url: string;
    /** Whether the socket is open, on every change. */
    onStatusChange?: (isConnected: boolean) => void;

    private readonly createSocket: CreateRelaySocket;
    private socket?: RelaySocket;
    private isOpen = false;
    private isClosed = false;
    private connectTimer?: ReturnType<typeof setTimeout>;
    private reconnectTimer?: ReturnType<typeof setTimeout>;
    private stableTimer?: ReturnType<typeof setTimeout>;
    private reconnectAttempts = 0;
    private readonly subscriptions = new Map<string, Subscription>();
    private readonly pendingPublishes = new Map<string, PendingPublish>();
    private readonly seenEventIds = new Set<string>();

    constructor({ url, createSocket = createWebSocketRelaySocket }: RelayClientParams) {
        this.url = url;
        this.createSocket = createSocket;
    }

    /** Delivers every new event matching the filters until the returned function is called. */
    subscribe({ filters, onEvent }: SubscribeParams) {
        const subscriptionId = createSubscriptionId();

        this.subscriptions.set(subscriptionId, {
            filters,
            onEvent: event => {
                if (rememberEventId(this.seenEventIds, event.id)) onEvent(event);
            },
        });
        this.sendRequest(subscriptionId);

        return () => this.closeSubscription(subscriptionId);
    }

    /** What the relay stores for the filters, or what arrived of it within a few seconds. */
    query({ filters }: QueryParams) {
        return new Promise<NostrEvent[]>(resolve => {
            const subscriptionId = createSubscriptionId();
            const events = new Map<string, NostrEvent>();
            const timer = setTimeout(
                () => this.subscriptions.get(subscriptionId)?.onEnd?.(),
                QUERY_TIMEOUT_MS,
            );

            this.subscriptions.set(subscriptionId, {
                filters,
                onEvent: event => events.set(event.id, event),
                onEnd: () => {
                    clearTimeout(timer);
                    this.closeSubscription(subscriptionId);
                    resolve([...events.values()]);
                },
            });
            this.sendRequest(subscriptionId);
        });
    }

    /**
     * Whether the relay took the event (or had it already). Sent once the socket is open; a relay
     * that does not answer in time, or a closed client, count as a refusal.
     */
    publish(event: NostrEvent) {
        return new Promise<boolean>(resolve => {
            if (this.isClosed || this.pendingPublishes.size >= MAX_PENDING_PUBLISHES) {
                resolve(false);

                return;
            }

            const pendingPublish: PendingPublish = {
                frame: JSON.stringify(['EVENT', event]),
                isSent: false,
                resolve,
                timer: setTimeout(() => this.settlePublish(event.id, false), PUBLISH_TIMEOUT_MS),
            };

            this.pendingPublishes.get(event.id)?.resolve(false);
            this.pendingPublishes.set(event.id, pendingPublish);
            this.ensureSocket();
            this.flushPublishes();
        });
    }

    close() {
        this.isClosed = true;
        clearTimeout(this.reconnectTimer);
        clearTimeout(this.connectTimer);
        clearTimeout(this.stableTimer);
        this.pendingPublishes.forEach((_, eventId) => this.settlePublish(eventId, false));
        this.subscriptions.forEach(subscription => subscription.onEnd?.());
        this.subscriptions.clear();
        this.seenEventIds.clear();
        this.socket?.close();
        this.socket = undefined;
        this.onStatusChange = undefined;
    }

    private send(message: unknown[]) {
        if (this.isOpen) this.socket?.send(JSON.stringify(message));
    }

    private sendRequest(subscriptionId: string) {
        const subscription = this.subscriptions.get(subscriptionId);

        if (!subscription) {
            return;
        }

        this.ensureSocket();
        this.send(['REQ', subscriptionId, ...subscription.filters]);
    }

    private closeSubscription(subscriptionId: string) {
        if (this.subscriptions.delete(subscriptionId)) {
            this.send(['CLOSE', subscriptionId]);
        }
    }

    private settlePublish(eventId: string, isAccepted: boolean) {
        const pendingPublish = this.pendingPublishes.get(eventId);

        if (!pendingPublish) {
            return;
        }

        clearTimeout(pendingPublish.timer);
        this.pendingPublishes.delete(eventId);
        pendingPublish.resolve(isAccepted);
    }

    private flushPublishes() {
        if (!this.isOpen) {
            return;
        }

        this.pendingPublishes.forEach(pendingPublish => {
            if (!pendingPublish.isSent) {
                pendingPublish.isSent = true;
                this.socket?.send(pendingPublish.frame);
            }
        });
    }

    private ensureSocket() {
        if (this.isClosed || this.socket || this.reconnectTimer) {
            return;
        }

        this.openSocket();
    }

    private openSocket() {
        // Events of a socket this client has replaced are ignored.
        let socket: RelaySocket | undefined;
        const handlers: RelaySocketHandlers = {
            onOpen: () => this.handleOpen(socket),
            onClose: () => this.handleClose(socket),
            onMessage: data => {
                if (this.socket === socket) this.handleMessage(data);
            },
        };

        try {
            socket = this.createSocket(this.url, handlers);
        } catch {
            // An URL the platform refuses; treated like a relay that is down.
            this.scheduleReconnect();

            return;
        }

        this.socket = socket;
        this.connectTimer = setTimeout(() => socket?.close(), CONNECT_TIMEOUT_MS);
    }

    private handleOpen(socket: RelaySocket | undefined) {
        if (this.socket !== socket) {
            return;
        }

        clearTimeout(this.connectTimer);
        this.isOpen = true;
        this.stableTimer = setTimeout(() => {
            this.reconnectAttempts = 0;
        }, STABLE_CONNECTION_MS);
        this.subscriptions.forEach((subscription, subscriptionId) =>
            this.send(['REQ', subscriptionId, ...subscription.filters]),
        );
        // A frame sent on the dropped socket may never have arrived.
        this.flushPublishes();
        this.onStatusChange?.(true);
    }

    private handleClose(socket: RelaySocket | undefined) {
        if (this.socket !== socket) {
            return;
        }

        const wasOpen = this.isOpen;

        clearTimeout(this.connectTimer);
        clearTimeout(this.stableTimer);
        this.isOpen = false;
        this.socket = undefined;
        this.pendingPublishes.forEach(pendingPublish => {
            pendingPublish.isSent = false;
        });

        if (wasOpen) this.onStatusChange?.(false);

        this.scheduleReconnect();
    }

    private scheduleReconnect() {
        if (this.isClosed || this.reconnectTimer) {
            return;
        }

        const delay = Math.min(MAX_RECONNECT_DELAY_MS, 1000 * 2 ** this.reconnectAttempts);

        this.reconnectAttempts += 1;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = undefined;
            this.openSocket();
        }, delay);
    }

    private handleEvent(subscriptionId: unknown, value: unknown) {
        const subscription =
            typeof subscriptionId === 'string' ? this.subscriptions.get(subscriptionId) : undefined;

        if (!subscription) {
            return;
        }

        const event = parseNostrEvent(value);

        if (event && event.content.length <= MAX_CONTENT_LENGTH && isTimely(event)) {
            subscription.onEvent(event);
        }
    }

    // Every field of a relay message is attacker-controlled.
    private handleMessage(data: unknown) {
        if (typeof data !== 'string' || data.length > MAX_FRAME_LENGTH) {
            return;
        }

        const message = parseJSON(data);

        if (!Array.isArray(message)) {
            return;
        }

        const [type, first, second, third] = message;

        if (type === 'EVENT') {
            this.handleEvent(first, second);
        } else if (type === 'EOSE' && typeof first === 'string') {
            this.subscriptions.get(first)?.onEnd?.();
        } else if (type === 'CLOSED' && typeof first === 'string') {
            this.handleClosedSubscription(first);
        } else if (type === 'OK' && typeof first === 'string') {
            // NIP-01: a relay that has the event already says so with a `duplicate:` prefix.
            const isAccepted =
                second === true || (typeof third === 'string' && third.startsWith('duplicate:'));

            this.settlePublish(first, isAccepted);
        }
    }

    // The relay ended a subscription (auth required, rate limit, unsupported filter). A query just
    // ends; a subscription would silently deliver nothing more, so the socket is dropped and the
    // reconnect backoff tries again later.
    private handleClosedSubscription(subscriptionId: string) {
        const subscription = this.subscriptions.get(subscriptionId);

        if (subscription?.onEnd) {
            subscription.onEnd();
        } else if (subscription) {
            this.socket?.close();
        }
    }
}
