/**
 * Minimal NIP-01 relay client.
 *
 * Deliberately hand-rolled instead of pulling in `nostr-tools`: the only events we
 * ever sign on the DEVICE are address attestations, and their serialization has to
 * agree byte-for-byte with the firmware's naive serializer. A general-purpose
 * library would be free to escape differently. Everything here is built on deps the
 * repo already has (@noble/curves, @noble/hashes) plus the platform WebSocket.
 *
 * TRUST MODEL: the relay carries NO trust. Envelopes are signed by an EPHEMERAL key
 * generated per session (device-signing every relay message would mean a device tap
 * per message). Authenticity comes exclusively from the address attestation inside
 * the payload, which is verified against the contact's identity — never from
 * `event.pubkey`.
 */
import { schnorr } from '@noble/curves/secp256k1.js';
import { sha256 } from '@noble/hashes/sha2.js';

import { bytesToHex, hexToBytes } from 'src/utils/contacts/npub';

export const KIND_ADDRESS_REQUEST = 27924;
export const KIND_ADDRESS_REPLY = 27925;

export type NostrEvent = {
    id: string;
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
    sig: string;
};

const serializeEvent = (e: Omit<NostrEvent, 'id' | 'sig'>) =>
    JSON.stringify([0, e.pubkey, e.created_at, e.kind, e.tags, e.content]);

export const finalizeEvent = (
    draft: Omit<NostrEvent, 'id' | 'sig' | 'pubkey'>,
    secretKey: Uint8Array,
): NostrEvent => {
    const pubkey = bytesToHex(schnorr.getPublicKey(secretKey));
    const unsigned = { ...draft, pubkey };
    const id = bytesToHex(sha256(new TextEncoder().encode(serializeEvent(unsigned))));

    return { ...unsigned, id, sig: bytesToHex(schnorr.sign(hexToBytes(id), secretKey)) };
};

/** Envelope signature check. Says nothing about who the sender really is. */
export const isWellFormedEvent = (value: unknown): value is NostrEvent => {
    if (typeof value !== 'object' || value === null) return false;
    const e = value as Record<string, unknown>;

    return (
        typeof e.id === 'string' &&
        typeof e.pubkey === 'string' &&
        typeof e.created_at === 'number' &&
        typeof e.kind === 'number' &&
        Array.isArray(e.tags) &&
        typeof e.content === 'string' &&
        typeof e.sig === 'string'
    );
};

export type RelayHandler = (event: NostrEvent) => void;

const MAX_CONTENT_BYTES = 8 * 1024;
/** Events older/newer than this are dropped (replay + clock-skew guard). */
const FRESHNESS_WINDOW_S = 10 * 60;

export class RelayClient {
    private socket?: WebSocket;
    private readonly handlers = new Set<RelayHandler>();
    private subscriptionId?: string;

    constructor(
        readonly url: string,
        private readonly secretKey: Uint8Array,
    ) {}

    get pubkey() {
        return bytesToHex(schnorr.getPublicKey(this.secretKey));
    }

    connect(subscribeToNpub: string) {
        return new Promise<void>((resolve, reject) => {
            const socket = new WebSocket(this.url);
            this.socket = socket;
            const timeout = setTimeout(
                () => reject(new Error('Relay connection timed out')),
                15000,
            );

            socket.onopen = () => {
                clearTimeout(timeout);
                this.subscriptionId = bytesToHex(schnorr.getPublicKey(this.secretKey)).slice(0, 16);
                socket.send(
                    JSON.stringify([
                        'REQ',
                        this.subscriptionId,
                        {
                            '#p': [subscribeToNpub],
                            kinds: [KIND_ADDRESS_REQUEST, KIND_ADDRESS_REPLY],
                            since: Math.floor(Date.now() / 1000),
                        },
                    ]),
                );
                resolve();
            };
            socket.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('Relay connection failed'));
            };
            socket.onmessage = ev => this.handleMessage(ev.data);
        });
    }

    /** Every field here is attacker-controlled; treat accordingly. */
    private handleMessage(data: unknown) {
        try {
            if (typeof data !== 'string' || data.length > MAX_CONTENT_BYTES) return;
            const parsed: unknown = JSON.parse(data);
            if (!Array.isArray(parsed) || parsed[0] !== 'EVENT') return;
            const event = parsed[2];
            if (!isWellFormedEvent(event)) return;
            if (event.content.length > MAX_CONTENT_BYTES) return;

            const age = Math.abs(Math.floor(Date.now() / 1000) - event.created_at);
            if (age > FRESHNESS_WINDOW_S) return;

            // the envelope must at least be self-consistent; real authenticity is
            // established by the attestation inside the payload
            const { id, sig, ...rest } = event;
            if (bytesToHex(sha256(new TextEncoder().encode(serializeEvent(rest)))) !== id) return;
            if (!schnorr.verify(hexToBytes(sig), hexToBytes(id), hexToBytes(event.pubkey))) return;

            this.handlers.forEach(h => h(event));
        } catch {
            // never let a malformed relay message escape as an unhandled rejection
        }
    }

    publish(draft: { kind: number; tags: string[][]; content: string }) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            throw new Error('Relay is not connected');
        }
        const event = finalizeEvent(
            { ...draft, created_at: Math.floor(Date.now() / 1000) },
            this.secretKey,
        );
        this.socket.send(JSON.stringify(['EVENT', event]));

        return event;
    }

    on(handler: RelayHandler) {
        this.handlers.add(handler);

        return () => this.handlers.delete(handler);
    }

    dispose() {
        if (this.socket && this.subscriptionId) {
            try {
                this.socket.send(JSON.stringify(['CLOSE', this.subscriptionId]));
            } catch {
                // socket may already be gone
            }
        }
        this.socket?.close();
        this.socket = undefined;
        this.handlers.clear();
    }
}
