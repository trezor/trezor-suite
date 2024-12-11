import { getPublicKey, finalizeEvent, Event, generateSecretKey } from 'nostr-tools/pure';
import { Relay, Subscription } from 'nostr-tools/relay';
import * as nip19 from 'nostr-tools/nip19';
import { useWebSocketImplementation } from 'nostr-tools/pool';
import WebSocket from 'ws';

import { createDeferredManager } from '@trezor/utils';
import { PeerToPeerCommunicationClient, PeerToPeerCommunicationClientEvents } from './abstract';

export type { Event } from 'nostr-tools/pure';

useWebSocketImplementation(WebSocket);

type Signer = (data: any) => any;
type KeysParams =
    | {
          type: 'hot-keys';
          nsecStr: `nsec1${string}`;
          npubStr?: undefined;
          signer?: undefined;
      }
    | {
          type: 'signer';
          nsecStr?: undefined;
          npubStr: `npub${string}`;
          signer: Signer;
      };

type Params = KeysParams & {
    relayUrl: string;
};
export class NostrClient extends PeerToPeerCommunicationClient<PeerToPeerCommunicationClientEvents> {
    public readonly relay: Relay;
    private readonly messages;

    private subscription?: Subscription;
    events: Event[] = [];

    // hot(keys) mode
    private sk?: Uint8Array;
    private pk?: string;
    nsec?: Uint8Array;
    nsecStr?: nip19.NSec;
    npub?: nip19.NPub;

    // signer mode
    signer?: Signer;

    constructor({ relayUrl, type, ...rest }: Params) {
        super();

        this.relay = new Relay(relayUrl);

        this.messages = createDeferredManager();

        if (type === 'hot-keys') {
            const { nsecStr } = rest;
            if (!nsecStr) {
                throw new Error('nsecStr is required');
            }
            this.setIdentity({ type, ...rest });
        } else {
            this.signer = rest.signer;

            // this.npub = rest.npubStr;
        }

        this.emit('status', 'disconnected');
    }

    newIdentity() {
        this.sk = generateSecretKey();
        return this.setIdentity({
            type: 'hot-keys',
            nsecStr: nip19.nsecEncode(this.sk),
        });
    }

    private setIdentity(params: KeysParams) {
        if (params.type === 'hot-keys') {
            const { data, type } = nip19.decode(params.nsecStr);
            if (type !== 'nsec') {
                throw new Error('invalid nsecStr');
            }
            this.sk = data;
            this.pk = getPublicKey(this.sk);
            this.nsecStr = nip19.nsecEncode(this.sk);
            this.npub = nip19.npubEncode(this.pk);
            this.nsec = nip19.decode(this.nsecStr).data;
            this.signer = undefined;
        } else {
        }
    }

    async connect() {
        this.emit('status', 'connecting');
        await this.relay.connect();
        this.emit('status', 'connected');

        console.log(`connected to ${this.relay.url}`);
    }

    buildMessage({ content }: { content: string }) {
        if (!this.nsec) {
            // return { success: false, error: 'no identity' };
            throw new Error('no identity');
        }

        const eventTemplate = {
            kind: 1,
            created_at: Math.floor(Date.now() / 1000),
            tags: [],
            content,
        };

        if (this.signer) {
            return this.signer(eventTemplate);
        } else {
            return finalizeEvent(eventTemplate, this.nsec);
        }
    }

    async send({ content }: { content: string }) {
        const signedEvent = this.buildMessage({ content });

        await this.relay.publish(signedEvent);

        return { success: true as const };
    }

    async request({ content }: { content: string }) {
        const { promiseId, promise } = this.messages.create();

        const json = JSON.parse(content);
        json.id = promiseId.toString();
        const signedEvent = this.buildMessage({ content: JSON.stringify(json) });

        await this.relay.publish(signedEvent);

        await promise;

        return { success: true as const, response: promise };
    }

    subscribe({ pubKeys }: { pubKeys: nip19.NPub[] }) {
        if (this.subscription) {
            this.subscription.close();
        }
        this.subscription = this.relay.subscribe(
            [
                {
                    kinds: [1],
                    authors: pubKeys.map(k => nip19.decode(k).data),
                    limit: 1,
                },
            ],
            {
                onevent: event => {
                    this.emit('event', event);

                    const resp = JSON.parse(event.content);
                    console.log('on event parsed', resp);
                    const { request_id, ...data } = resp;

                    if (typeof request_id !== 'undefined') {
                        this.messages.resolve(Number(request_id), data);
                    }
                    this.events.push(event);
                },
                oneose() {
                    // "End of Stored Events".
                    console.log('=====all stored events processed====');
                },
            },
        );
    }

    async dispose() {
        this.emit('status', 'disconnected');

        return this.relay.close();
    }
}
