import WebSocket from 'ws';
import * as nostr from 'nostr-tools/pure';
import * as nip19 from 'nostr-tools/nip19';
import { Relay, type Subscription } from 'nostr-tools/relay';
import { useWebSocketImplementation } from 'nostr-tools/pool';

export type { Event } from 'nostr-tools/pure';

import { createDeferredManager, TypedEmitter } from '@trezor/utils';

useWebSocketImplementation(WebSocket);

type BasePayload = {
    content: string;
};
export abstract class AbstractClient<T extends Record<string, any>> extends TypedEmitter<T> {
    abstract connect(): Promise<void>;
    abstract send({
        content,
    }: BasePayload): Promise<{ success: false; error: string } | { success: true }>;
    abstract request({
        content,
    }: BasePayload): Promise<{ success: false; error: string } | { success: true }>;
    abstract subscribe({ recipientPubkeys }: { recipientPubkeys: string[] }): void;
    abstract dispose(): void;
}

type Signer = (data: any) => any;
type KeysParams =
    | {
          type: 'hot-keys';
          nsecStr: nip19.NSec;
          npubStr?: undefined;
          signer?: undefined;
      }
    | {
          type: 'signer';
          nsecStr?: undefined;
          npubStr: nip19.NPub;
          signer: Signer;
      };

interface AbstractEvents {
    event: nostr.Event;
    status: {
        relayUrl: string;
        relayConnection: 'connected' | 'disconnected';
        identity:
            | { type: 'hot-keys'; nsecStr: nip19.NSec; npubStr: nip19.NPub }
            | { type: 'signer'; npubStr: nip19.NPub; nsecStr: undefined };
    };
}

type Params = KeysParams & {
    relayUrl: string;
};

export class NostrClient extends AbstractClient<AbstractEvents> {
    private readonly messages;
    private subscription?: Subscription;
    // hot-keys mode
    private nsecStr?: nip19.NSec;
    
    public npubStr?: nip19.NPub;
    public relay: Relay;
    public events: nostr.Event[] = [];
    public type: 'hot-keys' | 'signer';
    // signer mode
    public signer?: Signer;

    constructor({ relayUrl, ...params }: Params) {
        super();

        this.relay = new Relay(relayUrl);

        this.messages = createDeferredManager();

        this.type = params.type;
        this.setIdentity(params);

        this.emitStatus();
    }

    private get sk() {
        if (!this.nsecStr) {
            throw new Error('get sk: missing nsecStr');
        }
        const { data, type } = nip19.decode(this.nsecStr);
        if (type !== 'nsec') {
            throw new Error('get sk: invalid type decoded from nsecStr');
        }
        return data;
    }

    private get pk() {
        return nostr.getPublicKey(this.sk);
    }

    private get nsec() {
        if (!this.nsecStr) {
            throw new Error('get nsec: missing nsecStr');
        }
        return nip19.decode(this.nsecStr).data;
    }

    static getNewNsec() {
        return nip19.nsecEncode(nostr.generateSecretKey());
    }

    public status() {
        return {
            relayUrl: this.relay.url,
            relayConnection: this.relay.connected
                ? ('connected' as const)
                : ('disconnected' as const),
            identity: this.getIdentity(),
        };
    }

    public emitStatus() {
        // TODO:
        this.emit('status', this.status());
    }



    public newIdentity() {
        this.nsecStr = NostrClient.getNewNsec();
        return this.setIdentity({
            type: 'hot-keys',
            nsecStr: this.nsecStr,
        });
    }

    public setIdentity(params: KeysParams) {
        // TODO: do we want to return in a public method the `nsecStr` ?
        // TODO: we probably do not want to do that, maybe we could have KeysParams: PublicKeysParams and PrivateKeysParams or similar.
        this.type = params.type;
        if (params.type === 'hot-keys') {
            this.signer = undefined;
            this.nsecStr = params.nsecStr;
            this.npubStr = nip19.npubEncode(this.pk);
        } else {
            this.nsecStr = undefined;
            this.signer = params.signer;
            this.npubStr = params.npubStr;

            // TODO: we will probably receive pk npub encoded from the device later
            if (!params.npubStr.startsWith('npub')) {
                this.npubStr = nip19.npubEncode(params.npubStr);
            } else {
                this.npubStr = params.npubStr;
            }
        }
        this.emitStatus();
    }

    public getIdentity() {
        return this.type === 'hot-keys'
            ? { nsecStr: this.nsecStr!, npubStr: this.npubStr!, type: this.type }
            : { nsecStr: undefined, npubStr: this.npubStr!, type: this.type };
    }

    public async connect() {
        this.relay = new Relay(this.relay.url);
        await this.relay.connect();
        this.emitStatus();
    }

    public buildMessage({ kind = 1, content, tags = [] }: { kind: number; content: string; tags: any[] }) {
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
            // @ts-expect-error: TODO
            return this.signer(eventTemplate).then(res => {
                if (res.success) {
                    return res.payload;
                }
                // TODO: this doesn't work yet. hw has a problem with our serialized event
                throw new Error(res.error);
            });
        } else if (this.nsec) {
            return nostr.finalizeEvent(eventTemplate, this.nsec);
        } else {
            // TODO: improve types. this should not be needed if covered by ts
            throw new Error('no identity');
        }
    }

    public async send({ ...params }: { kind: number; content: string; tags: any[] }) {
        const signedEvent = this.buildMessage({ ...params });

        await this.relay.publish(signedEvent);

        return { success: true as const };
    }

    public async request({ content, ...params }: { kind: number; content: string; tags: any[] }) {
        const { promiseId, promise } = this.messages.create();

        const json = JSON.parse(content);
        json.id = promiseId.toString();
        const signedEvent = this.buildMessage({ ...params, content: JSON.stringify(json) });

        await this.relay.publish(signedEvent);

        const response = await promise;

        return { success: true as const, response };
    }

    public subscribe({ recipientPubkeys }: { recipientPubkeys: string[] }) {
        if (this.subscription) {
            this.subscription.close();
        }
        const onevent = (event: nostr.Event) => {
            this.emit('event', event);

            const resp = JSON.parse(event.content);
            const { request_id, ...data } = resp;

            if (typeof request_id !== 'undefined') {
                this.messages.resolve(Number(request_id), data);
            }
            this.events.push(event);
        };
        const oneose = () => {
            // "End of Stored Events".
            // TODO
        };

        this.subscription = this.relay.subscribe(
            recipientPubkeys.map(recipientPubkey => ({
                '#p': [
                    recipientPubkey.startsWith('npub')
                        ? nip19.decode(recipientPubkey).data.toString()
                        : recipientPubkey,
                ],
                since: Math.floor(Date.now() / 1000),
            })),
            {
                onevent,
                oneose,
            },
        );
    }

    public dispose() {
        this.relay.openSubs.forEach(sub => sub.close());
        this.relay.close();
        this.emitStatus();
    }
}
