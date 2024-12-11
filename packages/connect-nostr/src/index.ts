import {
    getPublicKey,
    finalizeEvent,
    verifyEvent,
    Event,
    generateSecretKey,
} from 'nostr-tools/pure';
import { Relay } from 'nostr-tools/relay';
import * as nip19 from 'nostr-tools/nip19';
import { useWebSocketImplementation } from 'nostr-tools/pool';
import WebSocket from 'ws';
import { PeerToPeerCommunicationClient, PeerToPeerCommunicationClientEvents } from './abstract';

useWebSocketImplementation(WebSocket);

export type { Event } from 'nostr-tools/pure';

export class NostrClient extends PeerToPeerCommunicationClient<PeerToPeerCommunicationClientEvents> {
    sk?: Uint8Array;
    pk?: string;
    nsec?: Uint8Array;
    nsecStr?: nip19.NSec;
    npub?: nip19.NPub;
    relay: Relay;
    events: Event[] = [];

    constructor({ nsecStr, relayUrl }: { nsecStr: string; relayUrl: string }) {
        super();

        if (nsecStr) {
            this.setIdentity(nsecStr);
        }

        this.relay = new Relay(relayUrl);
        this.emit('status', 'disconnected');
    }

    newIdentity() {
        this.sk = generateSecretKey();
        return this.setIdentity(nip19.nsecEncode(this.sk));
    }

    setIdentity(nsecStr: string) {
        const { data, type } = nip19.decode(nsecStr);
        if (type !== 'nsec') {
            throw new Error('invalid nsecStr');
        }
        this.sk = data;
        this.pk = getPublicKey(this.sk);
        this.nsecStr = nip19.nsecEncode(this.sk);
        this.npub = nip19.npubEncode(this.pk);
        this.nsec = nip19.decode(this.nsecStr).data;
    }

    async connect() {
        this.emit('status', 'connecting');
        await this.relay.connect();
        this.emit('status', 'connected');

        console.log(`connected to ${this.relay.url}`);
    }

    async send({ content }: { content: string }) {
        if (!this.nsec) {
            return Promise.resolve({ success: false, error: 'no identity' });
        }
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

        return { success: true as true };
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
