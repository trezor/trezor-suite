import { schnorr } from '@noble/curves/secp256k1.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

import { MAX_CONTACTS_RELAY_URLS } from '@suite/settings';

import {
    MAX_DISMISSED_REQUEST_IDS,
    MAX_SERVED_REQUEST_IDS,
} from 'src/reducers/suite/contactsReducer';

import {
    KIND_ADDRESS_REPLY,
    KIND_ADDRESS_REQUEST,
    type NostrEvent,
    RelayClient,
    finalizeEvent,
    isWellFormedEvent,
} from './relayClient';

const CLIENT_SECRET = hexToBytes('33'.repeat(32));
const PEER_SECRET = hexToBytes('44'.repeat(32));
const RECIPIENT_NPUB = 'ab'.repeat(32);

// Stand-in for the platform WebSocket: tests open, close and feed frames by hand.
class MockWebSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSED = 3;
    static instances: MockWebSocket[] = [];

    readyState = MockWebSocket.CONNECTING;
    sentFrames: unknown[] = [];
    onopen?: () => void;
    onclose?: () => void;
    onerror?: () => void;
    onmessage?: (messageEvent: { data: unknown }) => void;

    constructor(readonly url: string) {
        MockWebSocket.instances.push(this);
    }

    send(message: string) {
        this.sentFrames.push(JSON.parse(message));
    }

    close() {
        this.readyState = MockWebSocket.CLOSED;
        this.onclose?.();
    }

    simulateOpen() {
        this.readyState = MockWebSocket.OPEN;
        this.onopen?.();
    }

    simulateFrame(frame: unknown) {
        this.onmessage?.({ data: typeof frame === 'string' ? frame : JSON.stringify(frame) });
    }
}

const originalWebSocket = global.WebSocket;

const getLastSocket = () => {
    const socket = MockWebSocket.instances.at(-1);
    if (!socket) throw new Error('no socket was opened');

    return socket;
};

const connectClient = () => {
    const client = new RelayClient('wss://relay.example.com', CLIENT_SECRET);
    const receivedEvents: NostrEvent[] = [];
    client.on(event => receivedEvents.push(event));
    const connection = client.connect([{ kinds: [KIND_ADDRESS_REQUEST], '#p': [RECIPIENT_NPUB] }]);
    const socket = getLastSocket();
    socket.simulateOpen();
    const [, subscriptionId] = socket.sentFrames[0] as [string, string];

    return { client, connection, socket, subscriptionId, receivedEvents };
};

const createPeerEvent = () =>
    finalizeEvent(
        {
            created_at: Math.floor(Date.now() / 1000),
            kind: KIND_ADDRESS_REQUEST,
            tags: [['p', RECIPIENT_NPUB]],
            content: '0:npub',
        },
        PEER_SECRET,
    );

describe('nostr event signing', () => {
    it('produces a self-consistent, verifiable event', () => {
        const event = finalizeEvent(
            {
                created_at: 1_700_000_000,
                kind: KIND_ADDRESS_REPLY,
                tags: [['p', RECIPIENT_NPUB]],
                content: '{}',
            },
            CLIENT_SECRET,
        );

        expect(isWellFormedEvent(event)).toBe(true);
        expect(event.pubkey).toBe(bytesToHex(schnorr.getPublicKey(CLIENT_SECRET)));
        expect(
            schnorr.verify(hexToBytes(event.sig), hexToBytes(event.id), hexToBytes(event.pubkey)),
        ).toBe(true);
    });

    it('changes the id when any signed field changes', () => {
        const draft = { created_at: 1, kind: KIND_ADDRESS_REPLY, tags: [], content: 'a' };

        expect(finalizeEvent(draft, CLIENT_SECRET).id).not.toBe(
            finalizeEvent({ ...draft, content: 'b' }, CLIENT_SECRET).id,
        );
    });
});

describe('isWellFormedEvent', () => {
    it('rejects anything that is not a full event', () => {
        expect(isWellFormedEvent(null)).toBe(false);
        expect(isWellFormedEvent('nope')).toBe(false);
        expect(isWellFormedEvent({ id: 'x' })).toBe(false);
        expect(isWellFormedEvent({ ...createPeerEvent(), tags: 'no' })).toBe(false);
    });

    it('rejects tags that are not lists of strings', () => {
        const event = createPeerEvent();

        expect(isWellFormedEvent(event)).toBe(true);
        expect(isWellFormedEvent({ ...event, tags: [42] })).toBe(false);
        expect(isWellFormedEvent({ ...event, tags: [['p', 1]] })).toBe(false);
        expect(isWellFormedEvent({ ...event, tags: [] })).toBe(true);
    });

    it('rejects an id, public key or signature that is not hex of the right length', () => {
        const event = createPeerEvent();

        expect(isWellFormedEvent({ ...event, id: event.id.slice(2) })).toBe(false);
        expect(isWellFormedEvent({ ...event, id: event.id.toUpperCase() })).toBe(false);
        expect(isWellFormedEvent({ ...event, pubkey: `${event.pubkey}00` })).toBe(false);
        expect(isWellFormedEvent({ ...event, sig: 'zz'.repeat(64) })).toBe(false);
    });
});

describe('RelayClient', () => {
    beforeAll(() => {
        global.WebSocket = MockWebSocket as unknown as typeof WebSocket;
    });

    afterAll(() => {
        global.WebSocket = originalWebSocket;
    });

    beforeEach(() => {
        MockWebSocket.instances = [];
    });

    it('subscribes on open with a replay limit', async () => {
        const { client, connection, socket, subscriptionId } = connectClient();

        await expect(connection).resolves.toBeUndefined();
        expect(socket.sentFrames).toEqual([
            [
                'REQ',
                subscriptionId,
                { kinds: [KIND_ADDRESS_REQUEST], '#p': [RECIPIENT_NPUB], limit: 400 },
            ],
        ]);
        client.dispose();
    });

    it("keeps the replay of a wallet's relays below the contacts request-id caps", () => {
        const { client, socket } = connectClient();
        const [, , { limit }] = socket.sentFrames[0] as [string, string, { limit: number }];

        expect(MAX_CONTACTS_RELAY_URLS * limit).toBeLessThan(MAX_SERVED_REQUEST_IDS);
        expect(MAX_CONTACTS_RELAY_URLS * limit).toBeLessThan(MAX_DISMISSED_REQUEST_IDS);
        client.dispose();
    });

    it('delivers a verified event once, even if the relay sends it again', () => {
        const { client, socket, subscriptionId, receivedEvents } = connectClient();
        const event = createPeerEvent();

        socket.simulateFrame(['EVENT', subscriptionId, event]);
        socket.simulateFrame(['EVENT', subscriptionId, event]);

        expect(receivedEvents).toEqual([event]);
        client.dispose();
    });

    it('drops events whose id or signature does not match', () => {
        const { client, socket, subscriptionId, receivedEvents } = connectClient();
        const event = createPeerEvent();
        const signatureOfAnotherEvent = finalizeEvent(
            { created_at: event.created_at, kind: event.kind, tags: event.tags, content: '1:npub' },
            PEER_SECRET,
        ).sig;

        socket.simulateFrame(['EVENT', subscriptionId, { ...event, content: '1:npub' }]);
        socket.simulateFrame(['EVENT', subscriptionId, { ...event, sig: signatureOfAnotherEvent }]);
        socket.simulateFrame(['EVENT', subscriptionId, { ...event, sig: 'not hex' }]);

        expect(receivedEvents).toEqual([]);
        client.dispose();
    });

    it('drops oversized, far-future and malformed frames', () => {
        const { client, socket, subscriptionId, receivedEvents } = connectClient();
        const nowS = Math.floor(Date.now() / 1000);

        socket.simulateFrame([
            'EVENT',
            subscriptionId,
            finalizeEvent(
                {
                    created_at: nowS,
                    kind: KIND_ADDRESS_REQUEST,
                    tags: [],
                    content: 'x'.repeat(9000),
                },
                PEER_SECRET,
            ),
        ]);
        socket.simulateFrame([
            'EVENT',
            subscriptionId,
            finalizeEvent(
                {
                    created_at: nowS + 2 * 60 * 60,
                    kind: KIND_ADDRESS_REQUEST,
                    tags: [],
                    content: '',
                },
                PEER_SECRET,
            ),
        ]);
        socket.simulateFrame('{broken json');
        socket.simulateFrame({ not: 'an array' });

        expect(receivedEvents).toEqual([]);
        client.dispose();
    });

    it('queues events published while connecting and sends them on open', () => {
        const client = new RelayClient('wss://relay.example.com', CLIENT_SECRET);
        client.connect([{ kinds: [KIND_ADDRESS_REPLY] }]);
        const socket = getLastSocket();

        const event = client.publish({ kind: KIND_ADDRESS_REPLY, tags: [], content: 'reply' });

        expect(socket.sentFrames).toEqual([]);

        socket.simulateOpen();

        expect(socket.sentFrames).toEqual([
            ['REQ', expect.any(String), { kinds: [KIND_ADDRESS_REPLY], limit: 400 }],
            ['EVENT', event],
        ]);
        expect(event.pubkey).toBe(client.pubkey);
        client.dispose();
    });

    it('reports EOSE only for its own subscription', () => {
        const { client, socket, subscriptionId } = connectClient();
        const onEose = jest.fn();
        client.onEose = onEose;

        socket.simulateFrame(['EOSE', 'someone-else']);
        socket.simulateFrame(['EOSE', subscriptionId]);

        expect(onEose).toHaveBeenCalledTimes(1);
        client.dispose();
    });

    it('drops the connection when the relay closes our subscription', () => {
        // The socket would otherwise stay open and silent while the status still reads connected.
        const { client, socket, subscriptionId } = connectClient();
        const onStatusChange = jest.fn();
        client.onStatusChange = onStatusChange;

        socket.simulateFrame(['CLOSED', 'someone-else', 'error']);

        expect(socket.readyState).toBe(MockWebSocket.OPEN);

        socket.simulateFrame(['CLOSED', subscriptionId, 'rate-limited: slow down']);

        expect(socket.readyState).toBe(MockWebSocket.CLOSED);
        expect(onStatusChange).toHaveBeenCalledWith(false);
        client.dispose();
    });

    it('closes the subscription and goes quiet on dispose', () => {
        const { client, socket, subscriptionId, receivedEvents } = connectClient();
        const onStatusChange = jest.fn();
        client.onStatusChange = onStatusChange;

        client.dispose();
        socket.simulateFrame(['EVENT', subscriptionId, createPeerEvent()]);

        expect(socket.sentFrames.at(-1)).toEqual(['CLOSE', subscriptionId]);
        expect(socket.readyState).toBe(MockWebSocket.CLOSED);
        expect(onStatusChange).not.toHaveBeenCalled();
        expect(receivedEvents).toEqual([]);
    });
});
