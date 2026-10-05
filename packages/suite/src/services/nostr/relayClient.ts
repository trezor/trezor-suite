/**
 * Minimal NIP-01 relay client for the contacts address exchange.
 *
 * Hand-rolled instead of pulling in `nostr-tools`: the exchange needs only NIP-01 framing and
 * event signing, which @noble/curves, @noble/hashes and the platform WebSocket already cover.
 *
 * Trust model: the relay carries no trust. Envelopes are signed by an ephemeral key per client,
 * because device-signing every relay message would mean a device tap per message. Authenticity
 * comes only from the device-signed address attestation inside the payload, which is verified
 * against the contact's identity, never from `event.pubkey`.
 */
import { schnorr } from '@noble/curves/secp256k1.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

// Both kinds are in the NIP-01 regular range (1000-9999), which relays store. The exchange relies on
// the backlog a relay replays on subscribe: a peer who was offline when the event was published
// still receives it. Relays keep nothing in the ephemeral range (20000-29999).
export const KIND_ADDRESS_REQUEST = 7924;
export const KIND_ADDRESS_REPLY = 7925;

export type NostrEvent = {
    id: string;
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
    sig: string;
};

const serializeEvent = (event: Omit<NostrEvent, 'id' | 'sig'>) =>
    JSON.stringify([0, event.pubkey, event.created_at, event.kind, event.tags, event.content]);

export const finalizeEvent = (
    draft: Omit<NostrEvent, 'id' | 'sig' | 'pubkey'>,
    secretKey: Uint8Array,
): NostrEvent => {
    const pubkey = bytesToHex(schnorr.getPublicKey(secretKey));
    const unsigned = { ...draft, pubkey };
    const id = bytesToHex(sha256(new TextEncoder().encode(serializeEvent(unsigned))));

    return { ...unsigned, id, sig: bytesToHex(schnorr.sign(hexToBytes(id), secretKey)) };
};

// NIP-01 encodes the id and the x-only public key as 32 bytes and the signature as 64 bytes of
// lowercase hex.
const HEX_32_BYTES_RE = /^[0-9a-f]{64}$/;
const HEX_64_BYTES_RE = /^[0-9a-f]{128}$/;

const isTag = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every(item => typeof item === 'string');

/** Shape check of a relay-delivered event. Says nothing about who sent it. */
export const isWellFormedEvent = (value: unknown): value is NostrEvent => {
    if (typeof value !== 'object' || value === null) return false;
    const event = value as Record<string, unknown>;

    return (
        typeof event.id === 'string' &&
        HEX_32_BYTES_RE.test(event.id) &&
        typeof event.pubkey === 'string' &&
        HEX_32_BYTES_RE.test(event.pubkey) &&
        typeof event.created_at === 'number' &&
        typeof event.kind === 'number' &&
        Array.isArray(event.tags) &&
        event.tags.every(isTag) &&
        typeof event.content === 'string' &&
        typeof event.sig === 'string' &&
        HEX_64_BYTES_RE.test(event.sig)
    );
};

export type RelayHandler = (event: NostrEvent) => void;

/** NIP-01 REQ filter. A subscription may carry several; the relay ORs them. */
export type RelayFilter = {
    kinds: number[];
    '#p'?: string[];
};

// Address-exchange payloads are small, anything larger is not ours.
const MAX_CONTENT_LENGTH = 8 * 1024;
// Fits an EVENT frame at the content cap even if every content character arrives as a \uXXXX escape.
const MAX_FRAME_LENGTH = 64 * 1024;
// Bounds memory against a relay flooding distinct valid events.
const MAX_SEEN_EVENT_IDS = 1024;
// Events dated far in the future are dropped. Old events are kept on purpose, because the stored
// backlog is how an exchange sent while we were offline arrives.
const FUTURE_SKEW_S = 60 * 60;
// Stored events a relay may replay per filter. The contacts subscription has one filter, and the
// replay of every relay of a wallet (at most MAX_CONTACTS_RELAY_URLS) must stay below the contacts
// reducer's caps on remembered request ids (2000). Otherwise a pool rebuild could evict an id that
// another relay still replays, and the request would be served again or come back after a dismissal.
const SUBSCRIPTION_LIMIT = 400;
const CONNECT_TIMEOUT_MS = 15_000;
const MAX_RECONNECT_DELAY_MS = 30_000;
// The backoff resets only after a connection stayed open this long. A relay that accepts and
// immediately drops the socket would otherwise be hammered at about 1 Hz.
const STABLE_CONNECTION_MS = 30_000;
// Bounds the frames queued while the socket is (re)connecting.
const MAX_OUTBOX = 50;

export class RelayClient {
    private socket?: WebSocket;
    private readonly handlers = new Set<RelayHandler>();
    private subscriptionId?: string;
    // A relay may deliver the same event more than once.
    private readonly seenEventIds = new Set<string>();
    private filters: RelayFilter[] = [];
    private isDisposed = false;
    private reconnectTimer?: ReturnType<typeof setTimeout>;
    private stableTimer?: ReturnType<typeof setTimeout>;
    private reconnectAttempts = 0;
    private outbox: string[] = [];
    /** Connection status changes, for the relay status indicator. */
    onStatusChange?: (isConnected: boolean) => void;
    /** The relay has sent all stored events for the subscription (NIP-01 EOSE). */
    onEose?: () => void;

    constructor(
        readonly url: string,
        private readonly secretKey: Uint8Array,
    ) {}

    get pubkey() {
        return bytesToHex(schnorr.getPublicKey(this.secretKey));
    }

    /**
     * Connects and subscribes with the given filters, then reconnects on every drop until
     * `dispose()`. The relay replays what it stored for the filters, so the peer need not be online
     * at the same time. Resolves on the first successful open. A different filter set needs a new
     * client, which also starts with an empty dedup so the replayed backlog reaches the handlers again.
     */
    connect(filters: RelayFilter[]) {
        this.filters = filters;
        this.isDisposed = false;

        return this.open();
    }

    private open() {
        return new Promise<void>((resolve, reject) => {
            if (this.isDisposed) {
                resolve();

                return;
            }
            let socket: WebSocket;
            try {
                socket = new WebSocket(this.url);
            } catch {
                this.scheduleReconnect();
                reject(new Error('Relay connection failed'));

                return;
            }
            this.socket = socket;
            const timeout = setTimeout(() => {
                try {
                    socket.close();
                } catch {
                    // The socket may already be closing.
                }
                reject(new Error('Relay connection timed out'));
            }, CONNECT_TIMEOUT_MS);

            socket.onopen = () => {
                clearTimeout(timeout);
                this.armStabilityReset();
                this.subscribe();
                this.flushOutbox();
                this.onStatusChange?.(true);
                resolve();
            };
            // The close event follows and schedules the reconnect.
            socket.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('Relay connection failed'));
            };
            socket.onclose = () => {
                this.clearStabilityReset();
                this.onStatusChange?.(false);
                if (!this.isDisposed) this.scheduleReconnect();
            };
            socket.onmessage = messageEvent => this.handleMessage(messageEvent.data);
        });
    }

    private subscribe() {
        if (!this.socket || this.filters.length === 0) return;
        this.subscriptionId = this.pubkey.slice(0, 16);
        // No `since`: the events stored while we were offline are exactly what we want.
        this.socket.send(
            JSON.stringify([
                'REQ',
                this.subscriptionId,
                ...this.filters.map(filter => ({ ...filter, limit: SUBSCRIPTION_LIMIT })),
            ]),
        );
    }

    private armStabilityReset() {
        this.clearStabilityReset();
        this.stableTimer = setTimeout(() => {
            this.stableTimer = undefined;
            this.reconnectAttempts = 0;
        }, STABLE_CONNECTION_MS);
    }

    private clearStabilityReset() {
        if (this.stableTimer) {
            clearTimeout(this.stableTimer);
            this.stableTimer = undefined;
        }
    }

    private scheduleReconnect() {
        if (this.isDisposed || this.reconnectTimer) return;
        const delay = Math.min(MAX_RECONNECT_DELAY_MS, 1000 * 2 ** this.reconnectAttempts);
        this.reconnectAttempts += 1;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = undefined;
            // A failed attempt schedules the next one from the socket's close handler.
            this.open().catch(() => {});
        }, delay);
    }

    private flushOutbox() {
        if (this.socket?.readyState !== WebSocket.OPEN) return;
        const pending = this.outbox;
        this.outbox = [];
        for (const message of pending) this.socket.send(message);
    }

    // Every field of a relay message is attacker-controlled.
    private handleMessage(data: unknown) {
        try {
            if (typeof data !== 'string' || data.length > MAX_FRAME_LENGTH) return;
            const parsed: unknown = JSON.parse(data);
            if (!Array.isArray(parsed)) return;

            if (parsed[0] === 'EOSE' && parsed[1] === this.subscriptionId) {
                this.onEose?.();

                return;
            }

            // The relay terminated our subscription (auth required, rate limit, unsupported
            // filter). The socket stays open but delivers nothing more, while the status would
            // still read connected. Closing it hands recovery to the reconnect backoff, so a relay
            // that keeps refusing is treated like one that is down. Re-sending the REQ on the same
            // socket would be refused again at once, without any backoff.
            if (parsed[0] === 'CLOSED' && parsed[1] === this.subscriptionId) {
                this.socket?.close();

                return;
            }

            if (parsed[0] !== 'EVENT') return;
            const event: unknown = parsed[2];
            if (!isWellFormedEvent(event)) return;
            if (event.content.length > MAX_CONTENT_LENGTH) return;
            if (event.created_at > Math.floor(Date.now() / 1000) + FUTURE_SKEW_S) return;

            // The envelope must at least be self-consistent. Who sent it is established by the
            // attestation inside the payload.
            const { id, sig, ...unsigned } = event;
            if (bytesToHex(sha256(new TextEncoder().encode(serializeEvent(unsigned)))) !== id) {
                return;
            }
            if (!schnorr.verify(hexToBytes(sig), hexToBytes(id), hexToBytes(event.pubkey))) return;

            // A re-delivered event would repeat the handlers' side effects (storage writes,
            // relay publishes).
            if (this.seenEventIds.has(id)) return;
            if (this.seenEventIds.size >= MAX_SEEN_EVENT_IDS) {
                const oldestId = this.seenEventIds.values().next().value;
                if (oldestId !== undefined) this.seenEventIds.delete(oldestId);
            }
            this.seenEventIds.add(id);

            this.handlers.forEach(handler => handler(event));
        } catch {
            // A malformed relay message (bad JSON or hex) must never escape as an exception.
        }
    }

    /**
     * Signs the draft with this client's ephemeral key and publishes it. While the socket is
     * (re)connecting the frame is queued and sent on the next open. It is dropped when the client
     * is disposed or the queue is full, so a publish is not a delivery.
     */
    publish(draft: { kind: number; tags: string[][]; content: string }) {
        const event = finalizeEvent(
            { ...draft, created_at: Math.floor(Date.now() / 1000) },
            this.secretKey,
        );
        const message = JSON.stringify(['EVENT', event]);
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(message);
        } else if (!this.isDisposed && this.outbox.length < MAX_OUTBOX) {
            this.outbox.push(message);
        }

        return event;
    }

    on(handler: RelayHandler) {
        this.handlers.add(handler);

        return () => this.handlers.delete(handler);
    }

    dispose() {
        this.isDisposed = true;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }
        this.clearStabilityReset();
        if (this.socket && this.subscriptionId) {
            try {
                this.socket.send(JSON.stringify(['CLOSE', this.subscriptionId]));
            } catch {
                // The socket may already be gone.
            }
        }
        // The close event fires asynchronously. Without its listener a disposed client cannot
        // report "disconnected" after a new client for the same relay has connected.
        this.onStatusChange = undefined;
        this.socket?.close();
        this.socket = undefined;
        this.handlers.clear();
        this.outbox = [];
        this.seenEventIds.clear();
    }
}
