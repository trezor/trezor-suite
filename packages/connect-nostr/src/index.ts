import { getPublicKey, finalizeEvent, verifyEvent, Event } from 'nostr-tools/pure';
import { Relay } from 'nostr-tools/relay';
import * as nip19 from 'nostr-tools/nip19';
import { useWebSocketImplementation } from 'nostr-tools/pool';
import WebSocket from 'ws';

import { TypedEmitter } from '@trezor/utils';

useWebSocketImplementation(WebSocket);

interface NostrClientEvents {
    event: Event;
    status: 'connecting' | 'connected' | 'disconnected';
}

export type { Event } from 'nostr-tools/pure';

export class NostrClient extends TypedEmitter<NostrClientEvents> {
    sk: Uint8Array;
    pk: string;
    nsec: Uint8Array;
    npub: nip19.NPub;
    relay: Relay;
    events: Event[] = [];

    constructor({ nsecStr, relayUrl }: { nsecStr: string; relayUrl: string }) {
        super();
        const { data, type } = nip19.decode(nsecStr);
        if (type !== 'nsec') {
            throw new Error('invalid nsecStr');
        }
        this.sk = data;

        this.pk = getPublicKey(this.sk);
        const nsec = nip19.nsecEncode(this.sk);
        this.npub = nip19.npubEncode(this.pk);

        this.nsec = nip19.decode(nsec).data;

        this.relay = new Relay(relayUrl);
        this.emit('status', 'disconnected');
    }

    async connect() {
        this.emit('status', 'connecting');
        await this.relay.connect();
        this.emit('status', 'connected');

        console.log(`connected to ${this.relay.url}`);
    }

    async send({ content }: { content: string }) {
        const eventTemplate = {
            kind: 1,
            created_at: Math.floor(Date.now() / 1000),
            tags: [],
            content,
        };

        // this assigns the pubkey, calculates the event id and signs the event in a single step
        const signedEvent = finalizeEvent(eventTemplate, this.nsec);
        const isGood = verifyEvent(signedEvent);

        console.log('signed event', signedEvent);
        console.log('isGood:', isGood);
        const publishRes = await this.relay.publish(signedEvent);
        console.log('publishRes:', publishRes);
    }

    subscribe({ pubKeys }: { pubKeys: string[] }) {
        this.relay.subscribe(
            [
                {
                    kinds: [1],
                    authors: pubKeys,
                    limit: 1,
                },
            ],
            {
                onevent: event => {
                    this.emit('event', event);
                    this.events.push(event);
                },
                // oneose() {
                //     console.log('=====oneose====');
                //     subscription.close();
                // },
            },
        );
    }

    async dispose() {
        this.emit('status', 'disconnected');

        return this.relay.close();
    }
}
