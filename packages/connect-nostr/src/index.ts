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
    type: 'hot-keys' | 'signer';

    constructor({ relayUrl, type, ...rest }: Params) {
        super();

        this.type = type;
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

    setIdentity(params: KeysParams) {
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
            this.signer = params.signer;
            this.npub = nip19.npubEncode(params.npubStr);
            this.nsec = undefined;
            this.nsecStr = undefined;
            this.sk = undefined;
            this.pk = undefined;
        }
        this.emit('identity', { npub: this.npub, nsec: this.nsecStr, type: params.type });
    }

    async connect() {
        this.emit('status', 'connecting');
        await this.relay.connect();
        this.emit('status', 'connected');

        console.log(`connected to ${this.relay.url}`);
    }

    buildMessage({ kind = 1, content, tags = [] }: { kind: number; content: string; tags: any[] }) {
        if (!this.nsec && !this.signer) {
            // return { success: false, error: 'no identity' };
            throw new Error('no identity');
        }

        const eventTemplate = {
            kind,
            created_at: Math.floor(Date.now() / 1000),
            tags: tags.map(tag =>
                tag.map((value: any) =>
                    value.startsWith('npub') ? nip19.decode(value).data.toString() : value,
                ),
            ),
            content,
        };

        if (this.signer) {
            return this.signer(eventTemplate);
        } else {
            return finalizeEvent(eventTemplate, this.nsec);
        }
    }

    async send({ ...params }: { kind: number; content: string; tags: any[] }) {
        const signedEvent = this.buildMessage({ ...params });

        await this.relay.publish(signedEvent);

        return { success: true as const };
    }

    async request({ content, ...params }: { kind: number; content: string; tags: any[] }) {
        const { promiseId, promise } = this.messages.create();

        const json = JSON.parse(content);
        json.id = promiseId.toString();
        const signedEvent = this.buildMessage({ ...params, content: JSON.stringify(json) });

        await this.relay.publish(signedEvent);

        const response = await promise;

        return { success: true as const, response };
    }

    subscribe({ recipientPubkey }: { recipientPubkey: string }) {
        if (this.subscription) {
            this.subscription.close();
        }
        this.subscription = this.relay.subscribe(
            [
                {
                    '#p': [nip19.decode(recipientPubkey).data.toString()],
                    since: Math.floor(Date.now() / 1000),
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
